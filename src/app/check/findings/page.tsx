"use client";

import { useState } from 'react';
import { Search, CheckCircle, XCircle, UserPlus, FileText, AlertTriangle, Info } from 'lucide-react';

export default function FindingsPage() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className=" text-3xl mb-2 text-[#1B2230]">Pre-eSTAR Readiness Findings</h1>
                    <p className="text-[#4A5160]">Review the automated gap analysis against the FDA RTA checklist.</p>
                </div>
                <div className="text-right">
                    <span className="text-sm font-bold text-[#1B2230]">Status: </span>
                    <span className="text-sm text-[#A14A0B] bg-[#FBEDE0] px-2 py-1 rounded font-medium">2 Pending Review</span>
                </div>
            </div>

            {/* Plain-English Search */}
            <div className="relative w-full max-w-2xl">
                <Search className="w-5 h-5 absolute left-3 top-3 text-[#4A5160]" />
                <input 
                    type="text" 
                    className="w-full border border-[#E3E0D8] rounded shadow-sm py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#0E6660]" 
                    placeholder="Search across your submission and FDA guidance (e.g., 'What is missing from my cybersecurity plan?')" 
                />
            </div>

            {/* eSTAR Section Group */}
            <div className="bg-[#FFFFFF] border border-[#E3E0D8] rounded shadow-sm overflow-hidden">
                <div className="bg-[#F6F5F1] px-6 py-4 border-b border-[#E3E0D8] flex justify-between items-center">
                    <h2 className=" text-xl text-[#1B2230] font-medium">eSTAR Section 14: Software / Cybersecurity</h2>
                    <span className="text-xs text-[#4A5160] font-medium">2 Findings</span>
                </div>

                <div className="p-6 space-y-6">
                    {/* Finding 1: Missing */}
                    <div className="border border-[#E3E0D8] rounded p-6 bg-[#FFFFFF]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <span className="bg-[#FBEDE0] text-[#A14A0B] text-xs font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Missing
                                </span>
                                <span className="text-xs font-bold text-[#1B2230] uppercase tracking-wider border border-[#E3E0D8] px-2 py-1 rounded">Severity: Major</span>
                            </div>
                            <span className="text-xs text-[#4A5160] font-mono">ID: FND-402</span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-[#1B2230] mb-2">Machine-readable Software Bill of Materials (SBOM)</h3>
                        
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <h4 className="text-xs font-bold text-[#4A5160] uppercase tracking-wider mb-2">FDA Requirement Citation</h4>
                                <div className="text-sm text-[#1B2230] bg-[#F6F5F1] p-3 rounded border border-[#E3E0D8]">
                                    "Sponsors must provide a machine-readable SBOM for all software components..." <br/>
                                    <span className="text-xs text-[#0E6660] mt-2 block font-medium">Source: FDA Cybersecurity in Medical Devices Guidance (2023), Sec 4.1</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-[#4A5160] uppercase tracking-wider mb-2">Suggested Fix</h4>
                                <div className="text-sm text-[#1B2230] bg-[#F6F5F1] p-3 rounded border border-[#E3E0D8]">
                                    Generate an SBOM in CycloneDX or SPDX format using your CI/CD pipeline and append to the Architecture Document.
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-[#E3E0D8]">
                            <div className="text-xs text-[#4A5160]">
                                <strong>AI Confidence:</strong> 94% (High)
                            </div>
                            <div className="flex gap-3">
                                <button className="flex items-center gap-1 text-sm text-[#1B2230] font-medium border border-[#E3E0D8] px-4 py-2 rounded hover:bg-[#F6F5F1] transition-colors">
                                    <UserPlus className="w-4 h-4" /> Assign
                                </button>
                                <button className="flex items-center gap-1 text-sm text-[#1B2230] font-medium border border-[#E3E0D8] px-4 py-2 rounded hover:bg-[#F6F5F1] transition-colors">
                                    <XCircle className="w-4 h-4" /> Dismiss
                                </button>
                                <button className="flex items-center gap-1 text-sm text-[#FFFFFF] bg-[#0E6660] font-medium border border-[#0E6660] px-4 py-2 rounded hover:bg-[#0E6660]/90 transition-colors">
                                    <CheckCircle className="w-4 h-4" /> Sign-off
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Finding 2: Inconsistent */}
                    <div className="border border-[#E3E0D8] rounded p-6 bg-[#FFFFFF]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <span className="bg-[#E6EDF7] text-[#1F4E8C] text-xs font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Inconsistent
                                </span>
                                <span className="text-xs font-bold text-[#1B2230] uppercase tracking-wider border border-[#E3E0D8] px-2 py-1 rounded">Severity: Critical</span>
                            </div>
                            <span className="text-xs text-[#4A5160] font-mono">ID: FND-403</span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-[#1B2230] mb-2">Contradictory Risk Mitigation Timeout</h3>
                        
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <h4 className="text-xs font-bold text-[#4A5160] uppercase tracking-wider mb-2">Location A: Hazard Analysis</h4>
                                <div className="text-sm text-[#1B2230] bg-[#F6F5F1] p-3 rounded border border-[#E3E0D8]">
                                    "Hazard 14: Bluetooth connection failure. Mitigation: Software shall timeout and alert user after 30 seconds."
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-[#4A5160] uppercase tracking-wider mb-2">Location B: SRS</h4>
                                <div className="text-sm text-[#1B2230] bg-[#F6F5F1] p-3 rounded border border-[#E3E0D8]">
                                    "REQ-42: If Bluetooth signal is lost, software shall attempt to reconnect indefinitely."
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-[#E3E0D8]">
                            <div className="text-xs text-[#4A5160]">
                                <strong>AI Confidence:</strong> 99% (Very High)
                            </div>
                            <div className="flex gap-3">
                                <button className="flex items-center gap-1 text-sm text-[#1B2230] font-medium border border-[#E3E0D8] px-4 py-2 rounded hover:bg-[#F6F5F1] transition-colors">
                                    <UserPlus className="w-4 h-4" /> Assign
                                </button>
                                <button className="flex items-center gap-1 text-sm text-[#1B2230] font-medium border border-[#E3E0D8] px-4 py-2 rounded hover:bg-[#F6F5F1] transition-colors">
                                    <XCircle className="w-4 h-4" /> Dismiss
                                </button>
                                <button className="flex items-center gap-1 text-sm text-[#FFFFFF] bg-[#0E6660] font-medium border border-[#0E6660] px-4 py-2 rounded hover:bg-[#0E6660]/90 transition-colors">
                                    <CheckCircle className="w-4 h-4" /> Sign-off
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
