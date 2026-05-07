"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2, CheckCircle } from "lucide-react";

export default function SurveyPage() {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // State for all 18 questions
    const [responses, setResponses] = useState({
        q1_role: "",
        q1_role_other: "",
        q2_submissions: "",
        q3_device_type: "",
        q3_device_type_other: "",
        q4_accuracy: "",
        q5_false_positives: "",
        q5_false_positives_desc: "",
        q6_missed_gaps: "",
        q6_missed_gaps_desc: "",
        q7_standards: "",
        q7_standards_desc: "",
        q8_rta_confidence: "",
        q9_confidence_trust: "",
        q9_confidence_improvements: "",
        q10_clarity: "",
        q11_summary_helpful: "",
        q12_navigation: "",
        q13_most_confusing: "",
        q14_missing_feature: "",
        q15_nps: "",
        q16_valuable: "",
        q17_improve: "",
        q18_followup: "",
        q18_followup_email: "",
    });

    const handleChange = (field: string, value: string) => {
        setResponses(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: "survey",
                    content: JSON.stringify(responses, null, 2),
                    featureRequest: false,
                    teamId: "validation_survey" // Using generic teamId to group surveys if needed
                })
            });

            const json = await res.json();
            if (!json.success) throw new Error(json.error);

            setSuccess(true);
        } catch (err: any) {
            console.error("Survey submission failed:", err);
            setError("Failed to submit survey. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto text-center">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Thank You!</h2>
                <p className="text-slate-500 text-lg">
                    Your feedback directly improves TraceBridge AI's accuracy and usability. We appreciate your time!
                </p>
                <p className="text-slate-400 mt-8 text-sm">
                    Questions? Contact james@tracebridge.ai
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">TraceBridge AI — Validation Feedback Survey</h1>
                <p className="text-slate-500 text-lg">Version 1.0 | May 2026</p>
                <p className="text-slate-400 mt-1 italic">Estimated time: 5-7 minutes</p>
            </div>

            {error && (
                <div className="p-4 mb-8 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12 bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm">
                
                {/* SECTION 1 */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-bold text-slate-800 pb-2 border-b border-slate-100">Section 1: Background (for segmentation)</h2>
                    
                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q1. What best describes your role?</label>
                        <div className="space-y-2">
                            {['Biomedical engineering student', 'Regulatory affairs professional', 'R&D / product development engineer', 'Quality assurance / compliance', 'Other'].map(opt => (
                                <label key={opt} className="flex items-center gap-3">
                                    <input type="radio" name="q1" value={opt} checked={responses.q1_role === opt} onChange={(e) => handleChange('q1_role', e.target.value)} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                                    <span className="text-slate-600">{opt}</span>
                                </label>
                            ))}
                        </div>
                        {responses.q1_role === 'Other' && (
                            <input type="text" placeholder="Please specify..." value={responses.q1_role_other} onChange={(e) => handleChange('q1_role_other', e.target.value)} className="mt-2 w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q2. How many 510(k) submissions or Q-Subs have you been involved with or studied?</label>
                        <div className="space-y-2">
                            {['None — I am learning about the process', '1-2', '3-10', 'More than 10'].map(opt => (
                                <label key={opt} className="flex items-center gap-3">
                                    <input type="radio" name="q2" value={opt} checked={responses.q2_submissions === opt} onChange={(e) => handleChange('q2_submissions', e.target.value)} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                                    <span className="text-slate-600">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q3. Which device type did you review in TraceBridge?</label>
                        <div className="space-y-2">
                            {['Physical/hardware device (e.g., surgical instrument, implant)', 'Software as a Medical Device (SaMD) / mobile app', 'Combination device', 'Other'].map(opt => (
                                <label key={opt} className="flex items-center gap-3">
                                    <input type="radio" name="q3" value={opt} checked={responses.q3_device_type === opt} onChange={(e) => handleChange('q3_device_type', e.target.value)} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                                    <span className="text-slate-600">{opt}</span>
                                </label>
                            ))}
                        </div>
                        {responses.q3_device_type === 'Other' && (
                            <input type="text" placeholder="Please specify..." value={responses.q3_device_type_other} onChange={(e) => handleChange('q3_device_type_other', e.target.value)} className="mt-2 w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                        )}
                    </div>
                </section>

                {/* SECTION 2 */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-bold text-slate-800 pb-2 border-b border-slate-100">Section 2: Gap Analysis Accuracy</h2>
                    
                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q4. How accurately did TraceBridge identify regulatory gaps in the submission you reviewed?</label>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">(1 = Very inaccurate, 5 = Very accurate)</p>
                        <div className="flex flex-wrap gap-3">
                            {[1, 2, 3, 4, 5].map(opt => {
                                const isSelected = responses.q4_accuracy === String(opt);
                                return (
                                    <label key={opt} className={`cursor-pointer w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all font-bold text-lg ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-slate-50'}`}>
                                        <input type="radio" name="q4" value={String(opt)} checked={isSelected} onChange={(e) => handleChange('q4_accuracy', e.target.value)} className="sr-only" />
                                        <span>{opt}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q5. Were there any gaps flagged by TraceBridge that you did NOT believe were actual issues?</label>
                        <div className="space-y-2">
                            {['Yes — many', 'Yes — a few', 'No — all flagged gaps seemed valid', 'I was not sure'].map(opt => (
                                <label key={opt} className="flex items-center gap-3">
                                    <input type="radio" name="q5" value={opt} checked={responses.q5_false_positives === opt} onChange={(e) => handleChange('q5_false_positives', e.target.value)} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                                    <span className="text-slate-600">{opt}</span>
                                </label>
                            ))}
                        </div>
                        {responses.q5_false_positives.startsWith('Yes') && (
                            <textarea placeholder="If yes, please describe which gap(s) and why you disagreed:" value={responses.q5_false_positives_desc} onChange={(e) => handleChange('q5_false_positives_desc', e.target.value)} className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px]" />
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q6. Were there any regulatory gaps you expected to see flagged that TraceBridge MISSED?</label>
                        <div className="space-y-2">
                            {['Yes — several missing', 'Yes — one or two missing', 'No — nothing appeared to be missed', 'I was not sure'].map(opt => (
                                <label key={opt} className="flex items-center gap-3">
                                    <input type="radio" name="q6" value={opt} checked={responses.q6_missed_gaps === opt} onChange={(e) => handleChange('q6_missed_gaps', e.target.value)} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                                    <span className="text-slate-600">{opt}</span>
                                </label>
                            ))}
                        </div>
                        {responses.q6_missed_gaps.startsWith('Yes') && (
                            <textarea placeholder="If yes, what was missing?" value={responses.q6_missed_gaps_desc} onChange={(e) => handleChange('q6_missed_gaps_desc', e.target.value)} className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px]" />
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q7. Did the standards TraceBridge flagged (e.g., IEC 62304, ISO 14971, ISO 10993) match what you would expect for this device type?</label>
                        <div className="space-y-2">
                            {['Yes — all relevant standards were correctly included', 'Mostly yes — minor discrepancies', 'No — wrong standards were flagged for this device type', 'I do not have enough knowledge to assess this'].map(opt => (
                                <label key={opt} className="flex items-center gap-3">
                                    <input type="radio" name="q7" value={opt} checked={responses.q7_standards === opt} onChange={(e) => handleChange('q7_standards', e.target.value)} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                                    <span className="text-slate-600">{opt}</span>
                                </label>
                            ))}
                        </div>
                        <textarea placeholder="Comments:" value={responses.q7_standards_desc} onChange={(e) => handleChange('q7_standards_desc', e.target.value)} className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px]" />
                    </div>

                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q8. How confident are you that this engineering documentation aligns with the FDA Q-Sub feedback based on TraceBridge's analysis?</label>
                        <div className="space-y-2">
                            {['Very confident it would be refused', 'Somewhat confident it would be refused', 'Uncertain', 'Somewhat confident it would be accepted', 'Very confident it would be accepted'].map(opt => (
                                <label key={opt} className="flex items-center gap-3">
                                    <input type="radio" name="q8" value={opt} checked={responses.q8_rta_confidence === opt} onChange={(e) => handleChange('q8_rta_confidence', e.target.value)} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                                    <span className="text-slate-600">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SECTION 3 */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-bold text-slate-800 pb-2 border-b border-slate-100">Section 3: Confidence Scores & Output Quality</h2>
                    
                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q9. Did the confidence scores shown for each gap feel accurate and trustworthy?</label>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">(1 = Not at all trustworthy, 5 = Very trustworthy)</p>
                        <div className="flex flex-wrap gap-3">
                            {[1, 2, 3, 4, 5].map(opt => {
                                const isSelected = responses.q9_confidence_trust === String(opt);
                                return (
                                    <label key={opt} className={`cursor-pointer w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all font-bold text-lg ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-slate-50'}`}>
                                        <input type="radio" name="q9" value={String(opt)} checked={isSelected} onChange={(e) => handleChange('q9_confidence_trust', e.target.value)} className="sr-only" />
                                        <span>{opt}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <textarea placeholder="What would make the confidence scores more useful?" value={responses.q9_confidence_improvements} onChange={(e) => handleChange('q9_confidence_improvements', e.target.value)} className="mt-2 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px]" />
                    </div>

                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q10. How clear and understandable was the alignment gap output?</label>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">(1 = Very confusing, 5 = Very clear)</p>
                        <div className="flex flex-wrap gap-3">
                            {[1, 2, 3, 4, 5].map(opt => {
                                const isSelected = responses.q10_clarity === String(opt);
                                return (
                                    <label key={opt} className={`cursor-pointer w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all font-bold text-lg ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-slate-50'}`}>
                                        <input type="radio" name="q10" value={String(opt)} checked={isSelected} onChange={(e) => handleChange('q10_clarity', e.target.value)} className="sr-only" />
                                        <span>{opt}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q11. Was the AI Executive Summary helpful in understanding the overall alignment risk?</label>
                        <div className="space-y-2">
                            {['Very helpful', 'Somewhat helpful', 'Neutral', 'Not helpful', 'I did not read it'].map(opt => (
                                <label key={opt} className="flex items-center gap-3">
                                    <input type="radio" name="q11" value={opt} checked={responses.q11_summary_helpful === opt} onChange={(e) => handleChange('q11_summary_helpful', e.target.value)} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                                    <span className="text-slate-600">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SECTION 4 */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-bold text-slate-800 pb-2 border-b border-slate-100">Section 4: Usability</h2>
                    
                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q12. How easy was it to navigate the TraceBridge platform?</label>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">(1 = Very difficult, 5 = Very easy)</p>
                        <div className="flex flex-wrap gap-3">
                            {[1, 2, 3, 4, 5].map(opt => {
                                const isSelected = responses.q12_navigation === String(opt);
                                return (
                                    <label key={opt} className={`cursor-pointer w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all font-bold text-lg ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-slate-50'}`}>
                                        <input type="radio" name="q12" value={String(opt)} checked={isSelected} onChange={(e) => handleChange('q12_navigation', e.target.value)} className="sr-only" />
                                        <span>{opt}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q13. What was the most confusing part of the experience?</label>
                        <textarea placeholder="Your answer" value={responses.q13_most_confusing} onChange={(e) => handleChange('q13_most_confusing', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px]" />
                    </div>

                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q14. What feature or information was missing that would have made your review more useful?</label>
                        <textarea placeholder="Your answer" value={responses.q14_missing_feature} onChange={(e) => handleChange('q14_missing_feature', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px]" />
                    </div>
                </section>

                {/* SECTION 5 */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-bold text-slate-800 pb-2 border-b border-slate-100">Section 5: Overall Assessment</h2>
                    
                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q15. How likely are you to recommend TraceBridge AI to a colleague or classmate working on Q-Sub alignment?</label>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">(0 = Not at all likely, 10 = Extremely likely)</p>
                        <div className="flex flex-wrap gap-2">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(opt => {
                                const isSelected = responses.q15_nps === String(opt);
                                return (
                                    <label key={opt} className={`cursor-pointer w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl border-2 transition-all font-bold ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-slate-50'}`}>
                                        <input type="radio" name="q15" value={String(opt)} checked={isSelected} onChange={(e) => handleChange('q15_nps', e.target.value)} className="sr-only" />
                                        <span>{opt}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q16. In one sentence, what is the single most valuable thing TraceBridge did for your review process?</label>
                        <textarea placeholder="Your answer" value={responses.q16_valuable} onChange={(e) => handleChange('q16_valuable', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px]" />
                    </div>

                    <div className="space-y-3">
                        <label className="block font-bold text-slate-700">Q17. In one sentence, what is the single most important thing TraceBridge needs to improve?</label>
                        <textarea placeholder="Your answer" value={responses.q17_improve} onChange={(e) => handleChange('q17_improve', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px]" />
                    </div>
                </section>

                {/* OPTIONAL */}
                <section className="space-y-8 bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
                    <h2 className="text-xl font-bold text-indigo-900 pb-2 border-b border-indigo-100">Optional: Follow-up</h2>
                    
                    <div className="space-y-3">
                        <label className="block font-bold text-indigo-900">Q18. Would you be willing to participate in a 15-minute follow-up interview?</label>
                        <div className="space-y-3 mt-4">
                            <label className="flex items-center gap-3">
                                <input type="radio" name="q18" value="Yes" checked={responses.q18_followup === 'Yes'} onChange={(e) => handleChange('q18_followup', e.target.value)} className="w-4 h-4 text-indigo-600 border-indigo-300 focus:ring-indigo-500" />
                                <span className="text-indigo-800">Yes — please contact me</span>
                            </label>
                            {responses.q18_followup === 'Yes' && (
                                <div className="pl-7">
                                    <input type="email" placeholder="Your email address" value={responses.q18_followup_email} onChange={(e) => handleChange('q18_followup_email', e.target.value)} className="w-full max-w-sm px-4 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                            )}
                            <label className="flex items-center gap-3">
                                <input type="radio" name="q18" value="No" checked={responses.q18_followup === 'No'} onChange={(e) => handleChange('q18_followup', e.target.value)} className="w-4 h-4 text-indigo-600 border-indigo-300 focus:ring-indigo-500" />
                                <span className="text-indigo-800">No</span>
                            </label>
                        </div>
                    </div>
                </section>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Feedback"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
