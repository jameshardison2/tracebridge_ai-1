import { NextResponse } from "next/server";
import { adminDb, verifyIdToken } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

/**
 * GET /api/team
 * Returns the team for a given user, or null if they don't belong to one.
 */
export async function GET(request: Request) {
    try {
        if (!adminDb) {
            return NextResponse.json({ success: false, error: "Firebase not configured" }, { status: 503 });
        }

        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        
        const idToken = authHeader.split("Bearer ")[1];
        const verification = await verifyIdToken(idToken);
        if (!verification.success || !verification.uid) {
            return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
        }
        const userId = verification.uid;

        // Find teams where user is a member
        const teamsSnapshot = await adminDb.collection("teams").get();
        const userTeams = teamsSnapshot.docs.filter(doc => {
            const data = doc.data();
            return data.ownerId === userId ||
                (data.members || []).some((m: any) => m.uid === userId);
        });

        if (userTeams.length === 0) {
            return NextResponse.json({ success: true, data: { teams: [] } });
        }

        const teamsData = userTeams.map(teamDoc => {
            const data = teamDoc.data();
            return {
                id: teamDoc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
                members: data.members?.map((m: any) => ({
                    ...m,
                    joinedAt: m.joinedAt?.toDate ? m.joinedAt.toDate().toISOString() : null
                })) || []
            };
        });

        // Get team upload stats (for all teams combined, or we can just send back raw stats later if needed)
        // For simplicity, we'll return the teams array. The frontend can calculate stats per team or we just send 0.
        // Actually, let's keep stats for the active team on the frontend.
        
        return NextResponse.json({
            success: true,
            data: {
                teams: teamsData,
                // Stats will be computed dynamically on the frontend or we return an aggregate
                stats: {
                    totalUploads: 0,
                    totalMembers: 0,
                },
            },
        });
    } catch (error) {
        console.error("Team GET error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to fetch team" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/team
 * Actions: create, invite, remove, update
 */
export async function POST(request: Request) {
    try {
        if (!adminDb) {
            return NextResponse.json({ success: false, error: "Firebase not configured" }, { status: 503 });
        }

        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        
        const idToken = authHeader.split("Bearer ")[1];
        const verification = await verifyIdToken(idToken);
        if (!verification.success || !verification.uid) {
            return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
        }
        const authUserId = verification.uid;

        const { action, userId, teamName, memberEmail, teamId } = await request.json();

        // Enforce that the user performing the action is the authenticated user
        if (userId && userId !== authUserId) {
            return NextResponse.json({ success: false, error: "Forbidden: UID mismatch" }, { status: 403 });
        }
        const effectiveUserId = authUserId;

        if (!action) {
            return NextResponse.json({ success: false, error: "Missing action" }, { status: 400 });
        }

        switch (action) {
            case "create": {
                if (!teamName) {
                    return NextResponse.json({ success: false, error: "Missing teamName" }, { status: 400 });
                }

                const teamRef = await adminDb.collection("teams").add({
                    name: teamName,
                    ownerId: effectiveUserId,
                    members: [],
                    createdAt: Timestamp.now(),
                });

                return NextResponse.json({
                    success: true,
                    data: { teamId: teamRef.id, message: "Team created" },
                });
            }

            case "invite": {
                if (!teamId || !memberEmail) {
                    return NextResponse.json({ success: false, error: "Missing teamId or memberEmail" }, { status: 400 });
                }

                const teamDoc = await adminDb.collection("teams").doc(teamId).get();
                if (!teamDoc.exists) {
                    return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
                }

                const team = teamDoc.data()!;
                if (team.ownerId !== effectiveUserId && memberEmail !== (await adminDb.collection('users').doc(effectiveUserId).get()).data()?.email) {
                    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
                }

                // Check if already a member
                const existing = (team.members || []).find((m: any) => m.email === memberEmail);
                if (existing) {
                    return NextResponse.json({ success: false, error: "Already a member" }, { status: 400 });
                }

                const newMember = {
                    uid: `pending_${Date.now()}`,
                    email: memberEmail,
                    displayName: memberEmail.split("@")[0],
                    role: "member",
                    joinedAt: Timestamp.now(),
                };

                await adminDb.collection("teams").doc(teamId).update({
                    members: [...(team.members || []), newMember],
                });

                return NextResponse.json({
                    success: true,
                    data: { message: `Invited ${memberEmail}` },
                });
            }

            case "remove": {
                if (!teamId || !memberEmail) {
                    return NextResponse.json({ success: false, error: "Missing teamId or memberEmail" }, { status: 400 });
                }

                const removeTeamDoc = await adminDb.collection("teams").doc(teamId).get();
                if (!removeTeamDoc.exists) {
                    return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
                }

                const removeTeam = removeTeamDoc.data()!;
                if (removeTeam.ownerId !== userId) {
                    return NextResponse.json({ success: false, error: "Only team owner can remove" }, { status: 403 });
                }

                const updatedMembers = (removeTeam.members || []).filter(
                    (m: any) => m.email !== memberEmail
                );

                await adminDb.collection("teams").doc(teamId).update({
                    members: updatedMembers,
                });

                return NextResponse.json({
                    success: true,
                    data: { message: `Removed ${memberEmail}` },
                });
            }

            default:
                return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
        }
    } catch (error) {
        console.error("Team POST error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Team operation failed" },
            { status: 500 }
        );
    }
}
