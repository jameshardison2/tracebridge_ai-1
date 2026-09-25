"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

export default function AlertsList() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "alerts"),
            where("status", "==", "open"),
            orderBy("created_at", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAlerts(fetched);
            setLoading(false);
        }, (err) => {
            console.error("Failed to fetch alerts", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAcknowledge = async (id: string) => {
        try {
            await updateDoc(doc(db, "alerts", id), {
                status: "acknowledged"
            });
        } catch (err) {
            console.error("Failed to acknowledge alert", err);
        }
    };

    if (loading) return <div className="animate-pulse h-24 bg-slate-100 rounded-xl"></div>;
    
    if (alerts.length === 0) {
        return (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 flex items-center justify-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <p className="text-emerald-800 font-medium">All clear. No active safety signals detected.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {alerts.map(alert => {
                const isCritical = alert.severity === "high" || alert.type === "signal_drift";
                
                return (
                    <div key={alert.id} className={`relative overflow-hidden rounded-xl border p-5 transition-all
                        ${isCritical 
                            ? 'bg-red-50/80 border-red-200' 
                            : 'bg-amber-50/80 border-amber-200'
                        } backdrop-blur-sm shadow-sm`}
                    >
                        {/* Status accent line */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                        
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex gap-4">
                                <div className={`shrink-0 p-3 rounded-full h-fit
                                    ${isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}
                                `}>
                                    {isCritical ? <AlertTriangle className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                                            ${isCritical ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}
                                        `}>
                                            {isCritical ? 'Critical Signal Drift' : 'Emerging Trend'}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {alert.created_at?.toDate().toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className={`font-bold text-lg ${isCritical ? 'text-red-900' : 'text-amber-900'}`}>
                                        {alert.title}
                                    </h3>
                                    <p className={`mt-1 text-sm ${isCritical ? 'text-red-800' : 'text-amber-800'}`}>
                                        {alert.message}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center">
                                <button 
                                    onClick={() => handleAcknowledge(alert.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm
                                        ${isCritical 
                                            ? 'bg-red-600 text-white hover:bg-red-700' 
                                            : 'bg-amber-500 text-white hover:bg-amber-600'
                                        }
                                    `}
                                >
                                    Acknowledge
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
