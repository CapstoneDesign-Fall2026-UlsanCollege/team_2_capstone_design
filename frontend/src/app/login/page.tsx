"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Coffee, Lock, Mail, ArrowLeft, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    // Check if user exists in local demo session
    const existingUser = localStorage.getItem("demo_user");
    let userData = existingUser ? JSON.parse(existingUser) : null;

    if (userData && userData.email === formData.email) {
      // Logged in with existing customer account
      router.push("/dashboard");
    } else {
      // Fresh demo login or new account
      const newAccount = {
        name: formData.email.split("@")[0].replace(".", " ").toUpperCase(),
        email: formData.email,
        phone: "+977 9801234567",
        address: "Jhamsikhel, Lalitpur, Nepal",
        memberSince: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      };
      localStorage.setItem("demo_user", JSON.stringify(newAccount));
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center justify-center p-6 font-sans">
      <Link href="/" className="mb-8 text-[#1A1512] hover:opacity-80 transition-opacity">
        <Coffee size={40} />
      </Link>

      <div className="w-full max-w-md bg-white p-10 md:p-12 shadow-md border border-[#E6DEC8]">
        <h1 className="text-3xl font-serif font-bold text-[#1A1512] mb-2 text-center">Customer Login</h1>
        <p className="text-[#5C5042] text-xs text-center mb-8 uppercase tracking-widest font-bold">
          Access your recurring subscriptions
        </p>

        {error && (
          <div className="mb-6 p-3 bg-[#FAF5F5] border border-[#F0DADA] text-[#A3432A] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#5C5042] font-bold mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="aditya@example.com"
                className="w-full border-b border-[#E6DEC8] bg-transparent pb-2 text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] transition-colors placeholder-[#A89F91]"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Mail size={16} className="absolute right-0 top-1 text-[#8A7966]" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#5C5042] font-bold mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full border-b border-[#E6DEC8] bg-transparent pb-2 text-sm text-[#1A1512] focus:outline-none focus:border-[#A3432A] transition-colors placeholder-[#A89F91]"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <Lock size={16} className="absolute right-0 top-1 text-[#8A7966]" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#1A1512] text-white py-4 text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors mt-6 shadow-sm"
          >
            Sign In to Dashboard
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#F0EAE1] text-center text-xs text-[#8A7966]">
          Don't have a subscription yet?{" "}
          <Link href="/subscribe" className="text-[#A3432A] font-bold hover:underline">
            Configure Your Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
