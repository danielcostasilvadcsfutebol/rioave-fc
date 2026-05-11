import type { Metadata } from 'next';
import { Bebas_Neue, DM_Sans } from 'next/font/google';
import './globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Rio Ave FC · Estatísticas', template: '%s · Rio Ave FC Stats' },
  description: 'A maior plataforma estatística do Rio Ave FC.',
  themeColor: '#006B3C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${bebasNeue.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-[#F8F9FA] font-body text-[#111111] antialiased">
        {children}
      </body>
    </html>
  );
}
