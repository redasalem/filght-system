import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'AeroFlow — Direct-Carrier Aviation',
  description:
    'Direct-carrier transcontinental flight booking platform with verified fleet management, deterministic seat locks, and bespoke AI concierge.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#244232',
          colorBackground: '#f3ecd6',
          colorNeutral: '#1c1a14',
          borderRadius: '3px',
          fontFamily: "'Inter', sans-serif",
        },
        elements: {
          card: 'bg-[#f3ecd6] border border-[rgba(28,26,20,0.12)] shadow-none rounded-[4px]',
          formButtonPrimary:
            'bg-[#244232] hover:bg-[#1a3024] text-[#f3ecd6] uppercase tracking-[0.14em] text-[13px] font-medium rounded-[3px]',
        },
      }}
    >
      <html lang="en" className="h-full scroll-smooth">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-full flex flex-col bg-[#f3ecd6] text-[#1c1a14]">
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[rgba(28,26,20,0.12)] bg-[#ebe4cf] py-16 px-6 mt-32">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div>
                <div className="flex items-center gap-2">
                  <span className="notary-mark" />
                  <span className="font-display text-2xl tracking-tight font-normal text-[#1c1a14]">
                    AEROFLOW
                  </span>
                  <span className="ui-caption text-[#6b6759] ml-2">
                    CARRIER OPS // IATA VERIFIED
                  </span>
                </div>
                <p className="text-xs text-[#6b6759] mt-2 font-mono max-w-xl leading-relaxed">
                  DIRECT-CARRIER FLEET // BOEING 787-9 & AIRBUS A350 // REDIS DETERMINISTIC SEAT LOCKING (10M TTL) // STRIPE IDEMPOTENT SETTLEMENT // GEMINI SEMANTIC RETRIEVAL
                </p>
              </div>
              <div className="text-left md:text-right text-xs text-[#6b6759] font-mono space-y-1">
                <p>© 2026 AEROFLOW FLIGHT ENGINE. ALL RIGHTS RESERVED.</p>
                <p className="text-[#244232]">■ DIRECT-CARRIER ARCHITECTURE // NON-AGGREGATED</p>
              </div>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
