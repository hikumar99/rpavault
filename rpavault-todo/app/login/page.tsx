"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Lock, User, ArrowRight, Loader2 } from "lucide-react";

import { apiPath, APP_NAME } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(apiPath("/api/auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#111317] text-white flex flex-col items-center justify-center p-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(71,114,250,0.12),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-md bg-[#1a1d24] border border-[#2b303c] rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#4772fa] to-indigo-600 flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-lg shadow-[#4772fa]/25">
            {APP_NAME.toLowerCase().includes("rpavault") ? "✓" : APP_NAME.charAt(0).toUpperCase() || "K"}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{APP_NAME}</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to manage and collaborate on your tasks</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-2.5 bg-[#232731] border border-[#343a49] rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#4772fa] focus:ring-1 focus:ring-[#4772fa] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#232731] border border-[#343a49] rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#4772fa] focus:ring-1 focus:ring-[#4772fa] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-[#4772fa] hover:bg-[#3861ea] active:bg-[#2c4ec9] disabled:opacity-50 text-white font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#4772fa]/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#2b303c] text-center text-xs text-gray-500">
          RPAVault Task Manager • Hosted under <code className="text-gray-400">/2do/</code>
        </div>
      </div>
    </div>
  );
}
