import React from "react";
import Link from "next/link";

const linkClass =
  "text-[#4A4A45] dark:text-[#B4B6BD] hover:text-[#161614] dark:hover:text-[#ECECE9] transition-colors";

export function PlatformFooter() {
  return (
    <footer className="py-8 px-5 text-[13px] text-[#4A4A45] dark:text-[#B4B6BD]">
      <div className="max-w-[1040px] mx-auto flex flex-wrap items-center justify-between gap-3">
        <span>ShopCraft · A capstone project, built in Nepal.</span>

        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <li>
            <Link href="/about" className={linkClass}>
              About
            </Link>
          </li>
          <li>
            <Link href="/privacy" className={linkClass}>
              Privacy
            </Link>
          </li>
          <li>
            <Link href="/terms" className={linkClass}>
              Terms
            </Link>
          </li>
          <li>
            <a href="mailto:hello@shopcraft.me" className={linkClass}>
              hello@shopcraft.me
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
