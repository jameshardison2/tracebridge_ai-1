"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type TaskStatus = 'DETECTED' | 'TRIAGED' | 'ASSIGNED' | 'IN_REMEDIATION' | 'CLOSED';

interface Task {
    id: string;
    status: TaskStatus;
    priority?: string;
    title: string;
    standard: string;
    confidence?: number;
    subNote?: string;
    assigneeLabel?: string;
    assigneeInitials?: string;
    assigneeColor?: string; 
    dueDate?: string;
    extraFlag?: string; 
    closedBy?: string;
    closedTime?: string;
    attachments?: boolean;
}

const INITIAL_TASKS: Task[] = [
    // DETECTED
    {
        id: "t1", status: "DETECTED", priority: "CRITICAL", title: "Risk management review",
        standard: "ISO 14971:2019 § 8", confidence: 0, subNote: "No evidence"
    },
    {
        id: "t2", status: "DETECTED", priority: "MEDIUM", title: "Design transfer records",
        standard: "ISO 13485 § 7.3.8", confidence: 42, subNote: "Weak match"
    },
    // TRIAGED
    {
        id: "t3", status: "TRIAGED", priority: "CRITICAL", title: "Software unit verification",
        standard: "IEC 62304 § 5.6", confidence: 54, subNote: "Pending assignment"
    },
    {
        id: "t4", status: "TRIAGED", priority: "MEDIUM", title: "Human factors validation",
        standard: "IEC 62366 § 5.9", confidence: 68, subNote: "Needs QA review"
    },
    // ASSIGNED
    {
        id: "t5", status: "ASSIGNED", priority: "CRITICAL", title: "Post-market data review",
        standard: "ISO 14971 § 10", assigneeInitials: "SR", assigneeLabel: "Sarah R.",
        assigneeColor: "bg-indigo-100 text-indigo-700", dueDate: "Due Apr 25"
    },
    {
        id: "t6", status: "ASSIGNED", priority: "MINE • MEDIUM", title: "Internal audit cadence",
        standard: "ISO 13485 § 8.2.2", assigneeInitials: "JN", assigneeLabel: "James N.",
        assigneeColor: "bg-amber-400 text-amber-900", dueDate: "Due Apr 22"
    },
    // IN REMEDIATION
    {
        id: "t7", status: "IN_REMEDIATION", priority: "MEDIUM", title: "Complaint handling SOP",
        standard: "ISO 13485 § 8.2.1", assigneeInitials: "MK", assigneeLabel: "Mark K.",
        assigneeColor: "bg-emerald-100 text-emerald-700", extraFlag: "AI DRAFT READY"
    },
    {
        id: "t8", status: "IN_REMEDIATION", priority: "CRITICAL", title: "CAPA process clarity",
        standard: "ISO 13485 § 8.5.2", assigneeInitials: "AP", assigneeLabel: "Aisha P.",
        assigneeColor: "bg-rose-100 text-rose-700", attachments: true
    },
    // CLOSED
    {
        id: "t9", status: "CLOSED", title: "Internal audit section 8", standard: "§ 8.2.2",
        closedBy: "James N.", closedTime: "14 min ago"
    },
    {
        id: "t10", status: "CLOSED", title: "Management review metrics", standard: "§ 5.6",
        closedBy: "Sarah R.", closedTime: "2 hr ago"
    },
    {
        id: "t11", status: "CLOSED", title: "Document control", standard: "§ 4.2.3",
        closedBy: "Mark K.", closedTime: "Yesterday"
    }
];

export default function PipelinePage() {
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [slackToast, setSlackToast] = useState("");

    const detected = tasks.filter(t => t.status === 'DETECTED');
    const triaged = tasks.filter(t => t.status === 'TRIAGED');
    const assigned = tasks.filter(t => t.status === 'ASSIGNED');
    const inRemediation = tasks.filter(t => t.status === 'IN_REMEDIATION');
    const closed = tasks.filter(t => t.status === 'CLOSED');

    const openCount = tasks.length - closed.length;
    const closedCount = closed.length;

    const onDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData("taskId", id);
        // Optional: Adding an effect makes it snappier
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("taskId");
        
        setTasks(prev => {
            const task = prev.find(t => t.id === id);
            if (!task || task.status === targetStatus) return prev;

            if (targetStatus === "CLOSED" && task.status !== "CLOSED") {
                triggerSlackToast(`Task "${task.title}" synced to Jira as DONE and posted to #compliance.`);
            }

            return prev.map(t => t.id === id ? { ...t, status: targetStatus } : t);
        });
    };

    const triggerSlackToast = (message: string) => {
        setSlackToast(message);
        setTimeout(() => setSlackToast(""), 4000);
    };

    const allowDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const renderCardBody = (t: Task) => {
        if (t.status === 'CLOSED') {
            return (
                <div 
                    key={t.id} draggable onDragStart={(e) => onDragStart(e, t.id)}
                    className="bg-white rounded-lg p-4 border border-emerald-100 shadow-sm mb-3 cursor-grab hover:shadow-md transition-all active:cursor-grabbing"
                >
                    <h4 className="text-[13px] font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-500" />
                        {t.title} {t.standard}
                    </h4>
                    <div className="pl-5.5 mt-2">
                        <p className="text-[9px] text-slate-400 font-medium">Closed by {t.closedBy}</p>
                        <p className="text-[9px] text-slate-400">{t.closedTime}</p>
                    </div>
                </div>
            );
        }

        const isMine = t.priority?.includes('MINE');
        const borderColor = isMine ? 'border-amber-400 border-2' : 'border-slate-200';
        
        return (
            <div 
                key={t.id} draggable onDragStart={(e) => onDragStart(e, t.id)}
                className={`bg-white rounded-lg p-4 border shadow-sm mb-3 cursor-grab hover:shadow-md hover:border-slate-300 transition-all active:cursor-grabbing ${borderColor}`}
            >
                {t.priority && (
                    <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider mb-2 inline-block ${
                        t.priority.includes('CRITICAL') ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                    }`}>
                        {t.priority}
                    </span>
                )}
                <h4 className="text-[13px] font-bold text-slate-900 mb-1">{t.title}</h4>
                <p className="text-[10px] text-slate-400 mb-4 font-mono tracking-tighter">{t.standard}</p>

                {/* Progress Bar (Detected/Triaged) */}
                {t.confidence !== undefined && (
                    <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                        {t.confidence === 0 ? (
                            <div className="w-4 bg-slate-200 h-1.5 rounded-full"><div className="w-0 bg-red-500 h-full rounded-full"></div></div>
                        ) : (
                            <div className="w-4 h-4 rounded-full border border-dashed border-amber-400 flex items-center justify-center"></div>
                        )}
                        <span className="text-[9px] font-bold text-slate-400">{t.confidence > 0 ? `${t.confidence}% • ` : ''}{t.subNote}</span>
                    </div>
                )}

                {/* Assignees (Assigned / Remediation) */}
                {t.assigneeInitials && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${t.assigneeColor}`}>
                                {t.assigneeInitials}
                            </div>
                            <span className="text-[9px] font-medium text-slate-500">{t.assigneeLabel}</span>
                        </div>
                        {t.dueDate && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isMine ? 'text-amber-700 bg-amber-100/80' : 'text-red-500 bg-red-50'}`}>{t.dueDate}</span>}
                        {t.extraFlag && <span className="text-[8px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">{t.extraFlag}</span>}
                        {t.attachments && (
                            <div className="flex items-center gap-2 text-slate-300">
                                <span className="text-[9px] font-mono tracking-widest flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-200"></span>03</span>
                                <span className="text-[9px] font-mono tracking-widest flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-200"></span>02</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] relative">
            
            {/* Realtime Slack Sync Toast */}
            {slackToast && (
                <div className="absolute top-0 right-0 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-[#4A154B] text-white px-6 py-3 rounded-lg shadow-xl font-bold text-sm tracking-wide flex items-center gap-3">
                        <span className="text-xl">💬</span>
                        {slackToast}
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="shrink-0 mb-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold flex items-center gap-3 text-slate-900 tracking-tight">
                            Gap Lifecycle Pipeline
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Jira-style state machine • Drag gaps between columns • Real-time sync to Slack
                        </p>
                    </div>
                </div>

                {/* Pipeline Distribution Bar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mt-2 flex items-center gap-8">
                    <div className="shrink-0 leading-tight">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Gaps This Submission</p>
                        <p className="text-2xl font-extrabold text-slate-900 tracking-tighter">
                            {tasks.length} <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 align-middle">{openCount} open • {closedCount} closed this week</span>
                        </p>
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center w-full h-3.5 rounded-full overflow-hidden bg-slate-100 gap-0.5">
                            <div className="h-full bg-slate-400 transition-all" style={{ width: `${(detected.length/tasks.length)*100}%` }}></div>
                            <div className="h-full bg-amber-400 transition-all" style={{ width: `${(triaged.length/tasks.length)*100}%` }}></div>
                            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(assigned.length/tasks.length)*100}%` }}></div>
                            <div className="h-full bg-purple-500 transition-all" style={{ width: `${(inRemediation.length/tasks.length)*100}%` }}></div>
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(closed.length/tasks.length)*100}%` }}></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold mt-2">
                            <span className="text-slate-400 uppercase tracking-widest">Detected {detected.length}</span>
                            <span className="text-amber-500 uppercase tracking-widest">Triaged {triaged.length}</span>
                            <span className="text-indigo-500 uppercase tracking-widest">Assigned {assigned.length}</span>
                            <span className="text-purple-500 uppercase tracking-widest">In Remediation {inRemediation.length}</span>
                            <span className="text-emerald-500 uppercase tracking-widest">Closed {closed.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kanban Board Container */}
            <div className="flex-1 flex gap-4 min-w-[1200px] overflow-x-auto pb-4 custom-scrollbar">
                
                {/* Column 1: DETECTED */}
                <div 
                    onDrop={(e) => handleDrop(e, 'DETECTED')} 
                    onDragOver={allowDrop}
                    className="w-[280px] shrink-0 flex flex-col bg-slate-50/80 border border-slate-200/60 rounded-xl leading-snug"
                >
                    <div className="p-4 flex items-center justify-between border-b border-slate-200/60">
                        <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Detected
                        </h3>
                        <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">{detected.length}</span>
                    </div>
                    <div className="p-3 flex-1 overflow-y-auto">
                        <p className="text-[10px] text-slate-400 italic mb-3 text-center">New AI-detected gaps • needs triage</p>
                        {detected.map(renderCardBody)}
                    </div>
                </div>

                {/* Column 2: TRIAGED */}
                <div 
                    onDrop={(e) => handleDrop(e, 'TRIAGED')} 
                    onDragOver={allowDrop}
                    className="w-[280px] shrink-0 flex flex-col bg-amber-50/50 border border-amber-200/50 rounded-xl leading-snug"
                >
                    <div className="p-4 flex items-center justify-between border-b border-amber-200/50">
                        <h3 className="text-[11px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Triaged
                        </h3>
                        <span className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-700">{triaged.length}</span>
                    </div>
                    <div className="p-3 flex-1 overflow-y-auto">
                        <p className="text-[10px] text-amber-600/60 italic mb-3 text-center">Reviewed by lead • ready to assign</p>
                        {triaged.map(renderCardBody)}
                    </div>
                </div>

                {/* Column 3: ASSIGNED */}
                <div 
                    onDrop={(e) => handleDrop(e, 'ASSIGNED')} 
                    onDragOver={allowDrop}
                    className="w-[280px] shrink-0 flex flex-col bg-indigo-50/50 border border-indigo-200/50 rounded-xl leading-snug"
                >
                    <div className="p-4 flex items-center justify-between border-b border-indigo-200/50">
                        <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Assigned
                        </h3>
                        <span className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700">{assigned.length}</span>
                    </div>
                    <div className="p-3 flex-1 overflow-y-auto">
                        <p className="text-[10px] text-indigo-600/60 italic mb-3 text-center">Owned by an engineer • due date set</p>
                        {assigned.map(renderCardBody)}
                    </div>
                </div>

                {/* Column 4: IN REMEDIATION */}
                <div 
                    onDrop={(e) => handleDrop(e, 'IN_REMEDIATION')} 
                    onDragOver={allowDrop}
                    className="w-[280px] shrink-0 flex flex-col bg-purple-50/50 border border-purple-200/50 rounded-xl leading-snug"
                >
                    <div className="p-4 flex items-center justify-between border-b border-purple-200/50">
                        <h3 className="text-[11px] font-bold text-purple-600 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span> In Remediation
                        </h3>
                        <span className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-[10px] font-bold text-purple-700">{inRemediation.length}</span>
                    </div>
                    <div className="p-3 flex-1 overflow-y-auto">
                        <p className="text-[10px] text-purple-600/60 italic mb-3 text-center">Draft in progress • awaiting review</p>
                        {inRemediation.map(renderCardBody)}
                    </div>
                </div>

                {/* Column 5: CLOSED */}
                <div 
                    onDrop={(e) => handleDrop(e, 'CLOSED')} 
                    onDragOver={allowDrop}
                    className="w-[280px] shrink-0 flex flex-col bg-emerald-50/50 border border-emerald-200/50 rounded-xl leading-snug"
                >
                    <div className="p-4 flex items-center justify-between border-b border-emerald-200/50">
                        <h3 className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Closed
                        </h3>
                        <span className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center text-[10px] font-bold text-emerald-800">{closed.length}</span>
                    </div>
                    <div className="p-3 flex-1 overflow-y-auto">
                        <p className="text-[10px] text-emerald-600/60 italic mb-3 text-center">Approved • archived for audit trail</p>
                        {closed.map(renderCardBody)}
                    </div>
                </div>

            </div>
        </div>
    );
}
