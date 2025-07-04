import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
//import dynamic from 'next/dynamic';

// eslint-disable-next-line @typescript-eslint/naming-convention
// const HeaderComponent = dynamic(() => import('./components/Header'), { ssr: false });

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chat BI',
  keywords: 'BI, Data Analysis, AI Assistant, InsightAI for your business',
  description: 'InsightAI introduces a cutting-edge intelligent analysis tool, providing an all-in-one data analysis solution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="techDark">
      <body className={`${inter.className} bg-gradient-to-br from-gray-900 via-blue-900 to-blue-800 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
