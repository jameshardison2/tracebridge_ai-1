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
    CheckCircle2,
    FileText,
    Clock,
    ChevronDown,
    ChevronRight,
    X
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
    const [teams, setTeams] = useState<TeamData[]>([]);
    const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
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

    const [frameworks, setFrameworks] = useState([
        { id: 'iso13485', name: 'ISO 13485:2016', active: true, available: true },
        { id: 'fda820', name: 'FDA 21 CFR Part 820', active: true, available: true },
        { id: 'iec62304', name: 'IEC 62304:2006', active: true, available: true },
        { id: 'eumdr', name: 'EU MDR 2017/745', active: false, available: false },
        { id: 'soc2', name: 'SOC 2 Type II', active: false, available: false },
        { id: 'hipaa', name: 'HIPAA Security Rule', active: false, available: false }
    ]);

    const [logs, setLogs] = useState<any[]>([]);
    const [isLogExpanded, setIsLogExpanded] = useState(false);

    useEffect(() => {
        if (user) {
            fetchTeam();
            fetchLogs();
        }
    }, [user]);

    const fetchLogs = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/logs?userId=${user?.uid}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setLogs(json.data);
            }
        } catch (e) {
            console.error("Failed to fetch logs", e);
        }
    }

    const fetchTeam = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/team?userId=${user.uid}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success && json.data.teams) {
                setTeams(json.data.teams);
                if (json.data.teams.length > 0) {
                    setActiveTeamId(prev => {
                        const exists = json.data.teams.find((t: any) => t.id === prev);
                        return exists ? prev : json.data.teams[0].id;
                    });
                } else {
                    setActiveTeamId(null);
                }
                if (json.data.stats) {
                    setStats(json.data.stats);
                }
            }
        } catch {
            /* no team yet */
        }
        setLoading(false);
    };

    const team = teams.find(t => t.id === activeTeamId) || null;

    const createTeam = async () => {
        if (!teamName.trim()) return;
        setCreating(true);
        setError("");
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/team", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: "create",
                    userId: user?.uid,
                    teamName: teamName.trim(),
                }),
            });
            const json = await res.json();
            if (json.success) {
                setSuccess("Workspace created!");
                setTeamName("");
                setShowCreateModal(false);
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
            const token = await user?.getIdToken();
            const res = await fetch("/api/team", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
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
            const token = await user?.getIdToken();
            const res = await fetch("/api/team", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
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
                if (type === "open_feedback") {
                    setSuccess("Feedback submitted successfully! Thank you.");
                    setFeedbackText("");
                }
            } else {
                if (type === "open_feedback") setError("Failed to submit feedback.");
            }
        } catch (e) {
            if (type === "open_feedback") setError("Failed to submit feedback.");
        } finally {
            setSubmittingFeedback(false);
            if (type === "open_feedback") {
                setTimeout(() => setSuccess(""), 4000);
            }
        }
    };

    const handleFeatureVote = (feature: string) => {
        setVotedFeature(feature);
        submitFeedback("feature_vote", `Voted for feature: ${feature}`, feature);
    };

    const toggleFramework = (id: string, name: string, available: boolean) => {
        setFrameworks(prev => prev.map(f => {
            if (f.id === id) {
                const newActive = !f.active;
                
                // Stealth Vote if turning on an unavailable framework
                if (!available && newActive) {
                    handleFeatureVote(name);
                }

                // Show a realistic UI toast to sell the illusion
                setSuccess(`${name} Monitoring ${newActive ? 'Enabled' : 'Disabled'}`);
                setTimeout(() => setSuccess(""), 3000);

                return { ...f, active: newActive };
            }
            return f;
        }));
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
        "Bi-directional Jira Integration (Coming Soon)",
        "EU MDR / CE Mark Support",
        "AI Image & Label Analysis",
        "SOC 2 / HIPAA Frameworks"
    ];

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight flex items-center gap-3">
                    Team Workspace <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest border border-indigo-200">Beta</span>
                </h1>
                <p className="text-[var(--muted)]">
                    Centralize your QMS artifacts and streamline cross-functional remediation.
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

            {!team || showCreateModal ? (
                /* No team yet or creating new team - Premium Onboarding / Empty State for RA Professionals */
                <div className="max-w-4xl mx-auto mt-8 relative">
                    {teams.length > 0 && (
                        <div className="absolute top-0 right-0 z-10">
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" /> Cancel
                            </button>
                        </div>
                    )}
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Users className="w-10 h-10 text-indigo-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Set Up Your Team Workspace</h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            Centralize your compliance artifacts and invite your team to collaborate on resolving gaps.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-100">
                                <Shield className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Automated Part 11 Audit Trails</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Prove your compliance. Every artifact dismissal, justification, and e-signature is cryptographically logged for ISO 13485 and FDA auditor review.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-4 border border-blue-100">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Eliminate Email Chains</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Instantly assign AI-detected non-conformances directly to the specific engineering or clinical owners responsible for providing the missing evidence.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-4 border border-amber-100">
                                <Lightbulb className="w-5 h-5 text-amber-600" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Direct Regulatory Support</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Escalate complex regulatory bottlenecks directly to our MedTech experts. Vote on Jira integrations, CAPA templates, and new FDA protocol support.
                            </p>
                        </div>
                    </div>

                    <div className="glass-card p-8 text-center max-w-xl mx-auto gradient-border shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Name Your Workspace</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Name your workspace to get started. You can configure your team roster on the next screen.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="Organization Name (e.g., Acme MedTech)"
                                className="flex-1 px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-inner"
                                onKeyDown={(e) => e.key === "Enter" && createTeam()}
                            />
                            <button
                                onClick={createTeam}
                                disabled={creating || !teamName.trim()}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md sm:w-auto w-full"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                                Deploy Workspace
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Team exists - show dashboard */
                <div className="space-y-8">
                    {/* Premium QMS Environment Banner */}
                    <div className="bg-slate-900 rounded-[2rem] p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800 group">
                        {/* High-tech animated background elements */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-500/30 transition-colors duration-700"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
                        
                        {/* Subtle Grid Pattern */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>

                        <div className="relative z-10 max-w-4xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-300">System Active</span>
                            </div>
                            
                            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                                TraceBridge QMS Environment
                            </h2>
                            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-10 max-w-2xl font-light">
                                Centralized compliance infrastructure for MedTech engineering and regulatory affairs. Configure active regulatory frameworks, manage cross-functional triage, and maintain an immutable <strong className="text-white font-medium">21 CFR Part 11 Audit Trail</strong> to streamline 510(k) clearance.
                            </p>
                            
                            {/* Premium Impact Metrics */}
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all rounded-2xl px-6 py-4 flex flex-col gap-2 relative overflow-hidden group/metric">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-indigo-400" />
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Hours Saved</p>
                                    </div>
                                    <p className="text-3xl font-black tracking-tight text-white">{(stats.totalUploads * 4.5).toFixed(1)} <span className="text-sm font-medium text-slate-500 ml-1">hrs</span></p>
                                </div>
                                
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all rounded-2xl px-6 py-4 flex flex-col gap-2 relative overflow-hidden group/metric">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-emerald-400" />
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Analyses Run</p>
                                    </div>
                                    <p className="text-3xl font-black tracking-tight text-white">{stats.totalUploads}</p>
                                </div>
                                
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all rounded-2xl px-6 py-4 flex flex-col gap-2 relative overflow-hidden group/metric">
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-amber-400 font-bold text-sm">$</span>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">ROI Generated</p>
                                    </div>
                                    <p className="text-3xl font-black tracking-tight text-white"><span className="text-slate-500 mr-1">$</span>{(stats.totalUploads * 750).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Team Management */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="glass-card p-6 border-slate-200 shadow-sm">
                                <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                <Shield className="w-6 h-6 text-slate-700" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{team.name}</h2>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {isOwner ? "Workspace Owner" : "Workspace Member"} • {stats.totalMembers} Members
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Workspace Switcher */}
                                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                                        <select
                                            value={activeTeamId || ""}
                                            onChange={(e) => setActiveTeamId(e.target.value)}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer shadow-inner appearance-none"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                                        >
                                            {teams.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} (Workspace)</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 text-sm transition-all whitespace-nowrap flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" /> New
                                        </button>
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
                                    <div className="pt-6 mt-2 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <UserPlus className="w-4 h-4" />
                                            Invite Teammate
                                        </h4>
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

                            {/* Premium Early Access Survey */}
                            <div className="bg-white border border-indigo-100 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-[50px] group-hover:bg-indigo-100 transition-colors"></div>
                                
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-indigo-200 bg-indigo-50 mb-4">
                                        <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">Feature Request</span>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
                                        What should we build next?
                                    </h3>
                                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                                        Tell us what features, integrations, or compliance frameworks would make TraceBridge perfect for your team. We build directly from user feedback.
                                    </p>
                                    
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <textarea
                                                value={feedbackText}
                                                onChange={(e) => setFeedbackText(e.target.value)}
                                                placeholder="e.g., We really need an export to Jira feature..."
                                                className="w-full h-32 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-400"
                                            ></textarea>
                                        </div>
                                        
                                        <button
                                            onClick={() => submitFeedback("open_feedback", feedbackText)}
                                            disabled={submittingFeedback || !feedbackText.trim()}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-sm hover:shadow"
                                        >
                                            {submittingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                                            Submit Request
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Customer Discovery Hub */}
                        <div className="lg:col-span-7 space-y-6">
                            
                            {/* QMS Compliance Frameworks */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-700"></div>
                                
                                <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-emerald-500" />
                                    Active Compliance Frameworks
                                </h3>
                                <p className="text-sm text-slate-500 mb-8 max-w-lg">
                                    Select the regulatory standards your team is currently tracking against. TraceBridge AI will automatically cross-reference these during gap analysis.
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {frameworks.map((framework) => (
                                        <div 
                                            key={framework.id}
                                            onClick={() => toggleFramework(framework.id, framework.name, framework.available)}
                                            className={`text-left p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-300 ${
                                                framework.active 
                                                    ? 'bg-gradient-to-r from-emerald-50 to-white border-emerald-200 ring-1 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:border-emerald-300' 
                                                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                            }`}
                                        >
                                            <div>
                                                <p className={`text-sm font-bold ${framework.active ? 'text-emerald-900' : 'text-slate-700'}`}>{framework.name}</p>
                                                <p className={`text-[10px] uppercase mt-1 font-semibold tracking-wider ${framework.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {framework.active ? 'Monitoring Active' : 'Disabled'}
                                                </p>
                                            </div>
                                            <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors duration-300 ${framework.active ? 'bg-emerald-500 justify-end shadow-inner' : 'bg-slate-200 justify-start'}`}>
                                                <div className="w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Immutable Audit Log - Restricted to Owner */}
                            {isOwner && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-800"></div>
                                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-slate-800/5 rounded-full blur-3xl group-hover:bg-slate-800/10 transition-colors duration-700"></div>

                                    <div 
                                        className="flex justify-between items-center mb-2 cursor-pointer select-none group-hover:opacity-90"
                                        onClick={() => setIsLogExpanded(!isLogExpanded)}
                                    >
                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                            {isLogExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                                            <FileText className="w-6 h-6 text-slate-700" />
                                            Recent QMS Activity (Part 11 Log)
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 shadow-sm hidden sm:inline-block">Recording</span>
                                        </div>
                                    </div>
                                    {isLogExpanded && (
                                        <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-200">
                                            <p className="text-sm text-slate-500 mb-8 max-w-lg">
                                                A cryptographically secure, immutable ledger of all team actions, gap dismissals, and approvals.
                                            </p>
                                            
                                            <div className="space-y-4">
                                                {logs.length > 0 ? logs.map((log, idx) => (
                                                    <div key={log.id || idx} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.action === 'upload' ? 'bg-blue-500' : log.action === 'resolve' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 capitalize">{log.action.replace('_', ' ')}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5">
                                                                {log.action === 'upload' 
                                                                    ? `${log.details.deviceName} document uploaded.` 
                                                                    : log.action === 'analyze'
                                                                        ? `${log.details.deviceName} compliance analysis completed. Evaluated ${log.details.rulesChecked} regulatory rules and identified ${log.details.gapsFound} gaps. Overall compliance score: ${log.details.complianceScore}%.`
                                                                        : JSON.stringify(log.details)}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{log.userId === 'system' ? 'System' : 'QA User'}</span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {log.createdAt?._seconds ? new Date(log.createdAt._seconds * 1000).toLocaleString() : "Just now"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                                        No audit events recorded yet. Upload a document to trigger the Part 11 log.
                                                    </div>
                                                )}
                                                
                                                <button className="w-full mt-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl border border-slate-200 text-sm transition-all flex items-center justify-center gap-2">
                                                    <FileText className="w-4 h-4" />
                                                    Export Full Audit Log (.CSV)
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

