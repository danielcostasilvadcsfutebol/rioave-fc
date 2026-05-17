'use client';
import Link from 'next/link';
import { useIsMobile } from '@/lib/useIsMobile';

const CARDS = [
  { href: '/jogos',        emoji: '⚽', title: 'Jogos da Equipa',          desc: 'Resultados, eventos e estatísticas de cada jogo.' },
  { href: '/assistencias', emoji: '🏟️', title: 'Assistências nos Arcos',  desc: 'Espectadores e ocupação do estádio por jogo.' },
  { href: '/plantel',      emoji: '👥', title: 'Plantel',                   desc: 'Estatísticas individuais de cada jogador.' },
];

export default function Home() {
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(135deg,#003D20,#005A30)', padding: isMobile ? '32px 16px 28px' : '56px 32px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
          Rio Ave FC · Época 2025/26
        </div>
        <div style={{ fontSize: isMobile ? 28 : 42, fontWeight: 900, color: '#fff', letterSpacing: -1.5, marginBottom: 10 }}>
          Estatísticas
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,.4)' }}>
          Dados recolhidos por Daniel Silva · Sócio 3883
        </div>
      </div>

      {/* ── Cards ── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '20px 12px' : '32px 24px', width: '100%', boxSizing: 'border-box' }}>

        {/* DESKTOP: 3 columns grid */}
        {!isMobile && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {CARDS.map(card => (
              <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 16, padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, cursor: 'pointer', height: '100%', boxSizing: 'border-box', transition: 'box-shadow .15s, border-color .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0,107,60,.12)'; (e.currentTarget as HTMLElement).style.borderColor = '#006B3C'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = '#E4E7EC'; }}
                >
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: '#EEF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                    {card.emoji}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111318' }}>{card.title}</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5 }}>{card.desc}</div>
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#006B3C' }}>Ver mais →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* MOBILE: vertical list */}
        {isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CARDS.map(card => (
              <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EEF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {card.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111318', marginBottom: 3 }}>{card.title}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.4 }}>{card.desc}</div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#006B3C" strokeWidth="1.8" strokeLinecap="round"><path d="M6 3l6 6-6 6"/></svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
