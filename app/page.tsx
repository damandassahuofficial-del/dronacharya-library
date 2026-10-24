"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const inputEmail = email.trim().toLowerCase();
    const inputPass = password.trim();

    // Check credentials (allows both with/without .com and both passwords)
    const validEmails = [
      "admin@dronacharyalibrary",
      "admin@dronacharyalibrary.com",
      "admin"
    ];
    const validPasswords = ["admin@123", "admin123", "123456"];

    if (validEmails.includes(inputEmail) && validPasswords.includes(inputPass)) {
      // Direct redirect to dashboard
      window.location.href = "/dashboard";
    } else {
      setError("Galat Username ya Password! Kripya dobara check karein.");
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 font-sans select-none overflow-hidden">
      {/* Background Library Bookshelf Image */}
      <img
        src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop"
        alt="Library Background"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="absolute inset-0 bg-black/60 z-0" />

      {/* Central Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-[430px] bg-[#1a1918]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-7 sm:p-8 shadow-2xl text-white">
        
        {/* Brand Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 p-2.5 rounded-2xl bg-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
            <svg 
              className="w-7 h-7" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="15" width="13" height="4" rx="1" fill="#f87171" transform="rotate(-6 3 15)" />
              <rect x="4" y="10" width="14" height="4" rx="1" fill="#38bdf8" />
              <rect x="5" y="5" width="13" height="4" rx="1" fill="#4ade80" transform="rotate(5 5 5)" />
            </svg>
          </div>
          <div>
            <h1 className="text-[22px] font-black tracking-tight text-white leading-snug">
              Dronacharya Library
            </h1>
            <p className="text-[10px] font-bold text-neutral-400 tracking-[0.14em] uppercase mt-0.5">
              LIBRARY MANAGEMENT SYSTEM
            </p>
          </div>
        </div>

        {/* Secure Login Header */}
        <div className="space-y-1 mb-5">
          <div className="flex items-center gap-1.5 text-[#22c55e] text-xs font-semibold">
            <span>🔒</span>
            <span>Secure Login</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="text-xs text-neutral-300 font-normal">
            Sign in to continue to your Library Dashboard
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-4 p-2.5 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-200">
              Username / Email
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@dronacharyalibrary.com"
              className="w-full bg-[#f1f3f5] text-neutral-900 text-sm font-medium px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-none transition placeholder:text-neutral-400 placeholder:opacity-60"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-200">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#f1f3f5] text-neutral-900 text-sm font-medium px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-none pr-10 transition placeholder:text-neutral-400 placeholder:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-neutral-500 hover:text-neutral-800 transition"
              >
                {showPassword ? (
                  <span className="text-sm">🙈</span>
                ) : (
                  <span className="text-sm">👁️</span>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-200 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 focus:ring-0 cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <a href="#" className="text-blue-400 hover:text-blue-300 transition font-medium">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full mt-3 bg-[#2563eb] hover:bg-blue-600 active:scale-[0.99] text-white font-bold py-3 rounded-lg text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Sign In</span>
            <span>→</span>
          </button>
        </form>

        <p className="text-center text-[11px] text-neutral-400 mt-6 font-medium">
          Powered by Smart Digital Library Engine
        </p>
      </div>
    </div>
  );
}