import "dotenv/config";
import { adminAuth } from "../src/lib/firebase-admin";

async function main() {
    console.log("🚀 Creating 50 Beta Accounts in Firebase Auth...\n");

    if (!adminAuth) {
        console.error("❌ Firebase Admin Auth not initialized.");
        process.exit(1);
    }

    const password = "TraceBridge2026!";
    let createdCount = 0;

    for (let i = 51; i <= 150; i++) {
        const email = `tester${i}@tracebridge.ai`;
        const displayName = `QA Tester ${i}`;
        
        try {
            await adminAuth.createUser({
                email,
                password,
                displayName,
            });
            console.log(`  ✓ Created user: ${email}`);
            createdCount++;
        } catch (error: any) {
            if (error.code === 'auth/email-already-exists') {
                console.log(`  - Skipped: ${email} (Already exists)`);
            } else {
                console.error(`  ✗ Failed to create ${email}:`, error.message);
            }
        }
    }

    console.log(`\n✅ Successfully created ${createdCount} new beta accounts!`);
    console.log(`\n🔑 Default Password for all accounts: ${password}`);
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
