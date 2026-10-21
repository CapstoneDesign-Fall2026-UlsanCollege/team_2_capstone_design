import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] font-sans pb-32 text-[#2C2420]">
      <div className="max-w-3xl mx-auto px-6 pt-16 pb-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#8A7966] hover:text-[#2C2420] transition-colors mb-8 text-sm uppercase tracking-widest font-bold"
        >
          <ArrowLeft size={16} /> Back to Store
        </Link>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E6DEC8] rounded-full text-[#A3432A] font-mono text-xs font-bold uppercase tracking-widest mb-3">
          <Scale size={12} /> Compliance & Trust
        </div>
        
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1A1512] mb-3">
          Privacy Policy
        </h1>
        <p className="text-xs text-[#8A7966] mb-10">
          Last updated: October 2026 • BrewMellow Himalayan Roasters Pvt. Ltd. (PAN: 601928374)
        </p>

        <div className="bg-white border border-[#E6DEC8] rounded-2xl p-8 md:p-12 shadow-sm space-y-8 text-sm text-[#5C5042] leading-relaxed">
          <section>
            <h2 className="text-lg font-serif font-bold text-[#1A1512] mb-2 flex items-center gap-2">
              <Eye size={18} className="text-[#A3432A]" /> 1. Information We Collect
            </h2>
            <p>
              When you subscribe or place an order with BrewMellow, we collect information necessary to roast, pack, and fulfill your coffee. This includes your name, delivery address within Nepal, mobile phone number for courier coordination, and email address for dispatch invoices and account access.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif font-bold text-[#1A1512] mb-2 flex items-center gap-2">
              <Lock size={18} className="text-[#A3432A]" /> 2. Payment Data Security
            </h2>
            <p>
              We do not store your debit/credit card numbers or online banking passwords on our servers. All digital transactions are processed through authorized payment gateways (such as eSewa, Khalti, or merchant banking rails) using industry-standard TLS encryption.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif font-bold text-[#1A1512] mb-2 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#A3432A]" /> 3. Courier & Third-Party Disclosure
            </h2>
            <p>
              Your contact number and delivery destination are shared solely with our doorstep logistics partners to complete physical hand-off. We strictly maintain a zero-monetization policy on customer data: we never sell or lease your records to third-party advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif font-bold text-[#1A1512] mb-2 flex items-center gap-2">
              <FileText size={18} className="text-[#A3432A]" /> 4. Your Rights & Account Controls
            </h2>
            <p>
              You may review, update, or purge your account details at any time through your <Link href="/dashboard" className="text-[#A3432A] font-bold underline">Subscriber Portal</Link>, or contact our privacy lead at <a href="mailto:privacy@brewmellow.com" className="text-[#A3432A] font-bold underline">privacy@brewmellow.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center text-xs text-[#8A7966]">
          Looking for terms of purchase? View our <Link href="/terms" className="text-[#A3432A] font-bold underline">Terms of Service</Link>.
        </div>
      </div>
    </div>
  );
}
