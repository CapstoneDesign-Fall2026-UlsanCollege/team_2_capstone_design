import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your store",
  description: "Open your online store in Nepal in minutes with Khalti, cash on delivery, and four ready-made looks.",
  alternates: { canonical: "/signup" },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
