import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InsightAI BI Assistant',
  keywords: 'BI, Data Analysis, AI Assistant, InsightAI',
  description: 'InsightAI introduces a cutting-edge intelligent analysis tool, providing an all-in-one data analysis solution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="techDark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
