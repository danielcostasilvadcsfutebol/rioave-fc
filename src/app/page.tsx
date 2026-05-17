'use client';
import Link from 'next/link';
import { useIsMobile } from '@/lib/useIsMobile';

export default function Home() {
  const isMobile = useIsMobile();
  const cards = [
    { href: '/jogos',       emoji: '⚽', title: 'Jogos da Equipa',         desc: 'Resultados, eventos e estatísticas de cada jogo.' },
    { href: '/assistencias',emoji: '🏟️', title: 'Assistências nos Arcos', desc: 'Espectadores e ocupação do estádio por jogo.' },
    { href: '/plantel',     emoji: '👥', title: 'Plantel',                  desc: 'Estatísticas individuais de cada jogador.' },
  ];
  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#003D20,#005A30)', padding: isMobile ? '32px 16px 28px' : '48px 32px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Rio Ave FC · Época 2025/26
        </div>
        <div style={{ fontSize: isMobile ? 26 : 36, fontWeight: 900, color: '#fff', letterSpacing: -1, marginBottom: 8 }}>
          Estatísticas
        </div>
        <div style={{ fontSize: isMobile ? 13 : 15, color: 'rgba(255,255,255,.5)', maxWidth: 400, margin: '0 auto' }}>
          Dados recolhidos por Daniel Silva · Sócio 3883
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: isMobile ? '16px 12px' : '24px 16px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cards.map(card => (
            <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 14, padding: isMobile ? '18px 16px' : '22px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'box-shadow .15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,107,60,.1)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
              >
                <div style={{ width: isMobile ? 52 : 60, height: isMobile ? 52 : 60, borderRadius: 14, background: '#EEF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 22 : 26, flexShrink: 0 }}>
                  {card.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: '#111318', marginBottom: 4 }}>{card.title}</div>
                  <div style={{ fontSize: isMobile ? 12 : 13, color: '#9CA3AF', lineHeight: 1.4 }}>{card.desc}</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#006B3C" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M7 4l6 6-6 6"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
