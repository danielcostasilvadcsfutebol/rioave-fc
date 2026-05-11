import type { Metadata, Viewport } from 'next';
import { Sora } from 'next/font/google';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Rio Ave FC · Estatísticas', template: '%s · Rio Ave FC Stats' },
  description: 'A maior plataforma estatística do Rio Ave FC.',
};

export const viewport: Viewport = {
  themeColor: '#006B3C',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={sora.variable}>
      <body className="min-h-screen antialiased" style={{ background: '#F0F2F5', fontFamily: 'var(--font-sora)' }}>
        {children}
      </body>
    </html>
  );
}
