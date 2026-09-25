import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as readline from 'readline';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import { FieldValue } from 'firebase-admin/firestore';

import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Initialize Firebase Admin
if (!admin.apps.length) {
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace escaped newlines with actual newlines
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            })
        });
    } else {
        admin.initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-tracebridge',
        });
    }
}
const db = admin.firestore();

// (Gemini initialization removed for Option B - see below)

const JSONL_FILE_PATH = 'spark-deliverables/Evaluation_Dataset/fda_510k_filtered.jsonl';
const COLLECTION_NAME = 'knowledgeBase';

// TODO (Milestone 1): Implement PDF scraping logic here
async function fetchAndExtractPDFText(kNumber: string): Promise<string> {
    // 1. Construct the URL: https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=<kNumber>
    // 2. Fetch the HTML page and find the link to the actual PDF summary
    // 3. Download the PDF and extract the raw text
    // 4. Return the extracted text
    return "Placeholder text... you must implement this!";
}

async function generateEmbedding(text: string): Promise<number[]> {
    // TODO (Milestone 1): Initialize your own Gemini or OpenAI API client and generate embeddings
    // const result = await yourEmbeddingModel.embedContent(text);
    // return result.embedding.values.slice(0, 768);
    return [0.0, 0.0, 0.0]; // Placeholder
}

async function runSeed() {
    console.log(`Starting Vector DB Seeding process...`);
    
    // Safety check for API key
    if (!process.env.GEMINI_API_KEY) {
        console.warn("WARNING: No GEMINI_API_KEY found in .env. Embeddings will fail.");
    }

    if (!fs.existsSync(JSONL_FILE_PATH)) {
        console.error(`ERROR: Could not find dataset at ${JSONL_FILE_PATH}`);
        process.exit(1);
    }

    // Parse command line arguments for a limit (e.g. --limit 5)
    let limit = 100; // Default safety limit
    const args = process.argv.slice(2);
    const limitIndex = args.indexOf('--limit');
    if (limitIndex > -1 && args.length > limitIndex + 1) {
        limit = parseInt(args[limitIndex + 1], 10);
    }
    console.log(`Limit set to ${limit} records to prevent accidental billing/overuse.`);

    const fileStream = fs.createReadStream(JSONL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let count = 0;
    let successCount = 0;

    for await (const line of rl) {
        if (count >= limit) {
            console.log(`Reached limit of ${limit} records. Stopping stream.`);
            break;
        }

        try {
            const record = JSON.parse(line);
            
            const deviceName = record.device_name || record.openfda?.device_name || "Unknown Device";
            const kNumber = record.k_number || "Unknown";
            const summaryText = record.statement_or_summary;
            const applicant = record.applicant || "Unknown Applicant";
            const category = record.advisory_committee_description || "Unknown Category";

            // If there's no summary text, we can't create a meaningful embedding for the text
            if (!summaryText || summaryText.trim() === '') {
                console.log(`Skipping ${kNumber} - No statement or summary text available.`);
                continue;
            }

            console.log(`[${count + 1}/${limit}] Processing ${kNumber}: ${deviceName}`);
            
            // TODO (Milestone 1): Fetch the actual summary text from the FDA website!
            const extractedSummaryText = await fetchAndExtractPDFText(kNumber);

            // Generate the embedding vector using the scraped text
            const embeddingVector = await generateEmbedding(extractedSummaryText);
            
            if (embeddingVector.length > 0) {
                // Prepare document for Firestore Vector Search
                const docData = {
                    kNumber,
                    deviceName,
                    applicant,
                    category,
                    // Use the newly scraped text instead of the useless indicator
                    summary: extractedSummaryText,
                    embedding_vector: FieldValue.vector(embeddingVector),
                    timestamp: FieldValue.serverTimestamp()
                };

                // Save to Firestore
                await db.collection(COLLECTION_NAME).doc(kNumber).set(docData);
                successCount++;
                console.log(` -> Successfully saved ${kNumber}.`);
            }

            count++;
            
            // Add a small delay to avoid hitting rate limits on Gemini API
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error(`Error processing line ${count + 1}:`, error);
        }
    }

    console.log(`\n=== Seeding Complete ===`);
    console.log(`Total records processed: ${count}`);
    console.log(`Successfully embedded and saved: ${successCount}`);
    process.exit(0);
}

runSeed();
