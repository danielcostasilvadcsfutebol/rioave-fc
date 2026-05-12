'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getRosterRA, FICHAS_DISPONIVEIS,
  type JogadorPlantel,
} from '@/lib/mock-jogos-equipa';

const EPOCAS = ['25/26'];

const POS_GROUP: Record<string, string> = {
  GR: 'Guarda-Redes',
  DC: 'Defesas', DD: 'Defesas', DE: 'Defesas',
  MDC: 'Médios', MI: 'Médios', ME: 'Médios', MAD: 'Médios', MAM: 'Médios', MAE: 'Médios',
  AV: 'Avançados',
};
const GROUP_ORDER = ['Guarda-Redes', 'Defesas', 'Médios', 'Avançados'];
const POS_COLOR: Record<string, string> = {
  'Guarda-Redes': '#EBF4FF',
  'Defesas':       '#EEF7F2',
  'Médios':        '#FFF4E5',
  'Avançados':     '#FCEBEB',
};
const POS_TEXT: Record<string, string> = {
  'Guarda-Redes': '#1A5FA8',
  'Defesas':       '#006B3C',
  'Médios':        '#A05C00',
  'Avançados':     '#A32D2D',
};

export default function PlantelPage() {
  const [epoca, setEpoca] = useState('25/26');
  const [search, setSearch] = useState('');

  const roster = useMemo(() => getRosterRA(epoca), [epoca]);
  const fichasTotal = FICHAS_DISPONIVEIS[epoca] ?? 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return roster;
    return roster.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));
  }, [roster, search]);

  // Group by position
  const grouped = useMemo(() => {
    const map = new Map<string, JogadorPlantel[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const p of filtered) {
      const g = POS_GROUP[p.posicao ?? ''] ?? 'Outros';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(p);
    }
    return map;
  }, [filtered]);

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '0.5px solid #E4E7EC', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', color: '#6B7280', fontSize: 12, fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
            Início
          </Link>
          <span style={{ color: '#E4E7EC' }}>·</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111318' }}>Plantel</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#B0B5BE', letterSpacing: '.08em', textTransform: 'uppercase' }}>Rio Ave FC</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Banner */}
        <div style={{ background: 'linear-gradient(135deg,#003D20,#005A30)', borderRadius: 14, padding: 20, color: '#fff' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Plantel · Fichas de jogo
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 4 }}>Rio Ave FC</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
            {[
              { l: 'Jogadores', v: roster.length },
              { l: 'Fichas disponíveis', v: `${fichasTotal} de 34` },
              { l: 'Época', v: epoca },
            ].map(s => (
              <div key={s.l} style={{ background: 'rgba(0,0,0,.2)', borderRadius: 9, padding: '8px 14px', minWidth: 80, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', fontSize: 11, color: '#92400E' }}>
          ⚠️ Plantel derivado das <strong>{fichasTotal} fichas de jogo</strong> disponíveis de {epoca} (de 34 jogos disputados). Será atualizado à medida que mais fichas forem inseridas.
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Época</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {EPOCAS.map(e => (
                <button key={e} onClick={() => setEpoca(e)} style={{
                  padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                  border: '1.5px solid', cursor: 'pointer',
                  borderColor: epoca === e ? '#006B3C' : '#D1D5DB',
                  background:  epoca === e ? '#006B3C' : '#fff',
                  color:       epoca === e ? '#fff' : '#6B7280',
                }}>{e}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Pesquisar</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F9FAFB', border: '1px solid #E4E7EC', borderRadius: 8, padding: '6px 10px' }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                <circle cx="5.5" cy="5.5" r="4.5"/><path d="M9.5 9.5l2.5 2.5" strokeLinecap="round"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome do jogador..."
                style={{ border: 'none', background: 'transparent', fontSize: 12, color: '#111318', outline: 'none', flex: 1 }}/>
            </div>
          </div>
        </div>

        {/* Player list by group */}
        {GROUP_ORDER.map(group => {
          const players = grouped.get(group) ?? [];
          if (players.length === 0) return null;
          return (
            <div key={group} style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: '#F9FAFB', borderBottom: '1px solid #E4E7EC', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111318' }}>{group}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{players.length} jogadores</span>
              </div>
              {players.map((p, i) => (
                <div key={p.nome} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto auto auto', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < players.length-1 ? '1px solid #F3F4F6' : 'none', transition: 'background .1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#F9FAFB'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}
                >
                  {/* Number */}
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#374151' }}>
                    {p.numero}
                  </div>
                  {/* Name + position */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111318' }}>{p.nome}</div>
                    {p.posicao && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: POS_COLOR[group] ?? '#F0F2F5', color: POS_TEXT[group] ?? '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        {p.posicao}
                      </span>
                    )}
                  </div>
                  {/* Stats */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#006B3C' }}>{p.jogosTotal}</div>
                    <div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em' }}>Fichas</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111318' }}>{p.jogosTitular}</div>
                    <div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em' }}>Titular</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>{p.jogosSuplente}</div>
                    <div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em' }}>Banco</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        <div style={{ textAlign: 'center', padding: '4px 0 16px', fontSize: 11, color: '#B0B5BE' }}>
          Dados coletados por Daniel Silva · Sócio 3883
        </div>
      </main>
    </div>
  );
}
