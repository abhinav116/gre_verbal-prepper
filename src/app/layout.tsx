import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Greheads — Read like the GRE expects you to",
  description:
    "One curated article a day. GRE vocabulary in context. Comprehension questions built in. Free.",
  openGraph: {
    title: "Greheads — Read like the GRE expects you to",
    description: "One curated article a day. GRE vocabulary in context. Comprehension questions built in. Free.",
    type: "website",
    url: process.env.NEXT_PUBLIC_BASE_URL,
    siteName: "Greheads",
  },
  twitter: {
    card: "summary_large_image",
    title: "Greheads — Read like the GRE expects you to",
    description: "One curated article a day. GRE vocabulary in context. Comprehension questions built in. Free.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#faf9f6] text-gray-900">
        {children}
      </body>
    </html>
  );
}
