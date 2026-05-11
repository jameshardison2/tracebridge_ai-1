"use client";

import { useState, useEffect } from "react";
import { Calculator, TrendingUp, AlertTriangle, Shield, CheckCircle2, ArrowRight, DollarSign, Clock, X } from "lucide-react";

export default function ROIPredictorPage() {
    // Inputs
    const [auditCount, setAuditCount] = useState(2);
    const [gapsPerAudit, setGapsPerAudit] = useState(150);
    const [hourlyRate, setHourlyRate] = useState(165); // Blended rate
    const [manualHoursPerGap, setManualHoursPerGap] = useState(4.5);
    const [consultingFeesPerAudit, setConsultingFeesPerAudit] = useState(25000);
    
    // Opportunity Cost Inputs
    const [monthlyRevenue, setMonthlyRevenue] = useState(2000000); // 2M/mo run rate
    const [monthsDelayed, setMonthsDelayed] = useState(3); // Standard delay due to 510k RTA

    // TraceBridge Metrics (Static Assumptions)
    const tbHoursPerGap = 0.5; // 30 mins to review an AI gap
    const tbCostPerAudit = 0; // Assuming SaaS subscription covers this, or marginal cost

    // Derived Status Quo
    const totalGaps = auditCount * gapsPerAudit;
    const totalManualHours = totalGaps * manualHoursPerGap;
    const totalManualCost = totalManualHours * hourlyRate;
    const totalConsultingCost = auditCount * consultingFeesPerAudit;
    const totalOpportunityCost = monthlyRevenue * monthsDelayed;
    
    const totalStatusQuoCost = totalManualCost + totalConsultingCost + totalOpportunityCost;

    // Derived TraceBridge Scenario
    const totalTbHours = totalGaps * tbHoursPerGap;
    const totalTbInternalCost = totalTbHours * hourlyRate;
    const totalTbCost = totalTbInternalCost + (auditCount * tbCostPerAudit);
    // TraceBridge eliminates the delay and consulting fees
    
    // Savings
    const hoursSaved = totalManualHours - totalTbHours;
    const capitalSaved = totalStatusQuoCost - totalTbCost;
    const roiPercentage = ((capitalSaved) / (totalTbCost > 0 ? totalTbCost : 15000)) * 100; // Assuming 15k SaaS cost if internal cost is 0

    // Effect to sync with global localStorage so Submission Hub can pull these numbers
    useEffect(() => {
        const payload = {
            hourlyRate,
            hoursPerAnalysis: manualHoursPerGap,
            capitalSavedFormatted: `$${capitalSaved.toLocaleString()}`,
            remediationEffortFormatted: `${Math.round(hoursSaved / 40)} weeks`
        };
        localStorage.setItem("tracebridge_roi_metrics", JSON.stringify(payload));
    }, [hourlyRate, manualHoursPerGap, capitalSaved, hoursSaved]);

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-indigo-600" />
                    Financial Predictor <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-200">ROI Calculator</span>
                </h1>
                <p className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 tracking-tight">
                    Model the exact financial impact of manual regulatory remediation.
                </p>
                <p className="text-slate-500 mt-2 text-sm max-w-3xl leading-relaxed">
                    Use this tool to calculate your organization's true <strong className="text-slate-700">Cost of Inaction</strong> and synchronize the verified savings across your submission artifacts. Adjust the baseline metrics to visualize the total capital and engineering hours saved by deploying TraceBridge AI.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Inputs */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-indigo-500" />
                            Client Baseline Metrics
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Audits / Submissions per Year</label>
                                <input 
                                    type="number" 
                                    value={auditCount} 
                                    onChange={e => setAuditCount(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Avg. Gaps per Audit</label>
                                <input 
                                    type="number" 
                                    value={gapsPerAudit} 
                                    onChange={e => setGapsPerAudit(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                    <span>Blended Engineering Rate</span>
                                    <span className="text-slate-400">$/hr</span>
                                </label>
                                <input 
                                    type="number" 
                                    value={hourlyRate} 
                                    onChange={e => setHourlyRate(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Manual Hours per Gap</label>
                                <input 
                                    type="number" 
                                    value={manualHoursPerGap} 
                                    onChange={e => setManualHoursPerGap(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">External Consulting Fees / Audit</label>
                                <input 
                                    type="number" 
                                    value={consultingFeesPerAudit} 
                                    onChange={e => setConsultingFeesPerAudit(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3 h-3" /> Opportunity Cost Variables
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Monthly Product Revenue</label>
                                        <input 
                                            type="number" 
                                            value={monthlyRevenue} 
                                            onChange={e => setMonthlyRevenue(Number(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Months Delayed (Avg. RTA Hold)</label>
                                        <input 
                                            type="number" 
                                            value={monthsDelayed} 
                                            onChange={e => setMonthsDelayed(Number(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Visualizations & Results */}
                <div className="xl:col-span-8 space-y-6">
                    {/* Hero ROI Banner */}
                    <div className="bg-slate-900 rounded-2xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>

                        <div className="relative z-10">
                            <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> TraceBridge Financial Impact
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-12 mb-10">
                                <div>
                                    <p className="text-slate-400 text-sm font-medium mb-1">Total Capital Saved (Annual)</p>
                                    <p className="text-5xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500 drop-shadow-sm">
                                        ${(capitalSaved / 1000000).toFixed(2)}M
                                    </p>
                                </div>
                                <div className="pb-2">
                                    <p className="text-slate-400 text-sm font-medium mb-1">Projected ROI</p>
                                    <p className="text-3xl font-bold text-white tracking-tight">+{roiPercentage.toLocaleString(undefined, { maximumFractionDigits: 0 })}%</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">
                                    <Clock className="w-5 h-5 text-emerald-400 mb-3" />
                                    <p className="text-3xl font-bold text-white tracking-tight">{hoursSaved.toLocaleString()}</p>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Engineering Hrs Saved</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">
                                    <DollarSign className="w-5 h-5 text-indigo-400 mb-3" />
                                    <p className="text-3xl font-bold text-white tracking-tight">${totalConsultingCost.toLocaleString()}</p>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Consulting Fees Avoided</p>
                                </div>
                                <div className="bg-rose-500/10 backdrop-blur-md border border-rose-500/20 rounded-xl p-5">
                                    <AlertTriangle className="w-5 h-5 text-rose-400 mb-3" />
                                    <p className="text-3xl font-bold text-rose-100 tracking-tight">${(totalOpportunityCost / 1000000).toFixed(1)}M</p>
                                    <p className="text-xs text-rose-400/80 uppercase tracking-widest font-bold mt-1">Delay Costs Reclaimed</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Split */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Status Quo */}
                        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden relative group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                                        <X className="w-4 h-4 text-rose-500" />
                                    </span>
                                    Status Quo (Manual)
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                        <span className="text-sm text-slate-600 font-medium">Internal Engineering Cost</span>
                                        <span className="text-sm font-bold text-slate-900">${totalManualCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                        <span className="text-sm text-slate-600 font-medium">External Consultants</span>
                                        <span className="text-sm font-bold text-slate-900">${totalConsultingCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                        <span className="text-sm text-rose-600 font-bold">Lost Revenue (Delays)</span>
                                        <span className="text-sm font-bold text-rose-600">${totalOpportunityCost.toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs uppercase tracking-widest font-bold text-slate-500">Total Annual Loss</span>
                                        <span className="text-2xl font-black text-rose-600">${totalStatusQuoCost.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TraceBridge AI */}
                        <div className="bg-emerald-50/30 rounded-2xl border border-emerald-200 shadow-sm overflow-hidden relative group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-emerald-900 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    </span>
                                    With TraceBridge AI
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                                        <span className="text-sm text-emerald-700 font-medium">Internal Engineering Cost</span>
                                        <span className="text-sm font-bold text-emerald-900">${totalTbInternalCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                                        <span className="text-sm text-emerald-700 font-medium">External Consultants</span>
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">ELIMINATED</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                                        <span className="text-sm text-emerald-700 font-medium">Lost Revenue (Delays)</span>
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">ELIMINATED</span>
                                    </div>
                                </div>
                                
                                <div className="mt-6 pt-6 border-t border-emerald-200">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs uppercase tracking-widest font-bold text-emerald-700">Total Annual Cost</span>
                                        <span className="text-2xl font-black text-emerald-700">${totalTbCost.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Connection Banner */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-indigo-100">
                                <Shield className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-indigo-900">Synchronized with Submission Hub</p>
                                <p className="text-xs text-indigo-600">Your custom ROI metrics are now automatically linked to PDF exports.</p>
                            </div>
                        </div>
                        <a href="/dashboard/reports" className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors">
                            View Reports <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
}
