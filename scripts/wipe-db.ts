import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
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
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            })
        });
    } else {
        console.error("Missing Firebase Admin credentials in .env.local");
        process.exit(1);
    }
}
const db = admin.firestore();
const COLLECTION_NAME = 'knowledgeBase';

async function deleteCollection(db: any, collectionPath: string, batchSize: number) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db: any, query: any, resolve: any) {
    const snapshot = await query.get();
    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`Deleted ${batchSize} documents from ${COLLECTION_NAME}...`);

    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

async function runWipe() {
    console.log(`Starting deletion of collection: ${COLLECTION_NAME}`);
    try {
        await deleteCollection(db, COLLECTION_NAME, 500);
        console.log(`Successfully wiped collection: ${COLLECTION_NAME}`);
    } catch (error) {
        console.error("Error wiping collection:", error);
    }
    process.exit(0);
}

runWipe();
