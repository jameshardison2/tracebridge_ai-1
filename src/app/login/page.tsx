"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
    Shield,
    Mail,
    Lock,
    User,
    ArrowRight,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Eye,
    EyeOff,
} from "lucide-react";

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
    const router = useRouter();
    const { signIn, signUp, signInWithGoogle, resetPassword, user, loading } = useAuth();

    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Redirect if already logged in
    if (!loading && user) {
        router.push("/dashboard");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setSubmitting(true);

        try {
            if (mode === "login") {
                await signIn(email, password);
                router.push("/dashboard");
            } else if (mode === "signup") {
                if (!displayName.trim()) {
                    setError("Please enter your name.");
                    setSubmitting(false);
                    return;
                }
                await signUp(email, password, displayName);
                router.push("/dashboard");
            } else if (mode === "forgot") {
                await resetPassword(email);
                setSuccess("Password reset email sent! Check your inbox.");
            }
        } catch (err: any) {
            const code = err?.code || "";
            if (code === "auth/user-not-found") setError("No account found with this email.");
            else if (code === "auth/wrong-password") setError("Incorrect password.");
            else if (code === "auth/email-already-in-use") setError("An account with this email already exists.");
            else if (code === "auth/weak-password") setError("Password must be at least 6 characters.");
            else if (code === "auth/invalid-email") setError("Invalid email address.");
            else if (code === "auth/invalid-credential") setError("Invalid email or password.");
            else setError(err?.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError("");
        try {
            await signInWithGoogle();
            router.push("/dashboard");
        } catch (err: any) {
            if (err?.code !== "auth/popup-closed-by-user") {
                setError(err?.message || "Google sign-in failed.");
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0a0e1a] via-[#0f1629] to-[#1a0a2e] flex-col justify-between p-12">
                <Link href="/" className="flex items-center gap-2">
                    <Shield className="w-8 h-8 text-[var(--primary)]" />
                    <span className="text-xl font-bold gradient-text">TraceBridge AI</span>
                </Link>

                <div className="space-y-6">
                    <h2 className="text-4xl font-bold leading-tight">
                        Regulatory Compliance,
                        <br />
                        <span className="gradient-text">Automated.</span>
                    </h2>
                    <p className="text-[var(--muted)] text-lg leading-relaxed max-w-md">
                        Upload your V&V documentation and get instant gap analysis
                        against FDA requirements — powered by Google Gemini AI.
                    </p>
                    <div className="space-y-3 pt-4">
                        {[
                            "AI-powered document analysis",
                            "IEC 62304, ISO 14971 & ISO 13485",
                            "Instant gap reports with citations",
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                                <span className="text-sm text-[var(--muted)]">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-xs text-[var(--muted)]">
                    © 2026 TraceBridge AI. All rights reserved.
                </p>
            </div>

            {/* Right panel — login form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <Shield className="w-7 h-7 text-[var(--primary)]" />
                        <span className="text-lg font-bold gradient-text">TraceBridge AI</span>
                    </div>

                    <h1 className="text-3xl font-bold mb-2">
                        {mode === "login" && "Welcome back"}
                        {mode === "signup" && "Create account"}
                        {mode === "forgot" && "Reset password"}
                    </h1>
                    <p className="text-[var(--muted)] mb-8">
                        {mode === "login" && "Sign in to access your compliance dashboard."}
                        {mode === "signup" && "Start analyzing your regulatory documents."}
                        {mode === "forgot" && "Enter your email to receive a reset link."}
                    </p>

                    {/* Error / Success alerts */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0" />
                            <p className="text-sm text-[var(--danger)]">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0" />
                            <p className="text-sm text-[var(--success)]">{success}</p>
                        </div>
                    )}

                    {/* Google OAuth */}
                    {mode !== "forgot" && (
                        <>
                            <button
                                onClick={handleGoogleSignIn}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors text-sm font-medium"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>

                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-[var(--border)]" />
                                <span className="text-xs text-[var(--muted)] uppercase">or</span>
                                <div className="flex-1 h-px bg-[var(--border)]" />
                            </div>
                        </>
                    )}

                    {/* Email form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "signup" && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-white placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-white placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                                />
                            </div>
                        </div>

                        {mode !== "forgot" && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-white placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {mode === "login" && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                                    className="text-sm text-[var(--primary)] hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    {mode === "login" && "Sign In"}
                                    {mode === "signup" && "Create Account"}
                                    {mode === "forgot" && "Send Reset Link"}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Mode switch */}
                    <div className="mt-6 text-center text-sm text-[var(--muted)]">
                        {mode === "login" && (
                            <p>
                                Don&apos;t have an account?{" "}
                                <button
                                    onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                                    className="text-[var(--primary)] hover:underline font-medium"
                                >
                                    Sign up
                                </button>
                            </p>
                        )}
                        {mode === "signup" && (
                            <p>
                                Already have an account?{" "}
                                <button
                                    onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                                    className="text-[var(--primary)] hover:underline font-medium"
                                >
                                    Sign in
                                </button>
                            </p>
                        )}
                        {mode === "forgot" && (
                            <p>
                                Remember your password?{" "}
                                <button
                                    onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                                    className="text-[var(--primary)] hover:underline font-medium"
                                >
                                    Back to sign in
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
