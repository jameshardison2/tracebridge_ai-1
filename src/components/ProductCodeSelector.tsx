import { useState } from "react";
import fdaCodes from "@/lib/fda-product-codes.json";
import { Search } from "lucide-react";

interface ProductCode {
    code: string;
    deviceClass: string;
    description: string;
    regulationNumber: string;
    requiresSoftware: boolean;
    requiresClinical: boolean;
    requiresBiocompatibility: boolean;
}

interface ProductCodeSelectorProps {
    onSelect: (code: ProductCode | null) => void;
}

export function ProductCodeSelector({ onSelect }: ProductCodeSelectorProps) {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<ProductCode | null>(null);

    const filteredCodes = fdaCodes.filter(
        c => 
            c.description.toLowerCase().includes(search.toLowerCase()) || 
            c.code.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (code: ProductCode) => {
        setSelected(code);
        setSearch("");
        setIsOpen(false);
        onSelect(code);
    };

    return (
        <div className="relative mb-6">
            <h2 className="text-lg font-bold mb-2">1. Select Medical Device Type</h2>
            <p className="text-sm text-[var(--muted)] mb-3">
                TraceBridge uses the FDA Product Code to automatically optimize your gap analysis algorithm.
            </p>
            
            {/* The Selected View */}
            {selected ? (
                <div className="p-4 border border-[var(--success)] bg-[var(--success)]/5 rounded-xl flex justify-between items-center">
                    <div>
                        <div className="font-bold flex items-center gap-2">
                            <span className="bg-[var(--success)] text-black px-2 py-0.5 rounded-md text-xs">{selected.code}</span>
                            {selected.description}
                        </div>
                        <div className="text-xs text-[var(--muted)] mt-1">
                            {selected.deviceClass} • {selected.regulationNumber}
                        </div>
                    </div>
                    <button 
                        onClick={() => { setSelected(null); onSelect(null); }}
                        className="text-xs text-[var(--danger)] hover:underline"
                    >
                        Change
                    </button>
                </div>
            ) : (
                /* The Search View */
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-600 bg-black text-white focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                        placeholder="Search for a medical device (e.g. Glucose Monitor, Scalpel)..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                    />
                    
                    {/* The Dropdown Menu */}
                    {isOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {filteredCodes.length === 0 ? (
                                <div className="p-3 text-gray-400 text-sm">No exact matches found. Try simplifying your search.</div>
                            ) : (
                                filteredCodes.map((code) => (
                                    <div 
                                        key={code.code}
                                        onClick={() => handleSelect(code)}
                                        className="p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-0"
                                    >
                                        <div className="font-semibold text-white">{code.description} <span className="text-[var(--primary)]">[{code.code}]</span></div>
                                        <div className="text-xs text-gray-400">{code.deviceClass}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
