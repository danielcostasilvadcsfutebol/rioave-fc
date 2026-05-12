'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Icon: Football calendar ───────────────────────────────────
function IcoJogos() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="17" r="10" stroke="#006B3C" strokeWidth="2"/>
      <path d="M16 11l1.5 4.5L22 17l-4.5 1.5L16 23l-1.5-4.5L10 17l4.5-1.5L16 11z" fill="#006B3C" opacity=".3"/>
      <circle cx="16" cy="17" r="2" fill="#006B3C"/>
      <rect x="10" y="4" width="2" height="6" rx="1" fill="#006B3C"/>
      <rect x="20" y="4" width="2" height="6" rx="1" fill="#006B3C"/>
      <path d="M8 8h16" stroke="#006B3C" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ── Icon: Stadium / crowd ─────────────────────────────────────
function IcoArcos() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 26c0-8 5-14 12-14s12 6 12 14" stroke="#006B3C" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 26c0-5 3-9 8-9s8 4 8 9" stroke="#006B3C" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      <circle cx="16" cy="8" r="3" fill="#006B3C"/>
      <circle cx="7"  cy="12" r="2" fill="#006B3C" opacity=".5"/>
      <circle cx="25" cy="12" r="2" fill="#006B3C" opacity=".5"/>
      <rect x="3" y="26" width="26" height="2" rx="1" fill="#006B3C"/>
    </svg>
  );
}

interface CardProps {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  tags: string[];
}

function Card({ href, icon, iconBg, title, description, tags }: CardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#fff',
          border: hovered ? '1.5px solid #006B3C' : '1.5px solid #E4E7EC',
          borderRadius: 16,
          padding: '32px 28px 24px',
          cursor: 'pointer',
          transition: 'all .2s ease',
          boxShadow: hovered ? '0 8px 32px rgba(0,107,60,.12)' : '0 2px 8px rgba(0,0,0,.05)',
          transform: hovered ? 'translateY(-3px)' : 'none',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* Icon */}
        <div style={{ width: 64, height: 64, borderRadius: 14, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          {icon}
        </div>

        {/* Title */}
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111318', marginBottom: 10 }}>
          {title}
        </div>

        {/* Description */}
        <div style={{ fontSize: 14, color: '#7B8089', lineHeight: 1.6, marginBottom: 24, flex: 1 }}>
          {description}
        </div>

        {/* CTA */}
        <div style={{ fontSize: 14, fontWeight: 600, color: '#006B3C', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
          Abrir
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="#006B3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map(t => (
            <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#F0F2F5', color: '#6B7280' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', fontFamily: "var(--font-sora, 'Sora', -apple-system, sans-serif)" }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '0.5px solid #E4E7EC', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #005A30, #4D9E72)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,107,60,.3)' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>RA</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111318', lineHeight: 1.2 }}>Rio Ave FC</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#B0B5BE', letterSpacing: '.08em', textTransform: 'uppercase' }}>Estatísticas</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#006B3C', display: 'inline-block', boxShadow: '0 0 0 2px rgba(0,107,60,.2)' }}/>
          <span style={{ fontSize: 11, color: '#7B8089' }}>Época 2025/26</span>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '64px 24px 48px' }}>

        {/* Hero text */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#111318', letterSpacing: '-.03em', margin: '0 0 10px' }}>
            O que pretendes explorar?
          </h1>
          <p style={{ fontSize: 15, color: '#9CA3AF', margin: 0 }}>
            Seleciona uma secção para continuar
          </p>
        </div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'stretch' }}>

          <Card
            href="/jogos"
            iconBg="#EEF7F2"
            icon={<IcoJogos />}
            title="Jogos da Equipa"
            description="Resultados, eventos, estatísticas e formações de todos os jogos realizados pelo Rio Ave FC. Linha a linha, minuto a minuto."
            tags={['Liga', 'Taça Portugal', '2025/26']}
          />

          <Card
            href="/assistencias"
            iconBg="#EEF7F2"
            icon={<IcoArcos />}
            title="Assistências nos Arcos"
            description="Histórico completo de espectadores nos jogos em casa no Estádio dos Arcos desde a época 2006/07. Por jogo, adversário e época."
            tags={['Arcos', 'Adversários', 'Histórico']}
          />

        </div>
      </main>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '0 0 24px', fontSize: 11, color: '#B0B5BE' }}>
        Dados coletados por Daniel Silva · Sócio 3883
      </div>
    </div>
  );
}
