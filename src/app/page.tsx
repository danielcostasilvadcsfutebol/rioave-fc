'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Icons ─────────────────────────────────────────────────────
function IcoJogos() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="17" r="10" stroke="#006B3C" strokeWidth="2"/>
      <path d="M16 12l1.2 3.8L21 17l-3.8 1.2L16 22l-1.2-3.8L11 17l3.8-1.2L16 12z" fill="#006B3C" opacity=".3"/>
      <circle cx="16" cy="17" r="2" fill="#006B3C"/>
      <rect x="10" y="4" width="2" height="5" rx="1" fill="#006B3C"/>
      <rect x="20" y="4" width="2" height="5" rx="1" fill="#006B3C"/>
      <path d="M8 8h16" stroke="#006B3C" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IcoArcos() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M4 26c0-8 5-14 12-14s12 6 12 14" stroke="#006B3C" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 26c0-5 3-9 8-9s8 4 8 9" stroke="#006B3C" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      <circle cx="16" cy="8" r="3" fill="#006B3C"/>
      <circle cx="7"  cy="12" r="2" fill="#006B3C" opacity=".5"/>
      <circle cx="25" cy="12" r="2" fill="#006B3C" opacity=".5"/>
      <rect x="3" y="26" width="26" height="2" rx="1" fill="#006B3C"/>
    </svg>
  );
}
function IcoPlantel() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="12" cy="10" r="4" stroke="#006B3C" strokeWidth="2"/>
      <circle cx="22" cy="10" r="3" stroke="#006B3C" strokeWidth="1.8" opacity=".6"/>
      <path d="M4 26c0-5 4-8 8-8s8 3 8 8" stroke="#006B3C" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 18c3 1 5 3 5 6" stroke="#006B3C" strokeWidth="1.8" strokeLinecap="round" opacity=".6"/>
      <path d="M9 22l2 4 3-4" stroke="#006B3C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

interface CardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  badge?: string; // e.g. "Novo" or "Beta"
}

function Card({ href, icon, title, description, tags, badge }: CardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'flex' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#fff',
          border: hovered ? '1.5px solid #006B3C' : '1.5px solid #E4E7EC',
          borderRadius: 16,
          padding: '28px 24px 22px',
          cursor: 'pointer',
          transition: 'all .2s ease',
          boxShadow: hovered ? '0 8px 32px rgba(0,107,60,.12)' : '0 2px 8px rgba(0,0,0,.05)',
          transform: hovered ? 'translateY(-3px)' : 'none',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {badge && (
          <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: '#EEF7F2', color: '#006B3C', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {badge}
          </span>
        )}
        <div style={{ width: 58, height: 58, borderRadius: 14, background: '#EEF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          {icon}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#111318', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{description}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#006B3C', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
          Abrir
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="#006B3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {tags.map(t => (
            <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: '#F0F2F5', color: '#6B7280' }}>{t}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function LandingPage() {
  const CARDS = [
    {
      href: '/jogos', icon: <IcoJogos/>,
      title: 'Jogos da Equipa',
      description: 'Resultados, eventos, estatísticas e formações de todos os jogos realizados pelo Rio Ave FC.',
      tags: ['Liga', 'Taça', '2025/26'],
    },
    {
      href: '/assistencias', icon: <IcoArcos/>,
      title: 'Assistências nos Arcos',
      description: 'Histórico completo de espectadores nos jogos em casa no Estádio dos Arcos desde 2006/07.',
      tags: ['Estádio dos Arcos', 'Adversários', 'Histórico'],
    },
    {
      href: '/plantel', icon: <IcoPlantel/>,
      title: 'Plantel',
      description: 'Jogadores que integraram as fichas de jogo em cada temporada. Titularidades, convocatórias e posições.',
      tags: ['Jogadores', 'Temporada', '2025/26'],
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', fontFamily: "var(--font-sora,'Sora',-apple-system,sans-serif)" }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '0.5px solid #E4E7EC', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#005A30,#4D9E72)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,107,60,.3)' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>RA</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111318', lineHeight: 1.2 }}>Rio Ave FC</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#B0B5BE', letterSpacing: '.08em', textTransform: 'uppercase' }}>Estatísticas</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#006B3C', display: 'inline-block', boxShadow: '0 0 0 2px rgba(0,107,60,.2)' }}/>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>Época 2025/26</span>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: '#111318', letterSpacing: '-.03em', margin: '0 0 10px' }}>
            O que pretendes explorar?
          </h1>
          <p style={{ fontSize: 15, color: '#9CA3AF', margin: 0 }}>
            Seleciona uma secção para continuar
          </p>
        </div>

        {/* 3 cards per row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, alignItems: 'stretch' }}>
          {CARDS.map(c => <Card key={c.href} {...c}/>)}
        </div>
      </main>

      <div style={{ textAlign: 'center', padding: '0 0 24px', fontSize: 11, color: '#B0B5BE' }}>
        Dados coletados por Daniel Silva · Sócio 3883
      </div>
    </div>
  );
}
