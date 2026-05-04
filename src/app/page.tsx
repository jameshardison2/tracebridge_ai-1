"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  FileSearch,
  BarChart3,
  ArrowRight,
  Database,
  Brain,
  CheckCircle2,
  Lock,
  Activity,
  Zap
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 relative overflow-hidden selection:bg-teal-500/30">
      {/* Background Gradients (Light) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-indigo-200/30 blur-[100px] pointer-events-none" />

      {/* Enterprise Header */}
      <header className="relative z-50 border-b border-slate-200/60 bg-white/60 backdrop-blur-xl shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-12 h-8 shrink-0">
              <Image src="/brand/icon_transparent.png" alt="TraceBridge Icon" fill className="object-contain" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-800">TraceBridge <span className="text-emerald-500">AI</span></span>
            <span className="hidden md:inline text-slate-500 ml-4 border-l border-slate-300 pl-4 text-xs font-medium tracking-wide">
              Enterprise Regulatory Intelligence Engine
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-500 text-xs hidden sm:flex font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Enterprise-Grade Security
            </div>
            <div className="flex items-center gap-3">
              <a href="mailto:james@tracebridge.ai?subject=TraceBridge%20Beta%20Access%20Request&body=Hi%2C%20I%20would%20like%20to%20request%20beta%20access%20to%20TraceBridge%20AI." className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all border border-slate-200 hover:border-slate-300">
                Request Beta Access
              </a>
              <Link href="/login" className="relative group overflow-hidden bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]">
                <span className="relative z-10">System Login</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 relative z-10 items-center">
        
        {/* Left Column: Dense Information Architecture */}
        <div className="space-y-10">
          
          {/* Main Title Portal */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-700 text-xs font-bold uppercase tracking-widest shadow-sm">
              <Activity className="w-3.5 h-3.5" />
              <span>Don't check your own work.</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Find your 510(k) gaps before the FDA does.
            </h1>
            <p className="text-slate-600 leading-relaxed text-lg max-w-2xl font-light">
              TraceBridge is an intelligent regulatory copilot that instantly cross-references your Risk Management, V&V Protocols, and Device Descriptions against strict FDA checklists. We act as your objective third-party reviewer-flagging administrative errors and compliance gaps that trigger expensive RTA holds, so you can submit with total certainty.
            </p>
            <div className="flex gap-4 pt-4">
              <Link href="/login" className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all group shadow-lg shadow-slate-900/20">
                Initialize Audit Workflow 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Engine Architecture Grid */}
          <div className="pt-8 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Core Engine Capabilities
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200 hover:bg-white transition-all group shadow-sm hover:shadow-md">
                <div className="p-2.5 bg-blue-50 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform shadow-sm border border-blue-100">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-2">Deterministic Rules</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  153+ strict constraints hardcoded from IEC 62304, ISO 14971, and ISO 13485 mapped directly to a massive PostgreSQL architecture database.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200 hover:bg-white transition-all group shadow-sm hover:shadow-md">
                <div className="p-2.5 bg-emerald-50 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform shadow-sm border border-emerald-100">
                  <Brain className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-2">Semantic Evaluation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Engine utilizes Google Gemini specialized routing to parse 100+ page clinical PDFs, extracting exact quotes to satisfy database constraints.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200 hover:bg-white transition-all group shadow-sm hover:shadow-md">
                <div className="p-2.5 bg-indigo-50 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform shadow-sm border border-indigo-100">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-2">Verdict Triangulation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Output is merged into strict JSON generating a mathematically sound trace matrix showing complete compliance, partial reviews, or missing evidence.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Workflows and Standards */}
        <div className="space-y-6 relative">
          
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden relative group hover:border-slate-300 transition-colors">
            <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" /> Regulated Frameworks
              </h4>
            </div>
            <div className="p-2">
              <div className="p-4 hover:bg-slate-50 rounded-xl transition-all cursor-default">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-900">IEC 62304:2006</span>
                  <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 font-bold px-2 py-0.5 rounded uppercase">Active</span>
                </div>
                <p className="text-xs text-slate-500">Medical Device Software Lifecycle</p>
              </div>
              <div className="p-4 hover:bg-slate-50 rounded-xl transition-all cursor-default">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-900">ISO 14971:2019</span>
                  <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 font-bold px-2 py-0.5 rounded uppercase">Active</span>
                </div>
                <p className="text-xs text-slate-500">Risk Management Processing</p>
              </div>
              <div className="p-4 hover:bg-slate-50 rounded-xl transition-all cursor-default">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-900">ISO 13485:2016</span>
                  <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 font-bold px-2 py-0.5 rounded uppercase">Active</span>
                </div>
                <p className="text-xs text-slate-500">Quality Management Systems</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden relative group hover:border-slate-300 transition-colors">
            <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" /> Workflow Index
              </h4>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex gap-4 group/item">
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg h-fit group-hover/item:bg-blue-50 group-hover/item:border-blue-100 transition-colors shadow-sm">
                  <FileSearch className="w-4 h-4 text-slate-400 group-hover/item:text-blue-600" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block mb-1">1. File Ingestion</span>
                  <span className="text-xs text-slate-500 leading-relaxed">Secure File API handles 20MB+ PDFs natively with advanced OCR fallback.</span>
                </div>
              </div>
              <div className="flex gap-4 group/item">
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg h-fit group-hover/item:bg-teal-50 group-hover/item:border-teal-100 transition-colors shadow-sm">
                  <BarChart3 className="w-4 h-4 text-slate-400 group-hover/item:text-teal-600" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block mb-1">2. Gap Generation</span>
                  <span className="text-xs text-slate-500 leading-relaxed">System throttles processing to abide by rate limits and ensure deterministic outcomes.</span>
                </div>
              </div>
              <div className="flex gap-4 group/item">
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg h-fit group-hover/item:bg-indigo-50 group-hover/item:border-indigo-100 transition-colors shadow-sm">
                  <Shield className="w-4 h-4 text-slate-400 group-hover/item:text-indigo-600" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block mb-1">3. Result Output</span>
                  <span className="text-xs text-slate-500 leading-relaxed">Matrix formats directly for auditor review with full citations mapped.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center text-xs">
          <div className="flex items-center gap-3 mb-4 md:mb-0 opacity-70 hover:opacity-100 transition-opacity text-slate-600">
            <Shield className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-lg tracking-tight text-slate-800">TraceBridge <span className="text-emerald-500">AI</span></span>
          </div>
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
              <span>Cloud Infrastructure Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
