const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

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
        console.error("Missing credentials");
        process.exit(1);
    }
}
const db = admin.firestore();
const COLLECTION_NAME = 'knowledgeBase';

async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();
    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
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
        const collectionRef = db.collection(COLLECTION_NAME);
        const query = collectionRef.orderBy('__name__').limit(500);
        await new Promise((resolve, reject) => {
            deleteQueryBatch(db, query, resolve).catch(reject);
        });
        console.log(`Successfully wiped collection: ${COLLECTION_NAME}`);
    } catch (error) {
        console.error("Error wiping collection:", error);
    }
    process.exit(0);
}

runWipe();
