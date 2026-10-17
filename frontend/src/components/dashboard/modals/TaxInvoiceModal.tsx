"use client";

import { CheckCircle2, Printer, X } from "lucide-react";
import { DashboardUser } from "../dashboardData";

interface TaxInvoiceModalProps {
  order: any | null;
  user: DashboardUser;
  grindType: string;
  onClose: () => void;
}

export default function TaxInvoiceModal({
  order,
  user,
  grindType,
  onClose,
}: TaxInvoiceModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white max-w-xl w-full border border-[#E6DEC8] p-8 shadow-2xl my-8 rounded-2xl animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-6 mb-6 border-b border-[#E6DEC8]">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#2E6B34]">
            <CheckCircle2 size={16} /> Official Tax Invoice (Nepal VAT)
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1512] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors rounded-lg cursor-pointer"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button 
              type="button"
              onClick={onClose} 
              className="text-[#8A7966] hover:text-[#1A1512] cursor-pointer"
              aria-label="Close invoice"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-6 text-[#1A1512]">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-2xl font-serif font-bold text-[#1A1512]">BrewMellow.</h4>
              <p className="text-xs text-[#5C5042]">BrewMellow Himalayan Roasters Pvt. Ltd.</p>
              <p className="text-xs text-[#8A7966]">Jhamsikhel, Lalitpur, Nepal</p>
              <p className="text-xs text-[#8A7966]">PAN / VAT: 609812450</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest font-bold text-[#8A7966]">Invoice No.</p>
              <p className="text-sm font-bold text-[#1A1512]">INV-{order.id.toString().padStart(5, "0")}</p>
              <p className="text-xs text-[#8A7966] mt-1">Date: {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="p-4 bg-[#FAF8F5] border border-[#E6DEC8] text-xs rounded-xl">
            <p className="uppercase tracking-widest font-bold text-[#8A7966] mb-1">Billed To (Subscriber)</p>
            <p className="font-bold text-[#1A1512]">{user.name}</p>
            <p className="text-[#5C5042]">{user.email}</p>
            <p className="text-[#5C5042]">{user.address}</p>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E6DEC8] text-[#8A7966] uppercase tracking-wider font-bold">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">Commitment</th>
                <th className="py-2 text-right">Amount (NPR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              <tr>
                <td className="py-3">
                  <p className="font-bold text-[#1A1512]">{order.origin_name} Specialty Lot</p>
                  <p className="text-[#8A7966]">{order.weight_kg} kg Monthly Delivery • {grindType}</p>
                </td>
                <td className="py-3 text-center text-[#5C5042]">{order.plan_name}</td>
                <td className="py-3 text-right font-medium text-[#1A1512]">Rs. {order.total_price_npr}</td>
              </tr>
            </tbody>
          </table>

          <div className="pt-4 border-t border-[#E6DEC8] space-y-1.5 text-xs text-right">
            <div className="flex justify-between">
              <span className="text-[#8A7966]">Subtotal:</span>
              <span className="font-medium">Rs. {order.total_price_npr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A7966]">Himalayan Shipping:</span>
              <span className="font-medium text-[#2E6B34]">FREE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A7966]">VAT (13% Included):</span>
              <span className="font-medium">Rs. {(parseFloat(order.total_price_npr) * 0.115).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#E6DEC8] text-sm font-bold">
              <span>Total Paid (NPR):</span>
              <span className="text-[#A3432A]">Rs. {order.total_price_npr}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
