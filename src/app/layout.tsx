import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { IdentityGate } from "@/components/identity/IdentityGate";
import { UniversityBrand } from "@/components/identity/UniversityBrand";
import { DemoProvider } from "@/context/DemoContext";
import { IdentityProvider } from "@/context/IdentityContext";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Circle — College friendships that actually happen",
  description:
    "Circle introduces you to a small group of students and helps turn introductions into actual friendships.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <IdentityProvider>
          <UniversityBrand>
            <IdentityGate>
              <DemoProvider>{children}</DemoProvider>
            </IdentityGate>
          </UniversityBrand>
        </IdentityProvider>
      </body>
    </html>
  );
}
