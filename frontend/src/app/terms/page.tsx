import Link from "next/link";
import { ArrowLeft, FileText, RotateCcw, Clock, Truck, ShieldAlert } from "lucide-react";

export default function TermsPage() {
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
          <FileText size={12} /> Customer Agreement
        </div>
        
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1A1512] mb-3">
          Terms of Service & Cancellation
        </h1>
        <p className="text-xs text-[#8A7966] mb-10">
          BrewMellow Himalayan Roasters Pvt. Ltd. • Registered under Nepal Companies Act
        </p>

        <div className="bg-white border border-[#E6DEC8] rounded-2xl p-8 md:p-12 shadow-sm space-y-8 text-sm text-[#5C5042] leading-relaxed">
          <section>
            <h2 className="text-lg font-serif font-bold text-[#1A1512] mb-2 flex items-center gap-2">
              <Clock size={18} className="text-[#A3432A]" /> 1. Freshness Guarantee & Doorstep Returns
            </h2>
            <p>
              We commit to dispatching all single-origin lots within 48 hours of drum-roasting in Lalitpur. If your coffee arrives compromised, damaged in transit, or fails our specialty freshness standard, you are entitled to a free doorstep courier replacement or full refund requested within 7 days via your <Link href="/dashboard?tab=returns" className="text-[#A3432A] font-bold underline">Returns Portal</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif font-bold text-[#1A1512] mb-2 flex items-center gap-2">
              <RotateCcw size={18} className="text-[#A3432A]" /> 2. Order Cancellation &amp; Changes
            </h2>
            <p>
              Orders can be modified or cancelled directly prior to courier dispatch by contacting store support. Once dispatched with our courier partner, standard returns and exchanges apply upon arrival.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif font-bold text-[#1A1512] mb-2 flex items-center gap-2">
              <Truck size={18} className="text-[#A3432A]" /> 3. Delivery Coverage & Logistics
            </h2>
            <p>
              Free doorstep courier applies to all addresses within the Kathmandu Valley (Kathmandu, Lalitpur, Bhaktapur). Deliveries outside the valley are coordinated via express courier networks and dispatched with tracking notifications sent via SMS/email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif font-bold text-[#1A1512] mb-2 flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#A3432A]" /> 4. Pricing & Tax Invoicing
            </h2>
            <p>
              All prices quoted on the store are in Nepalese Rupees (NPR) inclusive of all applicable domestic taxes. Official VAT invoices (PAN: 601928374) are generated digitally with every dispatched shipment and can be downloaded from your account portal.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center text-xs text-[#8A7966]">
          Questions regarding your order? Contact concierge at <a href="mailto:concierge@brewmellow.com" className="text-[#A3432A] font-bold underline">concierge@brewmellow.com</a>.
        </div>
      </div>
    </div>
  );
}
