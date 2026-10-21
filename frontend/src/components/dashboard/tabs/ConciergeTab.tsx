"use client";

import { useState } from "react";
import { Phone, Mail, CheckCheck, Send, ChevronDown } from "lucide-react";
import { DashboardUser } from "../dashboardData";

interface ConciergeTabProps {
  user: DashboardUser;
  supportForm: {
    subject: string;
    message: string;
    submitted: boolean;
  };
  onChangeSupportForm: (field: string, value: string) => void;
  onSubmitSupport: (e: React.FormEvent) => void;
  onResetSupport: () => void;
}

export default function ConciergeTab({
  user,
  supportForm,
  onChangeSupportForm,
  onSubmitSupport,
  onResetSupport,
}: ConciergeTabProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "When is my coffee roasted before dispatch?",
      a: "Every batch is roasted to order at our Lalitpur facility within 48 hours of dispatch, ensuring peak freshness and aroma bloom when it reaches your door.",
    },
    {
      q: "Can I swap my coffee origin or grind profile?",
      a: "Yes! Use the 'Favorites & Wishlist' tab to swap your origin or click 'Customize Grind' in your subscription tab at any time before your scheduled roast date.",
    },
    {
      q: "How does doorstep delivery work across Nepal?",
      a: "Kathmandu Valley deliveries are completed via Himalayan Express within 24 hours of roasting. Pokhara, Chitwan, and other regions arrive within 48-72 hours.",
    },
    {
      q: "What is your return & refund guarantee?",
      a: "We accept courier doorstep returns for unopened bags within 7 days of delivery. For damaged packages or grind issues, our concierge initiates an immediate replacement or Khalti refund.",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Live Roastery Status Banner */}
      <div className="bg-[#1A1512] text-[#F5F2EB] p-6 md:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E6B34] animate-pulse"></span>
            <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#E58A1F]">
              Lalitpur Roastery Live Operations
            </span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-white mb-1">
            Roastery Operations & Concierge Support
          </h3>
          <p className="text-xs text-[#C8BFAB] max-w-xl leading-relaxed">
            Our drum roasters and coffee specialists are on-site in Jhamsikhel, Lalitpur from 8:00 AM – 6:00 PM NPT. Contact us for grind adjustments, brewing ratios, or courier dispatch support.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="https://wa.me/9779801234567"
            target="_blank"
            rel="noreferrer"
            className="min-h-[44px] px-4 py-2.5 bg-[#2E6B34] hover:bg-[#25582a] text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Phone size={14} /> WhatsApp Hotline
          </a>
          <a
            href="mailto:concierge@brewmellow.com"
            className="min-h-[44px] px-4 py-2.5 bg-[#FAF8F5] text-[#1A1512] hover:bg-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Mail size={14} /> Email Roaster
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Concierge Inquiry Ticket Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E6DEC8] p-6 md:p-8 rounded-2xl shadow-sm">
          <h4 className="text-xl font-serif font-bold text-[#1A1512] mb-1">
            Send a Direct Message to the Roastery
          </h4>
          <p className="text-xs text-[#5C5042] mb-6">
            Typical response time: Under 2 hours during roastery operating hours.
          </p>

          {supportForm.submitted ? (
            <div className="p-6 bg-[#E7F3E8] border border-[#C3E4C6] rounded-xl text-center">
              <CheckCheck size={36} className="text-[#2E6B34] mx-auto mb-2" />
              <h5 className="font-bold text-[#1A1512] text-sm">Message Received by Roaster Team!</h5>
              <p className="text-xs text-[#5C5042] mt-1">
                Our head roaster in Lalitpur has received your inquiry and will respond to <strong>{user.email}</strong> shortly.
              </p>
              <button
                type="button"
                onClick={onResetSupport}
                className="mt-4 px-4 py-2 text-xs uppercase tracking-widest font-bold text-[#2E6B34] underline cursor-pointer"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmitSupport} className="space-y-4">
              <div>
                <label htmlFor="conciergeTopic" className="block font-mono text-xs uppercase tracking-wider font-bold text-[#5C5042] mb-1.5">
                  Topic / Category *
                </label>
                <select
                  id="conciergeTopic"
                  value={supportForm.subject}
                  onChange={(e) => onChangeSupportForm("subject", e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                >
                  <option value="Roast Date & Freshness Inquiry">Roast Date & Freshness Inquiry</option>
                  <option value="Grind Calibration Assistance">Grind Calibration Assistance (V60 / Espresso)</option>
                  <option value="Urgent Delivery Address Modification">Urgent Delivery Address Modification</option>
                  <option value="Direct-Trade Farmer Cooperative Questions">Direct-Trade Farmer Cooperative Questions</option>
                  <option value="General Question">Other Support Question</option>
                </select>
              </div>

              <div>
                <label htmlFor="conciergeMessage" className="block font-mono text-xs uppercase tracking-wider font-bold text-[#5C5042] mb-1.5">
                  Your Message / Question *
                </label>
                <textarea
                  id="conciergeMessage"
                  required
                  rows={4}
                  placeholder="Tell us what you need help with..."
                  value={supportForm.message}
                  onChange={(e) => onChangeSupportForm("message", e.target.value)}
                  className="w-full p-3.5 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
                />
              </div>

              <button
                type="submit"
                className="min-h-[48px] px-6 py-3.5 bg-[#1A1512] hover:bg-[#2C2420] text-white font-mono text-xs uppercase tracking-widest font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Send size={14} /> Send Message to Roastery
              </button>
            </form>
          )}
        </div>

        {/* Right: Interactive FAQ Accordion (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-xl font-serif font-bold text-[#1A1512] mb-1">
            Subscriber Knowledge Base & FAQ
          </h4>
          <p className="text-xs text-[#5C5042] mb-4">
            Quick answers to common coffee subscription inquiries.
          </p>

          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-[#E6DEC8] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-serif font-bold text-sm text-[#1A1512] flex justify-between items-center hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-[#8A7966] transition-transform ${openFaq === idx ? "rotate-180 text-[#A3432A]" : ""}`}
                />
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 text-xs text-[#5C5042] leading-relaxed border-t border-[#F0EAE1] bg-[#FAF8F5]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
