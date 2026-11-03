"use client";

import React, { Suspense } from "react";
import { PasswordlessAuthCard } from "@/components/auth/OtpInput";
import { useSearchParams } from "next/navigation";

function SignupContent() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const storeNameParam = searchParams.get("name");

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] flex flex-col items-center justify-center p-4 sm:p-6 bg-[#FAFAF7]">
      {storeNameParam && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E1E3E5] bg-white text-xs text-[#4B5060]">
          <span className="w-2 h-2 rounded-full bg-[#121212]" aria-hidden="true" />
          <span>
            Claiming store name: <strong className="text-[#121212]">{storeNameParam}</strong>
          </span>
        </div>
      )}

      <div className="w-full max-w-md">
        <PasswordlessAuthCard
          title="Create your ShopCraft account"
          subtitle="Start your 14-day free trial. Settle in NPR with native Khalti & COD."
          nextParam={nextParam}
          storeNameParam={storeNameParam}
        />
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center bg-[#FAFAF7]">
          <div className="w-full max-w-md p-8 bg-white border border-[#E1E3E5] rounded-xl animate-pulse space-y-4">
            <div className="h-6 w-48 bg-zinc-200 rounded" />
            <div className="h-4 w-64 bg-zinc-100 rounded" />
            <div className="h-10 w-full bg-zinc-100 rounded" />
          </div>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
