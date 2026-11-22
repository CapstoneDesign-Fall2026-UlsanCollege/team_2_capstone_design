import {
  Fraunces,
  Inter,
  Noto_Sans_Devanagari,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google";

// Existing core storefront fonts
export const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
  preload: false,
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["600", "700"],
});

// At most 2 additional font families beyond Fraunces and Inter
export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: false,
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["500", "600", "700"],
  preload: false,
});

export const storefrontLatinFontVariablesClass = [
  inter.variable,
  fraunces.variable,
  plusJakartaSans.variable,
  spaceGrotesk.variable,
].join(" ");

export const storefrontFontVariablesClass = [
  notoSansDevanagari.variable,
  storefrontLatinFontVariablesClass,
].join(" ");
