const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-admin-key.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  const uploads = await db.collection("uploads").where("userId", "==", "cXLFmVki6cenpCAHGZV84xolcJF2").get();
  console.log("Uploads found:", uploads.size);

  const logs = await db.collection("auditLogs").where("details.uploadId", "!=", null).limit(5).get();
  console.log("Audit Logs found:", logs.size);
}
run();
