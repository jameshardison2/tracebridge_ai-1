"use client";

import { FileSpreadsheet, FileText, Download, UserCheck } from 'lucide-react';

export default function ExportPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className=" text-3xl mb-2 text-[#1B2230]">Review & Export</h1>
                <p className="text-[#4A5160]">Generate RA tools and view the immutable sign-off log for this audit.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#FFFFFF] border border-[#E3E0D8] p-6 rounded-lg shadow-sm hover:border-[#0E6660] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-[#F6F5F1] p-3 rounded group-hover:bg-[#E3F0EE] transition-colors">
                            <FileSpreadsheet className="w-6 h-6 text-[#0E6660]" />
                        </div>
                        <h3 className="font-bold text-[#1B2230]">Excel Tracker</h3>
                    </div>
                    <p className="text-sm text-[#4A5160] mb-4">Export all pending findings to an Excel tracker format optimized for RA distribution.</p>
                    <button className="text-sm font-bold text-[#0E6660] flex items-center gap-1"><Download className="w-4 h-4" /> Download .xlsx</button>
                </div>

                <div className="bg-[#FFFFFF] border border-[#E3E0D8] p-6 rounded-lg shadow-sm hover:border-[#0E6660] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-[#F6F5F1] p-3 rounded group-hover:bg-[#E3F0EE] transition-colors">
                            <FileText className="w-6 h-6 text-[#0E6660]" />
                        </div>
                        <h3 className="font-bold text-[#1B2230]">Word Report</h3>
                    </div>
                    <p className="text-sm text-[#4A5160] mb-4">Generate a formal, paginated Word document containing all finding citations and descriptions.</p>
                    <button className="text-sm font-bold text-[#0E6660] flex items-center gap-1"><Download className="w-4 h-4" /> Download .docx</button>
                </div>

                <div className="bg-[#FFFFFF] border border-[#E3E0D8] p-6 rounded-lg shadow-sm hover:border-[#0E6660] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-[#F6F5F1] p-3 rounded group-hover:bg-[#E3F0EE] transition-colors">
                            <FileText className="w-6 h-6 text-[#1B2230]" />
                        </div>
                        <h3 className="font-bold text-[#1B2230]">Executive PDF</h3>
                    </div>
                    <p className="text-sm text-[#4A5160] mb-4">A single-page PDF summarizing total gaps by eSTAR section for leadership.</p>
                    <button className="text-sm font-bold text-[#0E6660] flex items-center gap-1"><Download className="w-4 h-4" /> Download .pdf</button>
                </div>
            </div>

            {/* Review Log */}
            <div className="bg-[#FFFFFF] border border-[#E3E0D8] rounded-lg shadow-sm overflow-hidden">
                <div className="bg-[#F6F5F1] px-6 py-4 border-b border-[#E3E0D8]">
                    <h2 className=" text-xl text-[#1B2230] font-medium">Review Log</h2>
                </div>
                <div className="p-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#FFFFFF] border-b border-[#E3E0D8]">
                                <th className="p-4 text-xs font-bold text-[#4A5160] uppercase tracking-wider">Finding ID</th>
                                <th className="p-4 text-xs font-bold text-[#4A5160] uppercase tracking-wider">Action</th>
                                <th className="p-4 text-xs font-bold text-[#4A5160] uppercase tracking-wider">Reviewer</th>
                                <th className="p-4 text-xs font-bold text-[#4A5160] uppercase tracking-wider">Date & Time</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-[#1B2230]">
                            <tr className="border-b border-[#E3E0D8]">
                                <td className="p-4 font-mono text-[#4A5160]">FND-401</td>
                                <td className="p-4"><span className="text-[#0E6660] font-bold">Signed Off</span></td>
                                <td className="p-4 flex items-center gap-2"><UserCheck className="w-4 h-4 text-[#4A5160]" /> James Hardison</td>
                                <td className="p-4 text-[#4A5160]">Sep 25, 2026 14:30 EST</td>
                            </tr>
                            <tr className="border-b border-[#E3E0D8]">
                                <td className="p-4 font-mono text-[#4A5160]">FND-399</td>
                                <td className="p-4"><span className="text-[#4A5160] font-bold">Dismissed</span></td>
                                <td className="p-4 flex items-center gap-2"><UserCheck className="w-4 h-4 text-[#4A5160]" /> Sarah Miller</td>
                                <td className="p-4 text-[#4A5160]">Sep 25, 2026 11:15 EST</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
