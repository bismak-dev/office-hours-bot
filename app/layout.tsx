import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Office Hours Bot",
  description: "Ask questions about the course syllabus and lecture slides.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
