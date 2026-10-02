"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, Search, ArrowRight } from 'lucide-react';

export default function UploadCheckPage() {
    
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0].name);
        }
    };

    const [dragActive, setDragActive] = useState(false);

    return (
        <div className="space-y-8">
            <div>
                <h1 className=" text-3xl mb-2 text-[#1B2230]">Upload Source Documents</h1>
                <p className="text-[#4A5160]">Define your device profile and upload your DHF to auto-sort into eSTAR sections.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Device Profile Form */}
                <div className="col-span-1 bg-[#FFFFFF] p-6 rounded-lg shadow-sm border border-[#E3E0D8] space-y-6">
                    <h2 className="font-bold text-[#1B2230] border-b border-[#E3E0D8] pb-2">Device Profile</h2>
                    
                    <div>
                        <label className="block text-sm font-bold text-[#1B2230] mb-1">Device Name</label>
                        <input type="text" className="w-full border border-[#E3E0D8] rounded p-2 text-sm focus:outline-none focus:border-[#0E6660]" placeholder="e.g. Omnipod 5" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-[#1B2230] mb-1">FDA Product Code</label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-2 top-2.5 text-[#4A5160]" />
                            <input type="text" className="w-full border border-[#E3E0D8] rounded py-2 pl-8 pr-2 text-sm focus:outline-none focus:border-[#0E6660]" placeholder="Search 3-letter code..." />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1B2230] mb-1">Submission Type</label>
                        <select className="w-full border border-[#E3E0D8] rounded p-2 text-sm focus:outline-none focus:border-[#0E6660] bg-[#FFFFFF]">
                            <option>Traditional 510(k)</option>
                            <option>Special 510(k)</option>
                            <option>Abbreviated 510(k)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1B2230] mb-1">Primary Predicate (K-Number)</label>
                        <input type="text" className="w-full border border-[#E3E0D8] rounded p-2 text-sm focus:outline-none focus:border-[#0E6660]" placeholder="e.g. K192659" />
                    </div>
                </div>

                {/* Upload Dropzone */}
                <div className="col-span-2 space-y-6">
                    <div className="bg-[#FFFFFF] p-8 rounded-lg shadow-sm border border-[#E3E0D8] text-center border-dashed border-2 hover:bg-[#F6F5F1] transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[300px]">
                        <UploadCloud className="w-12 h-12 text-[#4A5160] mb-4" />
                        <h3 className="font-bold text-[#1B2230] mb-2">
                            {selectedFile ? "File Ready" : "Drop your DHF & V&V files here"}
                        </h3>
                        <p className="text-sm text-[#4A5160] mb-6 max-w-sm mx-auto">
                            {selectedFile ? `Attached: ${selectedFile}` : "PDF or Word format. The engine will automatically sort them into the correct eSTAR sections."}
                        </p>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button 
                            onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                            className="bg-[#FFFFFF] border border-[#E3E0D8] text-[#1B2230] font-medium px-4 py-2 rounded text-sm hover:bg-[#F6F5F1]"
                        >
                            {selectedFile ? "Change File" : "Browse Files"}
                        </button>
                    </div>

                    {/* Optional Pre-Sub */}
                    <div className="bg-[#FFFFFF] p-6 rounded-lg shadow-sm border border-[#E3E0D8] flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-[#1B2230]">FDA Pre-Sub Minutes (Optional)</h3>
                            <p className="text-sm text-[#4A5160]">Upload meeting minutes to check that your DHF answers what FDA asked for.</p>
                        </div>
                        <button className="text-sm text-[#0E6660] font-medium border border-[#0E6660] px-4 py-2 rounded hover:bg-[#E3F0EE]">
                            Upload
                        </button>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            onClick={() => router.push('/check/findings')}
                            className="bg-[#0E6660] text-[#FFFFFF] px-8 py-3 rounded hover:bg-[#0E6660]/90 transition-colors font-medium flex items-center gap-2">
                            Run Readiness Check <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
