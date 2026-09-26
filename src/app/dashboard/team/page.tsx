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
    X,
    Network
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

    // Client ROI States
    const [hourlyRate, setHourlyRate] = useState(166.66);
    const [hoursPerAnalysis, setHoursPerAnalysis] = useState(4.5);

    // Assignee Mapping States
    const [teamQaName, setTeamQaName] = useState("Aisha P. (QA Review)");
    const [teamEngName, setTeamEngName] = useState("Mark K. (Core Eng)");
    const [teamRaName, setTeamRaName] = useState("Sarah R. (Regulatory)");

    useEffect(() => {
        const savedNames = localStorage.getItem('tracebridge_assignee_names');
        if (savedNames) {
            try {
                const parsed = JSON.parse(savedNames);
                if (parsed.qaName) setTeamQaName(parsed.qaName);
                if (parsed.engName) setTeamEngName(parsed.engName);
                if (parsed.raName) setTeamRaName(parsed.raName);
            } catch(e){}
        }
    }, []);

    const saveAssigneeMapping = () => {
        localStorage.setItem('tracebridge_assignee_names', JSON.stringify({
            qaName: teamQaName,
            engName: teamEngName,
            raName: teamRaName
        }));
        setSuccess("Routing assignments updated successfully.");
        setTimeout(() => setSuccess(""), 3000);
    };

    const [frameworks, setFrameworks] = useState([
        { id: 'iso13485', name: 'ISO 13485:2016', active: true, available: true, requested: false },
        { id: 'fda820', name: 'FDA 21 CFR Part 820', active: true, available: true, requested: false },
        { id: 'iec62304', name: 'IEC 62304:2006', active: true, available: true, requested: false },
        { id: 'eumdr', name: 'EU MDR 2017/745', active: false, available: false, requested: false },
        { id: 'soc2', name: 'SOC 2 Type II', active: false, available: false, requested: false },
        { id: 'hipaa', name: 'HIPAA Security Rule', active: false, available: false, requested: false }
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
        if (available) return; // Core trained frameworks are locked ON and handled by product code ingestion

        setFrameworks(prev => prev.map(f => {
            if (f.id === id) {
                if (f.requested) return f; // Prevent spamming
                
                // Stealth Vote
                handleFeatureVote(name);

                // Show a realistic UI toast to sell the illusion
                setSuccess(`Early Access Request logged for ${name}.`);
                setTimeout(() => setSuccess(""), 4000);

                return { ...f, requested: true }; // Do not turn active to true
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Team Workspace <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full uppercase tracking-widest border border-indigo-200">Beta</span>
                    </h1>
                    <p className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 tracking-tight">
                        Centralize your QMS artifacts and streamline cross-functional remediation.
                    </p>
                    <p className="text-slate-500 mt-2 text-sm max-w-3xl leading-relaxed">
                        Manage your team's access to the compliance engine. Use this window to provision new user access, configure automated gap routing pipelines, and vote on upcoming platform capabilities.
                    </p>
                </div>

                {/* Global Workspace Switcher */}
                {team && !showCreateModal && (
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="relative">
                            <select
                                value={activeTeamId || ""}
                                onChange={(e) => setActiveTeamId(e.target.value)}
                                className="min-w-[200px] pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer appearance-none"
                            >
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-10 h-10 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 flex items-center justify-center transition-all shadow-sm flex-shrink-0 group"
                            title="New Workspace"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                )}
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
                /* Premium Onboarding / Empty State for RA Professionals */
                <div className="max-w-5xl mx-auto mt-8 relative bg-slate-900 rounded-3xl p-6 sm:p-12 overflow-hidden shadow-2xl border border-slate-800">
                    {/* Animated background elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                    
                    {teams.length > 0 && (
                        <div className="absolute top-6 right-6 z-20">
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" /> Cancel
                            </button>
                        </div>
                    )}

                    <div className="relative z-10 mt-4">
                        <div className="text-center mb-12">
                            <div className="w-24 h-24 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-6 shadow-inner relative overflow-hidden">
                                <Shield className="w-12 h-12 text-indigo-400" />
                                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent"></div>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">Initialize Secure Environment</h2>
                            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                                Provision a dedicated, encrypted data room to synchronize your team's QMS artifacts with the TraceBridge AI compliance engine.
                            </p>
                        </div>

                        {/* Modular Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm group hover:bg-slate-800/80 transition-all cursor-default relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-3 mb-4 pl-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <h3 className="font-bold text-slate-200 text-xs sm:text-sm tracking-wide uppercase">Audit Trails (Part 11)</h3>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-300 transition-colors pl-2">
                                    Cryptographic logging of all artifact dismissals, justifications, and approvals for immediate FDA/ISO retrieval.
                                </p>
                            </div>
                            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm group hover:bg-slate-800/80 transition-all cursor-default relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-3 mb-4 pl-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.5s' }}></span>
                                    <h3 className="font-bold text-slate-200 text-xs sm:text-sm tracking-wide uppercase">Automated Routing</h3>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-300 transition-colors pl-2">
                                    Direct assignment of AI-detected non-conformances to designated Engineering, QA, or Regulatory pipelines.
                                </p>
                            </div>
                            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm group hover:bg-slate-800/80 transition-all cursor-default relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-3 mb-4 pl-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '1s' }}></span>
                                    <h3 className="font-bold text-slate-200 text-xs sm:text-sm tracking-wide uppercase">Cross-Functional Sync</h3>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-300 transition-colors pl-2">
                                    Secure workspace provisioning allows simultaneous review of gaps and automated evidence ingestion.
                                </p>
                            </div>
                        </div>

                        {/* Command Prompt Input */}
                        <div className="max-w-2xl mx-auto bg-black p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-4 py-1.5 rounded-full border border-slate-700 flex items-center gap-2 shadow-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">System Initialization</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 items-center mt-4">
                                <div className="flex-1 w-full relative">
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 font-mono font-bold">{">"}</span>
                                    <input
                                        type="text"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        placeholder="Organization_Name (e.g., Acme_MedTech)"
                                        className="w-full pl-8 pr-4 py-4 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                                        onKeyDown={(e) => e.key === "Enter" && createTeam()}
                                    />
                                </div>
                                <button
                                    onClick={createTeam}
                                    disabled={creating || !teamName.trim()}
                                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] group"
                                >
                                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                    Deploy Environment
                                </button>
                            </div>
                            <p className="text-center mt-6 text-xs text-slate-500 font-mono opacity-80">
                                Press ENTER to deploy. Encrypted keys will be generated automatically.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Team exists - show dashboard */
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
                        {/* Left Column: Team Management */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-64 h-64 bg-slate-100 rounded-full blur-[80px] -translate-y-1/2 -translate-x-1/3 group-hover:bg-slate-200 transition-colors duration-700"></div>
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-800"></div>
                                
                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="flex items-center gap-4 mb-10 pb-8 border-b border-slate-100">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg relative flex-shrink-0">
                                            <Shield className="w-7 h-7 text-white" />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight truncate">Identity & Access</h2>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{stats.totalMembers} Provisioned Users</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">{isOwner ? "Owner" : "Member"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Members List */}
                                    <div className="mb-10">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Users className="w-4 h-4" /> Active Directory
                                        </h3>
                                        <div className="space-y-4">
                                            {/* Owner */}
                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/30 border border-amber-100/50 hover:border-amber-200 transition-colors group/user">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold shadow-sm relative flex-shrink-0">
                                                        {(user?.displayName?.[0] || user?.email?.[0] || "O").toUpperCase()}
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm text-slate-900 group-hover/user:text-amber-900 transition-colors truncate">
                                                            {user?.displayName || user?.email?.split("@")[0] || "Owner"}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                                        <CheckCircle2 className="w-3 h-3" /> Authenticated
                                                    </span>
                                                    <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 shadow-sm flex items-center gap-1.5">
                                                        <Crown className="w-3.5 h-3.5" /> Owner
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Members */}
                                            {(team.members || []).map((member, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all group/user"
                                                >
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 relative flex-shrink-0">
                                                            {(member.displayName?.[0] || member.email[0]).toUpperCase()}
                                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm text-slate-900 group-hover/user:text-indigo-600 transition-colors truncate">
                                                                {member.displayName || member.email.split("@")[0]}
                                                            </p>
                                                            <p className="text-xs text-slate-500 truncate">{member.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                                        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                                            <CheckCircle2 className="w-3 h-3" /> Authenticated
                                                        </span>
                                                        <span className="px-3 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold border border-slate-200 shadow-sm uppercase tracking-wider">
                                                            {member.role}
                                                        </span>
                                                        {isOwner && (
                                                            <button
                                                                onClick={() => removeMember(member.email)}
                                                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all opacity-40 group-hover/user:opacity-100"
                                                                title="Revoke Access"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Invite member */}
                                    {isOwner && (
                                        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-slate-800">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px]"></div>
                                            <div className="relative z-10">
                                                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                                    <UserPlus className="w-4 h-4 text-indigo-400" />
                                                    Provision New Access
                                                </h4>
                                                <p className="text-xs text-slate-400 mb-6 max-w-sm">
                                                    Send an encrypted invite link. New users will be required to authenticate via SSO before accessing the QMS data.
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <div className="flex-1 relative">
                                                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input
                                                            type="email"
                                                            value={inviteEmail}
                                                            onChange={(e) => setInviteEmail(e.target.value)}
                                                            placeholder="engineer@company.com"
                                                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                                                            onKeyDown={(e) => e.key === "Enter" && inviteMember()}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={inviteMember}
                                                        disabled={inviting || !inviteEmail.trim()}
                                                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md sm:w-auto w-full"
                                                    >
                                                        {inviting ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Plus className="w-4 h-4" />
                                                        )}
                                                        Send Invite
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                                    AI Framework Capabilities
                                </h3>
                                <p className="text-sm text-slate-500 mb-8 max-w-lg">
                                    TraceBridge AI is continuously trained on the following core frameworks. When you ingest a Q-Sub, the engine automatically extracts the required standards for your analysis.
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {frameworks.map((framework) => (
                                        <div 
                                            key={framework.id}
                                            onClick={() => toggleFramework(framework.id, framework.name, framework.available)}
                                            className={`text-left p-4 rounded-xl border flex items-center justify-between gap-3 transition-all duration-300 ${
                                                framework.active 
                                                    ? 'bg-gradient-to-r from-emerald-50 to-white border-emerald-200 ring-1 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-default' 
                                                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer'
                                            }`}
                                        >
                                            <div>
                                                <p className={`text-sm font-bold ${framework.active ? 'text-emerald-900' : 'text-slate-700'}`}>{framework.name}</p>
                                                <p className={`text-[10px] uppercase mt-1 font-semibold tracking-wider ${framework.active ? 'text-emerald-600' : (framework.requested ? 'text-indigo-500' : 'text-slate-400')}`}>
                                                    {framework.active ? 'AI Model Trained' : (framework.requested ? 'Beta Request Logged' : 'Request Early Access')}
                                                </p>
                                            </div>
                                            <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors duration-300 ${framework.active ? 'bg-emerald-500 justify-end shadow-inner' : (framework.requested ? 'bg-indigo-100 justify-start ring-1 ring-indigo-200' : 'bg-slate-200 justify-start')}`}>
                                                <div className="w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cross-Functional Assignee Routing */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-100 transition-colors duration-700"></div>
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                                <Network className="w-7 h-7 text-indigo-500 p-1 bg-indigo-50 rounded-lg border border-indigo-100" />
                                                Automated Gap Routing
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-2 max-w-lg font-medium leading-relaxed">
                                                Visually map your engineering and regulatory team to the AI remediation pipeline. Detected gaps are automatically assigned to the correct owner.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 relative">
                                        {/* Animated dashed line connecting nodes */}
                                        <div className="absolute left-[44px] sm:left-[52px] top-[48px] bottom-[48px] w-0.5 bg-indigo-200 border-l-2 border-dashed border-indigo-300 opacity-50"></div>

                                        <div className="space-y-6 relative">
                                            {/* Node 1 */}
                                            <div className="flex items-start gap-4 sm:gap-6 relative group/node">
                                                <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.1)] flex items-center justify-center flex-shrink-0 z-10 transition-transform group-hover/node:scale-110">
                                                    <span className="text-xs font-black text-indigo-600">01</span>
                                                </div>
                                                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm group-hover/node:border-indigo-300 transition-colors">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-bold text-slate-900">QA Review Pipeline</h4>
                                                                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Gatekeeper</span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 leading-relaxed">Reviews document overrides and verifies AI confidence scores.</p>
                                                        </div>
                                                        <div className="w-full sm:w-64 relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                value={teamQaName}
                                                                onChange={(e) => setTeamQaName(e.target.value)}
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                                placeholder="Enter Assignee Name"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Node 2 */}
                                            <div className="flex items-start gap-4 sm:gap-6 relative group/node">
                                                <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-400 shadow-[0_0_0_4px_rgba(99,102,241,0.1)] flex items-center justify-center flex-shrink-0 z-10 transition-transform group-hover/node:scale-110">
                                                    <span className="text-xs font-black text-indigo-500">02</span>
                                                </div>
                                                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm group-hover/node:border-indigo-300 transition-colors">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-bold text-slate-900">Core Engineering</h4>
                                                                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Technical</span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 leading-relaxed">Uploads missing technical evidence (e.g. Unit Test Results).</p>
                                                        </div>
                                                        <div className="w-full sm:w-64 relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '0.5s'}}></span>
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                value={teamEngName}
                                                                onChange={(e) => setTeamEngName(e.target.value)}
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                                placeholder="Enter Assignee Name"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Node 3 */}
                                            <div className="flex items-start gap-4 sm:gap-6 relative group/node">
                                                <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-300 shadow-[0_0_0_4px_rgba(99,102,241,0.1)] flex items-center justify-center flex-shrink-0 z-10 transition-transform group-hover/node:scale-110">
                                                    <span className="text-xs font-black text-indigo-400">03</span>
                                                </div>
                                                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm group-hover/node:border-indigo-300 transition-colors">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-bold text-slate-900">Regulatory Affairs</h4>
                                                                <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Final Auth</span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 leading-relaxed">Final FDA/ISO sign-off before generating the submission matrix.</p>
                                                        </div>
                                                        <div className="w-full sm:w-64 relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '1s'}}></span>
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                value={teamRaName}
                                                                onChange={(e) => setTeamRaName(e.target.value)}
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                                placeholder="Enter Assignee Name"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 flex justify-end">
                                        <button 
                                            onClick={saveAssigneeMapping}
                                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Lock Routing Pipeline
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Immutable Audit Log - Restricted to Owner */}
                            {false && isOwner && (
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

