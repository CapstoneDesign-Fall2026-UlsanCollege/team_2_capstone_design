"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Coffee } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    // Save to local storage to simulate backend auth for the demo
    localStorage.setItem(
      "demo_user",
      JSON.stringify({
        ...formData,
        memberSince: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      })
    );

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col items-center justify-center p-6">
      <Link href="/" className="mb-8 text-[#1A1512] hover:opacity-80 transition-opacity">
        <Coffee size={40} />
      </Link>

      <div className="w-full max-w-md bg-white p-10 shadow-sm border border-[#E6DEC8]">
        <h1 className="text-3xl font-serif font-bold text-[#1A1512] mb-2 text-center">Welcome Back</h1>
        <p className="text-[#5C5042] text-sm text-center mb-8">Enter your details to access your subscription.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#5C5042] font-bold mb-2">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Jane Doe"
              className="w-full border-b border-[#E6DEC8] bg-transparent pb-2 text-[#1A1512] focus:outline-none focus:border-[#A3432A] transition-colors placeholder-[#A89F91]"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[#5C5042] font-bold mb-2">Email</label>
            <input
              type="email"
              required
              placeholder="jane@example.com"
              className="w-full border-b border-[#E6DEC8] bg-transparent pb-2 text-[#1A1512] focus:outline-none focus:border-[#A3432A] transition-colors placeholder-[#A89F91]"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[#5C5042] font-bold mb-2">Delivery Address</label>
            <input
              type="text"
              required
              placeholder="e.g., 123 Himalaya Way, Kathmandu"
              className="w-full border-b border-[#E6DEC8] bg-transparent pb-2 text-[#1A1512] focus:outline-none focus:border-[#A3432A] transition-colors placeholder-[#A89F91]"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#1A1512] text-white py-4 text-sm uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors mt-8"
          >
            Access Dashboard
          </button>
        </form>
      </div>
      
      <p className="text-xs text-[#8A7966] mt-8 uppercase tracking-widest">Midterm Demo Mode</p>
    </div>
  );
}
