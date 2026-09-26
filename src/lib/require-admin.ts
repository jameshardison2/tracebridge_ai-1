import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";

/**
 * Guard for operator-only routes (seeding global rules, running live Gemini evals).
 *
 * The caller must send a valid Firebase ID token AND their email must be listed
 * in the ADMIN_EMAILS env var (comma-separated). If ADMIN_EMAILS is unset, every
 * request is refused, so a missing config fails closed rather than open.
 *
 * Returns null when the caller is allowed, otherwise a response to return as-is.
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const verification = await verifyIdToken(authHeader.slice("Bearer ".length));
    if (!verification.success || !verification.email) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const allowed = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

    if (!allowed.includes(verification.email.toLowerCase())) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return null;
}
