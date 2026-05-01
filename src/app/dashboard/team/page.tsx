"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
    Users,
    UserPlus,
    Crown,
    Mail,
    Trash2,
    Loader2,
    Plus,
    Shield,
    MessageSquare,
    Lightbulb,
    Calendar,
    CheckCircle2
} from "lucide-react";

interface TeamMember {
    uid: string;
    email: string;
    displayName?: string;
    role: "admin" | "member";
    joinedAt: any;
}

interface TeamData {
    id: string;
    name: string;
    ownerId: string;
    members: TeamMember[];
}

export default function TeamPage() {
    const { user } = useAuth();
    const [team, setTeam] = useState<TeamData | null>(null);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [teamName, setTeamName] = useState("");
    const [creating, setCreating] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [stats, setStats] = useState({ totalUploads: 0, totalMembers: 0 });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Feedback States
    const [feedbackText, setFeedbackText] = useState("");
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [votedFeature, setVotedFeature] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchTeam();
    }, [user]);

    const fetchTeam = async () => {
        try {
            const res = await fetch(`/api/team?userId=${user?.uid}`);
            const json = await res.json();
            if (json.success && json.data.team) {
                setTeam(json.data.team);
                setStats(json.data.stats);
            }
        } catch {
            /* no team yet */
        }
        setLoading(false);
    };

    const createTeam = async () => {
        if (!teamName.trim()) return;
        setCreating(true);
        setError("");
        try {
            const res = await fetch("/api/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create",
                    userId: user?.uid,
                    teamName: teamName.trim(),
                }),
            });
            const json = await res.json();
            if (json.success) {
                setSuccess("Team created!");
                setTeamName("");
                await fetchTeam();
            } else {
                setError(json.error);
            }
        } catch {
            setError("Failed to create team");
        }
        setCreating(false);
    };

    const inviteMember = async () => {
        if (!inviteEmail.trim() || !team) return;
        setInviting(true);
        setError("");
        try {
            const res = await fetch("/api/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "invite",
                    userId: user?.uid,
                    teamId: team.id,
                    memberEmail: inviteEmail.trim(),
                }),
            });
            const json = await res.json();
            if (json.success) {
                setSuccess(`Invited ${inviteEmail}`);
                setInviteEmail("");
                await fetchTeam();
            } else {
                setError(json.error);
            }
        } catch {
            setError("Failed to invite member");
        }
        setInviting(false);
    };

    const removeMember = async (email: string) => {
        if (!team) return;
        try {
            const res = await fetch("/api/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "remove",
                    userId: user?.uid,
                    teamId: team.id,
                    memberEmail: email,
                }),
            });
            const json = await res.json();
            if (json.success) {
                setSuccess(`Removed ${email}`);
                await fetchTeam();
            } else {
                setError(json.error);
            }
        } catch {
            setError("Failed to remove member");
        }
    };

    const submitFeedback = async (type: "feature_vote" | "open_feedback", content: string, featureReq?: string) => {
        if (!user) return;
        setSubmittingFeedback(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    type,
                    content,
                    featureRequest: featureReq,
                    teamId: team?.id
                }),
            });
            const json = await res.json();
            if (json.success) {
                setSuccess("Feedback submitted successfully! Thank you.");
                if (type === "open_feedback") setFeedbackText("");
            } else {
                setError("Failed to submit feedback.");
            }
        } catch (e) {
            setError("Failed to submit feedback.");
        } finally {
            setSubmittingFeedback(false);
            setTimeout(() => setSuccess(""), 4000);
        }
    };

    const handleFeatureVote = (feature: string) => {
        setVotedFeature(feature);
        submitFeedback("feature_vote", `Voted for feature: ${feature}`, feature);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    const isOwner = team?.ownerId === user?.uid;

    const featureOptions = [
        "Bi-directional Jira Integration",
        "EU MDR / CE Mark Support",
        "AI Image & Label Analysis",
        "SOC 2 / HIPAA Frameworks"
    ];

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    Team Workspace <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest border border-indigo-200">Beta</span>
                </h1>
                <p className="text-[var(--muted)]">
                    Collaborate with your team and help shape the future of TraceBridge AI.
                </p>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}

            {success && (
                <div className="p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)] text-sm flex items-center gap-2 transition-all">
                    <span>✅</span> {success}
                </div>
            )}

            {!team ? (
                /* No team yet — create one */
                <div className="glass-card p-8 text-center max-w-lg mx-auto gradient-border mt-12">
                    <Users className="w-16 h-16 text-[var(--primary)] mx-auto mb-4 opacity-50" />
                    <h2 className="text-xl font-bold mb-2">Create Your Team</h2>
                    <p className="text-[var(--muted)] text-sm mb-6">
                        Create a workspace to share uploads and compliance reports with your team members.
                    </p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Team name (e.g., Regulatory Affairs)"
                            className="flex-1 px-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-slate-900 text-sm focus:outline-none focus:border-[var(--primary)]"
                            onKeyDown={(e) => e.key === "Enter" && createTeam()}
                        />
                        <button
                            onClick={createTeam}
                            disabled={creating || !teamName.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50 transition-all shadow-md"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Create
                        </button>
                    </div>
                </div>
            ) : (
                /* Team exists — show dashboard */
                <div className="space-y-8">
                    {/* Impact Metrics (Value Anchoring) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 flex flex-col justify-between shadow-sm relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-100/50 rounded-full blur-2xl"></div>
                            <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 relative z-10">Hours Saved by AI</h4>
                            <p className="text-4xl font-extrabold text-indigo-900 tracking-tight relative z-10">{(stats.totalUploads * 4.5).toFixed(1)} <span className="text-base font-bold text-indigo-500 ml-1">hrs</span></p>
                        </div>
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 flex flex-col justify-between shadow-sm relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100/50 rounded-full blur-2xl"></div>
                            <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2 relative z-10">Analyses Completed</h4>
                            <p className="text-4xl font-extrabold text-emerald-900 tracking-tight relative z-10">{stats.totalUploads}</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 flex flex-col justify-between shadow-sm relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-100/50 rounded-full blur-2xl"></div>
                            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 relative z-10">Est. Consultant Savings</h4>
                            <p className="text-4xl font-extrabold text-amber-900 tracking-tight relative z-10"><span className="text-2xl text-amber-500 mr-1">$</span>{(stats.totalUploads * 750).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Team Management */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="glass-card p-6 border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                                            <Shield className="w-6 h-6 text-slate-700" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">{team.name}</h2>
                                            <p className="text-sm text-slate-500">
                                                {isOwner ? "Workspace Owner" : "Workspace Member"} • {stats.totalMembers} Members
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {/* Owner */}
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                                                <Crown className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-900">
                                                    {user?.displayName || user?.email?.split("@")[0] || "Owner"}
                                                </p>
                                                <p className="text-xs text-slate-500">{user?.email}</p>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                                            Owner
                                        </span>
                                    </div>

                                    {/* Members */}
                                    {(team.members || []).map((member, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                    <span className="text-sm font-bold text-slate-600">
                                                        {member.displayName?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">
                                                        {member.displayName || member.email.split("@")[0]}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{member.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                                                    {member.role}
                                                </span>
                                                {isOwner && (
                                                    <button
                                                        onClick={() => removeMember(member.email)}
                                                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                                                        title="Remove member"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Invite member */}
                                {isOwner && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            <UserPlus className="w-4 h-4 text-slate-500" />
                                            Invite Teammate
                                        </h3>
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="email"
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                    placeholder="colleague@company.com"
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                                                    onKeyDown={(e) => e.key === "Enter" && inviteMember()}
                                                />
                                            </div>
                                            <button
                                                onClick={inviteMember}
                                                disabled={inviting || !inviteEmail.trim()}
                                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50 transition-all shadow-sm"
                                            >
                                                {inviting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Plus className="w-4 h-4" />
                                                )}
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Customer Discovery Hub */}
                        <div className="lg:col-span-7 space-y-6">
                            
                            {/* Feature Voting Board */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-indigo-500" />
                                    Product Roadmap Voting
                                </h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    Help us prioritize our next major update. What feature would save your team the most time?
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {featureOptions.map((opt) => {
                                        const isVoted = votedFeature === opt;
                                        return (
                                            <button 
                                                key={opt}
                                                onClick={() => handleFeatureVote(opt)}
                                                disabled={votedFeature !== null}
                                                className={`text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                                                    isVoted 
                                                        ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                                                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                                                } ${votedFeature !== null && !isVoted ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                            >
                                                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isVoted ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                                    {isVoted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${isVoted ? 'text-indigo-900' : 'text-slate-700'}`}>{opt}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Open Feedback & Call */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-slate-700" />
                                    Direct Feedback
                                </h3>
                                <p className="text-sm text-slate-500 mb-5">
                                    What is the biggest regulatory bottleneck your team is facing today? Your feedback goes directly to our founding team.
                                </p>
                                
                                <div className="space-y-4">
                                    <textarea
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder="We are spending way too much time manually updating our hazard traceability matrix..."
                                        className="w-full h-32 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-400"
                                    ></textarea>
                                    
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <button
                                            onClick={() => submitFeedback("open_feedback", feedbackText)}
                                            disabled={submittingFeedback || !feedbackText.trim()}
                                            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-sm"
                                        >
                                            {submittingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                                            Submit Feedback
                                        </button>

                                        <div className="w-full sm:w-auto">
                                            <a 
                                                href="mailto:founders@tracebridge.ai?subject=Priority Feature Planning Call" 
                                                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                            >
                                                <Calendar className="w-4 h-4 text-indigo-500" />
                                                Book Strategy Call
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

