import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RSC Enterprise Reporting Platform',
  description: 'Enterprise reporting platform with distributed print agents and Takumi vector engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="antialiased min-h-screen bg-[#F4F4F5] text-[#111827] font-sans selection:bg-[#EAF0FF] selection:text-[#2F6BFF]">
        {children}
      </body>
    </html>
  );
}
