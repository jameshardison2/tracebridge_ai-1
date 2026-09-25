import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

export interface DocumentChunk {
    id: string;
    uploadId: string;
    fileName: string;
    text: string;
    startIndex: number;
    endIndex: number;
}

/**
 * Extracts raw text from a document buffer (PDF, DOCX, TXT)
 */
export async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === "application/pdf") {
        try {
            const data = await pdfParse(buffer);
            return data.text;
        } catch (e) {
            console.error("Failed to parse PDF:", e);
            return "";
        }
    } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        try {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } catch (e) {
            console.error("Failed to parse DOCX:", e);
            return "";
        }
    } else if (mimeType === "text/plain") {
        return buffer.toString("utf-8");
    }
    return "";
}

/**
 * Splits text into semantic chunks of roughly ~1000 characters with ~200 characters overlap
 */
export function chunkText(text: string, fileName: string, uploadId: string, chunkSize = 1000, overlap = 200): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    if (!text) return chunks;

    // Simple overlapping window chunking
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
        let endIndex = startIndex + chunkSize;
        
        // Try to snap to the nearest paragraph or sentence break if possible
        if (endIndex < text.length) {
            const nextNewline = text.indexOf('\n', endIndex);
            const nextPeriod = text.indexOf('. ', endIndex);
            
            if (nextNewline !== -1 && nextNewline - endIndex < 500) {
                endIndex = nextNewline + 1;
            } else if (nextPeriod !== -1 && nextPeriod - endIndex < 500) {
                endIndex = nextPeriod + 2;
            }
        } else {
            endIndex = text.length;
        }

        const chunkTextContent = text.substring(startIndex, endIndex).trim();
        
        if (chunkTextContent.length > 50) { // Ignore tiny empty chunks
            chunks.push({
                id: `${fileName}_chunk_${chunkIndex}`,
                uploadId,
                fileName,
                text: chunkTextContent,
                startIndex,
                endIndex
            });
            chunkIndex++;
        }

        startIndex = endIndex - overlap;
        if (startIndex < 0) startIndex = 0;
        
        // Prevent infinite loops if snapping goes wrong
        if (startIndex >= endIndex) {
            startIndex = endIndex + 1;
        }
    }

    return chunks;
}

/**
 * Generates embeddings for chunks and uploads them to Firestore
 */
export async function embedAndStoreChunks(chunks: DocumentChunk[], uploadId: string): Promise<void> {
    if (!adminDb) return;
    if (chunks.length === 0) return;

    console.log(`[Document Processor] Generating embeddings for ${chunks.length} chunks...`);

    const batch = adminDb.batch();
    const collectionRef = adminDb.collection(`uploads/${uploadId}/documentChunks`);
    
    let processedCount = 0;

    // Process in smaller batches to avoid rate limits
    for (const chunk of chunks) {
        try {
            // Include filename in the text being embedded for better context retrieval
            const textToEmbed = `File: ${chunk.fileName}\n\n${chunk.text}`;
            const result = await model.embedContent(textToEmbed);
            const embedding = result.embedding.values.slice(0, 768); // Slice to 768 to fit Firestore 2048 limit

            const docRef = collectionRef.doc(chunk.id);
            batch.set(docRef, {
                uploadId: chunk.uploadId,
                fileName: chunk.fileName,
                text: chunk.text,
                embedding: FieldValue.vector(embedding)
            });

            processedCount++;
            
            // Firestore limit is 500 writes per batch
            if (processedCount % 450 === 0) {
                await batch.commit();
                console.log(`[Document Processor] Committed batch of 450 chunks`);
                // Create a new batch, wait a bit to avoid API rate limits on embeddings
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch (err) {
            console.error(`[Document Processor] Failed to embed chunk ${chunk.id}:`, err);
        }
    }

    if (processedCount % 450 !== 0) {
        await batch.commit();
    }
    
    console.log(`[Document Processor] Successfully stored ${processedCount} embedded chunks for upload ${uploadId}.`);
}

/**
 * Retrieve top K most relevant chunks for a given query
 */
export async function retrieveRelevantChunks(uploadId: string, query: string, limit = 5): Promise<string> {
    if (!adminDb) return "";

    try {
        const queryEmbeddingResult = await model.embedContent(query);
        const queryEmbedding = queryEmbeddingResult.embedding.values.slice(0, 768);

        // Vector Search against user documents
        const chunksRef = adminDb.collection(`uploads/${uploadId}/documentChunks`);
        
        // findNearest requires an index, or it can run in-memory if the collection is very small.
        // For a single upload, the collection is small enough that we can just pull all and do cosine similarity,
        // BUT Firestore natively supports findNearest so we use it.
        const snapshot = await chunksRef.findNearest('embedding', FieldValue.vector(queryEmbedding), {
            limit,
            distanceMeasure: 'COSINE'
        }).get();

        if (snapshot.empty) return "";

        let context = "";
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            context += `\n--- Excerpt from ${data.fileName} ---\n${data.text}\n`;
        });

        return context;
    } catch (e) {
        console.error("[Document Processor] Failed to retrieve chunks:", e);
        return "";
    }
}

/**
 * Retrieve top K most relevant FDA precedents from the Knowledge Base
 */
export async function retrieveRelevantPrecedents(query: string, limit = 3): Promise<string> {
    if (!adminDb) return "";

    try {
        const queryEmbeddingResult = await model.embedContent(query);
        const queryEmbedding = queryEmbeddingResult.embedding.values.slice(0, 768);

        const kbRef = adminDb.collection("knowledgeBase");
        
        const snapshot = await kbRef.findNearest('embedding', FieldValue.vector(queryEmbedding), {
            limit,
            distanceMeasure: 'COSINE'
        }).get();

        if (snapshot.empty) return "";

        let context = "";
        snapshot.docs.forEach((doc, i) => {
            const data = doc.data();
            context += `${i+1}. K-Number: ${data.k_number}\nDevice: ${data.device_name}\nDeficiencies Cited by FDA:\n${data.text_content}\n\n`;
        });

        return context;
    } catch (e) {
        console.error("[Document Processor] Failed to retrieve precedents:", e);
        return "";
    }
}
