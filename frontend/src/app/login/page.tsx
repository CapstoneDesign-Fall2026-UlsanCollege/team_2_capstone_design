"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Coffee, Lock, Mail, User, MapPin, Phone, ArrowRight, AlertCircle, Sparkles, Loader2, KeyRound, ShieldCheck } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "Kathmandu",
    password: "",
  });

  // Demo user quick login helper
  const fillDemoCredentials = (email: string, password = "password123") => {
    setMode("login");
    setError(null);
    setLoginData({
      email,
      password,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginData.email || !loginData.password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please check your credentials.");
        return;
      }

      // Store authentic authenticated session
      localStorage.setItem("demo_user", JSON.stringify(data.user));
      if (data.user.is_staff) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Unable to connect to authentication server. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!signupData.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!signupData.email.trim() || !signupData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!signupData.phone.trim()) {
      setError("Please enter your contact phone number.");
      return;
    }
    if (!signupData.streetAddress.trim()) {
      setError("Please enter your delivery street address.");
      return;
    }
    if (!signupData.password || signupData.password.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }

    setLoading(true);

    const fullAddress = `${signupData.streetAddress}, ${signupData.city}`;

    try {
      const res = await fetch("http://localhost:8000/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: signupData.fullName,
          email: signupData.email,
          phone: signupData.phone,
          address: fullAddress,
          password: signupData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        return;
      }

      localStorage.setItem("demo_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err) {
      setError("Unable to connect to authentication server. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center justify-center p-6 font-sans py-16">
      
      {/* Brand Logo */}
      <Link href="/" className="mb-8 text-[#1A1512] hover:opacity-80 transition-opacity flex items-center gap-2">
        <Coffee size={36} className="text-[#A3432A]" />
        <span className="font-serif text-2xl font-bold tracking-tight">BrewMellow.</span>
      </Link>

      <div className="w-full max-w-lg bg-white border border-[#E6DEC8] shadow-xl rounded-xl overflow-hidden">
        
        {/* Tab Switcher */}
        <div className="flex border-b border-[#E6DEC8] bg-[#FAF8F5]">
          <button
            onClick={() => { setMode("login"); setError(null); }}
            className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-colors ${
              mode === "login" 
                ? "bg-white text-[#1A1512] border-b-2 border-[#A3432A]" 
                : "text-[#8A7966] hover:text-[#1A1512]"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode("signup"); setError(null); }}
            className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-colors ${
              mode === "signup" 
                ? "bg-white text-[#1A1512] border-b-2 border-[#A3432A]" 
                : "text-[#8A7966] hover:text-[#1A1512]"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="p-8 md:p-10">
          
          {error && (
            <div className="mb-6 p-3.5 bg-[#FAF5F5] border border-[#F0DADA] text-[#A3432A] text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="e.g. aarav.sharma@gmail.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5] rounded"
                  />
                  <Mail size={16} className="absolute right-3 top-3.5 text-[#8A7966]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042]">
                    Password
                  </label>
                  <span className="text-[10px] text-[#A3432A] font-bold cursor-pointer hover:underline">
                    Forgot Password?
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5] rounded"
                  />
                  <Lock size={16} className="absolute right-3 top-3.5 text-[#8A7966]" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A1512] text-white py-3.5 text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors rounded shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying Credentials...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard <ArrowRight size={14} />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#8A7966] pt-2">
                New subscriber?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-[#A3432A] font-bold hover:underline"
                >
                  Create your account
                </button>
              </p>
            </form>
          )}

          {/* 2. SIGN UP FORM */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditya Gupta"
                  value={signupData.fullName}
                  onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                  className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5] rounded"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="aditya@example.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+977 98XXXXXXXX"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5] rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                  Delivery Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jhamsikhel, Ward 3, House #12"
                  value={signupData.streetAddress}
                  onChange={(e) => setSignupData({ ...signupData, streetAddress: e.target.value })}
                  className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5] rounded"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                    City / Valley *
                  </label>
                  <select
                    value={signupData.city}
                    onChange={(e) => setSignupData({ ...signupData, city: e.target.value })}
                    className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5] rounded"
                  >
                    <option value="Kathmandu">Kathmandu</option>
                    <option value="Lalitpur">Lalitpur</option>
                    <option value="Bhaktapur">Bhaktapur</option>
                    <option value="Pokhara">Pokhara</option>
                    <option value="Other">Other Region</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#5C5042] mb-1.5">
                    Account Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    className="w-full p-3 border border-[#E6DEC8] text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] bg-[#FAF8F5] rounded"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#A3432A] text-white py-3.5 text-xs uppercase tracking-widest font-bold hover:bg-[#8A3722] transition-colors rounded shadow-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Creating Account...
                  </>
                ) : (
                  <>
                    Create Account & Go to Dashboard <ArrowRight size={14} />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#8A7966] pt-1">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-[#A3432A] font-bold hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </form>
          )}

        </div>
      </div>

      {/* Midterm Presentation Quick Test Panel */}
      <div className="w-full max-w-lg mt-6 bg-[#FAF8F5] border border-[#E6DEC8] p-4 rounded-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1A1512] uppercase tracking-wider mb-2">
          <KeyRound size={14} className="text-[#A3432A]" />
          <span>Evaluation Demo Logins (Password: password123)</span>
        </div>
        <p className="text-[11px] text-[#8A7966] mb-3">
          Click any registered customer to prefill and test authentication against the real PostgreSQL database:
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fillDemoCredentials("admin@brewmellow.com", "adminpassword123")}
            className="text-xs px-3 py-1.5 bg-[#1A1512] text-white border border-[#1A1512] hover:bg-[#A3432A] rounded font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck size={13} className="text-[#E58A1F]" /> Staff Admin (Direct to Portal)
          </button>
          <button
            type="button"
            onClick={() => fillDemoCredentials("aarav.sharma@gmail.com")}
            className="text-xs px-3 py-1.5 bg-white border border-[#E6DEC8] hover:border-[#A3432A] rounded font-medium text-[#1A1512] transition-colors"
          >
            Aarav Sharma (Gulmi Plan)
          </button>
          <button
            type="button"
            onClick={() => fillDemoCredentials("priya.shrestha@gmail.com")}
            className="text-xs px-3 py-1.5 bg-white border border-[#E6DEC8] hover:border-[#A3432A] rounded font-medium text-[#1A1512] transition-colors"
          >
            Priya Shrestha (Ilam Plan)
          </button>
          <button
            type="button"
            onClick={() => fillDemoCredentials("rohan.gurung@outlook.com")}
            className="text-xs px-3 py-1.5 bg-white border border-[#E6DEC8] hover:border-[#A3432A] rounded font-medium text-[#1A1512] transition-colors"
          >
            Rohan Gurung (Nuwakot Plan)
          </button>
        </div>
      </div>

    </div>
  );
}
