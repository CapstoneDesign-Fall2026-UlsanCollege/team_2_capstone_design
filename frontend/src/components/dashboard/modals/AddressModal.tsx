"use client";

import { X } from "lucide-react";

interface AddressModalProps {
  isOpen: boolean;
  profileForm: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  onClose: () => void;
  onChange: (field: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
}

export default function AddressModal({
  isOpen,
  profileForm,
  onClose,
  onChange,
  onSave,
}: AddressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full border border-[#E6DEC8] p-8 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-serif font-bold text-[#1A1512]">Update Shipping Destination</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-[#8A7966] hover:text-[#1A1512] cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label htmlFor="addressModalName" className="block font-mono text-xs uppercase tracking-wider font-bold text-[#5C5042] mb-1.5">
              Recipient Full Name *
            </label>
            <input
              id="addressModalName"
              type="text"
              required
              value={profileForm.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="w-full min-h-[48px] px-3.5 py-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
            />
          </div>

          <div>
            <label htmlFor="addressModalStreet" className="block font-mono text-xs uppercase tracking-wider font-bold text-[#5C5042] mb-1.5">
              Delivery Street Address / Ward / Area *
            </label>
            <input
              id="addressModalStreet"
              type="text"
              required
              value={profileForm.address}
              onChange={(e) => onChange("address", e.target.value)}
              className="w-full min-h-[48px] px-3.5 py-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
            />
          </div>

          <div>
            <label htmlFor="addressModalPhone" className="block font-mono text-xs uppercase tracking-wider font-bold text-[#5C5042] mb-1.5">
              Mobile Phone Number (For courier SMS) *
            </label>
            <input
              id="addressModalPhone"
              type="tel"
              required
              value={profileForm.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              className="w-full min-h-[48px] px-3.5 py-3 border border-[#E6DEC8] text-sm text-[#1A1512] bg-[#FAF8F5] rounded-xl focus:outline-none focus:border-[#A3432A]"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] bg-[#1A1512] text-white py-3.5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors rounded-xl mt-2 cursor-pointer active:scale-[0.99]"
          >
            Save Shipping Destination
          </button>
        </form>
      </div>
    </div>
  );
}
