import * as dotenv from "dotenv";
import * as path from "path";
// Load environment variables before anything else
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDb } from "../lib/firebase-admin";
import * as fs from "fs/promises";
import { FieldValue } from "firebase-admin/firestore";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in environment.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function main() {
  if (!adminDb) {
    console.error("Firebase Admin not initialized. Check your credentials.");
    process.exit(1);
  }

  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
  const chunksFilePath = path.join(__dirname, "rag-chunks.jsonl");

  let fileContent;
  try {
    fileContent = await fs.readFile(chunksFilePath, "utf8");
  } catch (error) {
    console.error(`Could not read ${chunksFilePath}:`, error);
    process.exit(1);
  }

  const lines = fileContent.split("\n").filter((line) => line.trim() !== "");
  console.log(`Found ${lines.length} chunks to process.`);

  let successCount = 0;
  let errorCount = 0;

  for (const line of lines) {
    try {
      const chunk = JSON.parse(line);
      
      // We only embed if there is text content or a significant text representation
      const textToEmbed = chunk.text_content || `${chunk.device_name} (Class ${chunk.device_class}) - Decision: ${chunk.decision}`;

      console.log(`Embedding: ${chunk.k_number}...`);
      
      const result = await model.embedContent(textToEmbed);
      // Slice the embedding to 768 dimensions to fit within Firestore's 2048 limit
      // (Gemini embedding models support Matryoshka representations, so slicing retains core semantic meaning)
      const embedding = result.embedding.values.slice(0, 768);

      const docRef = adminDb.collection("knowledgeBase").doc(chunk.id.replace(':', '_'));
      
      await docRef.set({
        ...chunk,
        embedding: FieldValue.vector(embedding),
        embedded_at: new Date().toISOString()
      });

      console.log(`✓ Stored ${chunk.k_number}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed processing line:`, error);
      errorCount++;
    }
  }

  console.log(`\nFinished embedding knowledge base.`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  process.exit(0);
}

main().catch(console.error);
