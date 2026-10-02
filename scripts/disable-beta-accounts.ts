import "dotenv/config";
import { adminAuth } from "../src/lib/firebase-admin";

async function main() {
    console.log("🚀 Disabling Beta Accounts (tester51 to tester150) in Firebase Auth...\n");

    if (!adminAuth) {
        console.error("❌ Firebase Admin Auth not initialized.");
        process.exit(1);
    }

    let disabledCount = 0;

    for (let i = 51; i <= 150; i++) {
        const email = `tester${i}@tracebridge.ai`;
        try {
            const userRecord = await adminAuth.getUserByEmail(email);
            await adminAuth.updateUser(userRecord.uid, {
                disabled: true
            });
            console.log(`  ✓ Disabled user: ${email}`);
            disabledCount++;
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log(`  - Skipped: ${email} (Not found)`);
            } else {
                console.error(`  ✗ Failed to disable ${email}:`, error.message);
            }
        }
    }

    console.log(`\n✅ Successfully disabled ${disabledCount} beta accounts!`);
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
