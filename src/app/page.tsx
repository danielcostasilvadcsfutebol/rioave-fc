'use client';

import { useState, useMemo } from 'react';
import { MOCK_JOGOS_2526, MOCK_RESUMO_EPOCAS, calcularKpis } from '@/lib/mock-data';
import type { JogoComRelacoes } from '@/types';

// ── Utils ─────────────────────────────────────────────────────
function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('pt-PT');
}
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}
function barColor(pct: number) {
  if (pct >= 80) return '#006B3C';
  if (pct >= 60) return '#3D9E6E';
  if (pct >= 40) return '#7DC4A0';
  return '#B0D9C4';
}

// ── Icons ─────────────────────────────────────────────────────
function IcoSearch() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="5.5" cy="5.5" r="4.5" />
      <path d="M9.5 9.5l2.5 2.5" strokeLinecap="round" />
    </svg>
  );
}
function IcoChevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d={open ? 'M3 9l4-4 4 4' : 'M3 5l4 4 4-4'} />
    </svg>
  );
}
function IcoSort({ active, asc }: { active: boolean; asc: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ opacity: active ? 1 : 0.35 }}>
      <path d={asc ? 'M5 1L1 7h8L5 1z' : 'M5 9L1 3h8L5 9z'} />
    </svg>
  );
}
function IcoArrow({ up }: { up: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d={up ? 'M5 8V2M2 5l3-3 3 3' : 'M5 2v6M2 5l3 3 3-3'} />
    </svg>
  );
}

// ── Match Row ─────────────────────────────────────────────────
function MatchRow({ jogo, isMax, isMin, expanded, onToggle }: {
  jogo: JogoComRelacoes; isMax: boolean; isMin: boolean;
  expanded: boolean; onToggle: () => void;
}) {
  const pct = jogo.pct_ocupacao ?? 0;
  const bcolor = barColor(pct);

  return (
    <>
      <div
        className={`match-row anim-rise ${expanded ? 'is-expanded' : ''}`}
        onClick={onToggle}
      >
        {/* Jornada */}
        <div className="match-jornada">{jogo.jornada}</div>

        {/* Body */}
        <div className="match-body">
          <div className="match-top">
            <span className="match-opponent">{jogo.adversario}</span>
            <span className="match-attendance">{fmt(jogo.assistencia)}</span>
          </div>
          <div className="match-bar-row">
            <div className="match-bar-track">
              <div
                className="match-bar-fill"
                style={{ width: `${Math.min(pct, 100)}%`, background: bcolor }}
              />
            </div>
            <span className="match-pct">{pct.toFixed(0)}%</span>
          </div>
        </div>

        {/* Status chips */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {isMax && <span className="chip chip-record">⬆ Recorde</span>}
          {isMin && <span className="chip chip-gray">⬇ Mínimo</span>}
          {!isMax && !isMin && (
            <span style={{ color: 'var(--ink4)', display: 'flex', alignItems: 'center' }}>
              <IcoChevron open={expanded} />
            </span>
          )}
        </div>
      </div>

      {/* Expand panel */}
      {expanded && (
        <div className="expand-panel anim-slide">
          <div>
            <div className="expand-item-label">Data</div>
            <div className="expand-item-value">{fmtDate(jogo.data_jogo)}</div>
          </div>
          <div>
            <div className="expand-item-label">Hora</div>
            <div className="expand-item-value">{jogo.hora_jogo ?? '—'}</div>
          </div>
          <div>
            <div className="expand-item-label">Estádio</div>
            <div className="expand-item-value">Arcos</div>
          </div>
          <div>
            <div className="expand-item-label">Capacidade</div>
            <div className="expand-item-value">{fmt(jogo.capacidade_jogo)}</div>
          </div>
          <div>
            <div className="expand-item-label">Ocupação</div>
            <div className="expand-item-value" style={{ color: 'var(--g500)' }}>{pct.toFixed(1)}%</div>
          </div>
          <div>
            <div className="expand-item-label">Competição</div>
            <div className="expand-item-value">Liga</div>
          </div>
        </div>
      )}
    </>
  );
}

// ── History Chart ─────────────────────────────────────────────
function HistorySection() {
  const epocas = MOCK_RESUMO_EPOCAS.filter(e => e.media_assistencia > 0);
  const maxMedia = Math.max(...epocas.map(e => e.media_assistencia));

  return (
    <div className="section-card anim-rise delay-5">
      <div className="section-header">
        <span className="section-title">Média histórica · espectadores / jogo</span>
        <span className="chip chip-gray">{epocas.length} épocas</span>
      </div>
      <div style={{ padding: '12px 0 8px' }}>
        {epocas.map((e, i) => {
          const w = maxMedia > 0 ? (e.media_assistencia / maxMedia) * 100 : 0;
          const isAtiva = e.ativa;
          return (
            <div key={e.epoca} className="hist-row" style={{ animationDelay: `${0.3 + i * 0.04}s` }}>
              <span className="hist-epoch">{e.epoca.replace('/', '/\u200B')}</span>
              <div className="hist-bar-track">
                <div
                  className="hist-bar-fill"
                  style={{
                    width: `${w}%`,
                    background: isAtiva
                      ? 'linear-gradient(90deg, var(--g700), var(--g300))'
                      : 'var(--g100)',
                  }}
                />
              </div>
              <span className="hist-value" style={{ color: isAtiva ? 'var(--g500)' : 'var(--ink3)' }}>
                {fmt(e.media_assistencia)}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{
        padding: '10px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 16,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink4)' }}>
          <span style={{ width: 20, height: 6, borderRadius: 99, background: 'linear-gradient(90deg, var(--g700), var(--g300))', display: 'inline-block' }} />
          Época atual
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink4)' }}>
          <span style={{ width: 20, height: 6, borderRadius: 99, background: 'var(--g100)', display: 'inline-block' }} />
          Épocas anteriores
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
type SortKey = 'jornada' | 'adversario' | 'assistencia' | 'pct_ocupacao';

export default function HomePage() {
  const jogos  = MOCK_JOGOS_2526;
  const kpis   = useMemo(() => calcularKpis(jogos), [jogos]);

  const [sortKey, setSortKey]   = useState<SortKey>('jornada');
  const [sortAsc, setSortAsc]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [tab, setTab]           = useState<'jogos' | 'historico'>('jogos');

  const sorted = useMemo(() => {
    let list = [...jogos];
    if (search.trim()) {
      list = list.filter(j => j.adversario.toLowerCase().includes(search.toLowerCase()));
    }
    list.sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      if (typeof va === 'string' && typeof vb === 'string')
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return list;
  }, [jogos, sortKey, sortAsc, search]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(key === 'jornada'); }
  }

  const epocaAnterior = MOCK_RESUMO_EPOCAS[1];
  const diffMedia = kpis.media - epocaAnterior.media_assistencia;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface3)' }}>

      {/* ── Header ── */}
      <header className="app-header">
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Logo mark */}
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--g700), var(--g300))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,107,60,0.3)',
            }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '-0.03em' }}>RA</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>Rio Ave FC</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--ink4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Estatísticas</div>
            </div>
          </div>
          <nav style={{ display: 'flex', gap: 4 }}>
            <a href="#" style={{ fontSize: 12, fontWeight: 600, color: 'var(--g500)', padding: '5px 10px', borderRadius: 6, background: 'var(--g50)', textDecoration: 'none' }}>
              Assistências
            </a>
            <a href="/admin" style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink3)', padding: '5px 10px', borderRadius: 6, textDecoration: 'none' }}>
              Admin
            </a>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Hero card ── */}
        <div className="hero-card anim-rise" style={{ padding: '24px' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="chip" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', fontSize: 10 }}>
                Época 2025/26
              </span>
              <span className="chip" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', fontSize: 10 }}>
                Liga Portugal Betclic
              </span>
            </div>

            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                Total acumulado · jogos em casa
              </div>
              <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {fmt(kpis.total)}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                espectadores em {kpis.totalJogos} jogos no Estádio dos Arcos
              </div>
            </div>

            {/* Mini stats row */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1, marginTop: 20,
              background: 'rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden',
            }}>
              {[
                { label: 'Média / jogo', value: fmt(kpis.media) },
                { label: 'Recorde', value: fmt(kpis.maximo) },
                { label: 'Ocup. média', value: `${kpis.pctMedia}%` },
              ].map(s => (
                <div key={s.label} style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Comparison strip ── */}
        <div className="anim-rise delay-1" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Variação vs 2024/25
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ color: diffMedia >= 0 ? 'var(--g500)' : '#E03131', display: 'flex', alignItems: 'center', gap: 3 }}>
                <IcoArrow up={diffMedia >= 0} />
              </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: diffMedia >= 0 ? 'var(--g500)' : '#E03131', letterSpacing: '-0.02em' }}>
                {diffMedia >= 0 ? '+' : ''}{fmt(diffMedia)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink4)' }}>esp. por jogo</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--ink4)' }}>2024/25 · <strong style={{ color: 'var(--ink2)' }}>{fmt(epocaAnterior.media_assistencia)}</strong></div>
            <div style={{ fontSize: 11, color: 'var(--ink4)' }}>2025/26 · <strong style={{ color: 'var(--g500)' }}>{fmt(kpis.media)}</strong></div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="anim-rise delay-2" style={{ display: 'flex', gap: 4 }}>
          {(['jogos', 'historico'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '7px 16px', borderRadius: 8,
                fontSize: 12, fontWeight: 600,
                border: '1px solid',
                cursor: 'pointer',
                fontFamily: 'var(--font-sora)',
                transition: 'all 0.15s',
                borderColor: tab === t ? 'var(--g300)' : 'var(--border)',
                background: tab === t ? 'var(--g50)' : 'var(--surface)',
                color: tab === t ? 'var(--g500)' : 'var(--ink3)',
              }}
            >
              {t === 'jogos' ? `Jogos em casa · 25/26` : 'Histórico por época'}
            </button>
          ))}
        </div>

        {/* ── JOGOS tab ── */}
        {tab === 'jogos' && (
          <div className="section-card anim-rise delay-3">
            {/* Header */}
            <div className="section-header">
              <span className="section-title">
                {sorted.length} {sorted.length === 1 ? 'jogo' : 'jogos'}
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Sort buttons */}
                {([ 
                  { key: 'jornada' as SortKey, label: 'Jornada' },
                  { key: 'assistencia' as SortKey, label: 'Assistência' },
                  { key: 'pct_ocupacao' as SortKey, label: 'Ocupação' },
                ] as const).map(s => (
                  <button
                    key={s.key}
                    onClick={() => toggleSort(s.key)}
                    className={`sort-btn ${sortKey === s.key ? 'active' : ''}`}
                  >
                    {s.label}
                    <IcoSort active={sortKey === s.key} asc={sortAsc} />
                  </button>
                ))}
                {/* Search */}
                <div className="search-wrap">
                  <span className="search-icon"><IcoSearch /></span>
                  <input
                    className="search-field"
                    placeholder="Adversário..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Column labels */}
            <div style={{
              display: 'grid', gridTemplateColumns: '28px 1fr auto',
              gap: 12, padding: '6px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface2)',
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>J</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Adversário</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Esp.</span>
              </div>
              <span />
            </div>

            {/* Rows */}
            {sorted.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
                Sem resultados para &ldquo;{search}&rdquo;
              </div>
            ) : sorted.map((jogo, i) => (
              <div key={jogo.id} style={{ animationDelay: `${0.05 + i * 0.025}s` }}>
                <MatchRow
                  jogo={jogo}
                  isMax={jogo.assistencia === kpis.maximo}
                  isMin={jogo.assistencia === kpis.minimo}
                  expanded={expanded === jogo.id}
                  onToggle={() => setExpanded(p => p === jogo.id ? null : jogo.id)}
                />
              </div>
            ))}

            {/* Footer */}
            <div style={{
              padding: '10px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between',
              background: 'var(--surface2)',
            }}>
              <span style={{ fontSize: 11, color: 'var(--ink4)' }}>
                Capacidade: <strong style={{ color: 'var(--ink2)' }}>5.300</strong> esp. · Estádio dos Arcos
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink4)' }}>
                Total filtrado: <strong style={{ color: 'var(--ink2)' }}>{fmt(sorted.reduce((s, j) => s + (j.assistencia ?? 0), 0))}</strong>
              </span>
            </div>
          </div>
        )}

        {/* ── HISTÓRICO tab ── */}
        {tab === 'historico' && <HistorySection />}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '8px 0 16px', fontSize: 11, color: 'var(--ink4)' }}>
          Dados:{' '}
          <a href="https://reisdoave.blogspot.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--g500)', textDecoration: 'none', fontWeight: 500 }}>
            Reis do Ave
          </a>
          {' '}· Plataforma não oficial
        </div>
      </main>
    </div>
  );
}
