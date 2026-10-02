import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/Toaster";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerOS — AI-Powered Career Platform",
  description:
    "From learning to hiring, all in one place. AI-powered platform that takes students from learning → building → applying → interviewing → getting hired.",
  keywords: [
    "career platform",
    "resume builder",
    "AI interview",
    "job search",
    "students",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          className="antialiased min-h-screen relative bg-[#0a0a0f] text-gray-100 selection:bg-indigo-500 selection:text-white"
        >
          <ThemeProvider>
            <AnimatedBackground />

            <div className="relative z-10 flex flex-col min-h-screen">
              {children}
            </div>
            
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}