"use client";

import React, { useState } from "react";
import { Check, Send } from "lucide-react";

export function ContactFormClient({ storeName }: { storeName: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("order");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="p-6 rounded-sf border border-sf-line bg-sf-surface shadow-2xs space-y-4">
      <h3 className="font-sf-display text-lg font-bold text-sf-ink">
        Send a Message to {storeName}
      </h3>

      {submitted ? (
        <div className="p-6 rounded-sf border border-emerald-300 bg-emerald-50 text-center space-y-3 animate-in fade-in">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
          <h4 className="font-sf-display text-sm font-bold text-emerald-950">
            Message Sent Successfully
          </h4>
          <p className="text-xs font-sf-mono text-emerald-800 leading-relaxed">
            Thank you, {name}! The {storeName} team has received your message and will follow up with you directly via WhatsApp or phone shortly.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setMessage("");
            }}
            className="text-xs font-sf-mono text-emerald-900 underline pt-2 cursor-pointer"
          >
            Send another inquiry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-sf-mono font-medium text-sf-ink block">
              Your Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Suman Shakya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sf-mono font-medium text-sf-ink block">
              Mobile Number (WhatsApp Preferred)
            </label>
            <input
              type="tel"
              required
              placeholder="98XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sf-mono font-medium text-sf-ink block">
              Inquiry Topic
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40 cursor-pointer"
            >
              <option value="order">Order Status &amp; Tracking</option>
              <option value="product">Product Details &amp; Custom Options</option>
              <option value="delivery">Kathmandu Valley / 7-Province Shipping</option>
              <option value="wholesale">Bulk Orders &amp; Wholesale Pricing</option>
              <option value="general">General Question</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sf-mono font-medium text-sf-ink block">
              Message
            </label>
            <textarea
              rows={4}
              required
              placeholder="Tell us what you're looking for or how we can assist..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink font-sf-mono text-xs focus:outline-none focus:ring-1 focus:ring-sf-ink/40"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] h-12 rounded-sf bg-sf-cta text-sf-cta-ink font-sf-mono text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Message</span>
          </button>
        </form>
      )}
    </div>
  );
}