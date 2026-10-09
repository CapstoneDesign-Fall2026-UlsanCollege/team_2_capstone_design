import Link from "next/link";
import { Wrench } from "lucide-react";

export default function ComingSoonPage() {
  return (
    <div className="min-h-[70vh] bg-[#F5F2EB] flex flex-col items-center justify-center p-6 text-center">
      <Wrench size={48} className="text-[#A3432A] mb-6" />
      <h1 className="text-4xl font-serif font-bold text-[#1A1512] mb-4">Feature Coming Soon</h1>
      <p className="text-[#5C5042] mb-8 max-w-md">
        This feature is part of the final production release roadmap and is not available in the current Midterm Vertical Slice.
      </p>
      <Link 
        href="/"
        className="px-8 py-4 bg-[#1A1512] text-[#F5F2EB] text-sm uppercase tracking-widest font-bold hover:bg-[#2C2420] transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
