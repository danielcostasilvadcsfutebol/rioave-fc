'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  EPOCAS_ORDENADAS, getJogosByEpoca, MOCK_RESUMO_EPOCAS,
  calcularKpis, getEstatisticasAdversarios, getHistoricoAdversario,
} from '@/lib/mock-data';
import type { JogoComRelacoes } from '@/types';

// ── Utilities ─────────────────────────────────────────────────
function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('pt-PT');
}
function barColor(p: number) {
  if (p >= 80) return '#006B3C';
  if (p >= 60) return '#3D9E6E';
  if (p >= 40) return '#7DC4A0';
  return '#B0D9C4';
}

function IcoSearch() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="5.5" cy="5.5" r="4.5"/><path d="M9.5 9.5l2.5 2.5" strokeLinecap="round"/>
    </svg>
  );
}
function IcoChevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d={open ? 'M3 9l4-4 4 4' : 'M3 5l4 4 4-4'}/>
    </svg>
  );
}
function IcoSortArrow({ active, asc }: { active: boolean; asc: boolean }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" style={{ opacity: active ? 1 : 0.3, flexShrink: 0 }}>
      <path d={active && asc ? 'M4 1L1 6h6L4 1z' : 'M4 7L1 2h6L4 7z'}/>
    </svg>
  );
}
function IcoArrow({ up }: { up: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d={up ? 'M5 8V2M2 5l3-3 3 3' : 'M5 2v6M2 5l3 3 3-3'}/>
    </svg>
  );
}

type SortKey = 'jornada' | 'adversario' | 'assistencia' | 'pct_ocupacao';
type AdvSortKey = 'adversario' | 'visitas' | 'media' | 'maximo';
type HistSortKey = 'epoca' | 'assistencia';

function ColHeader<K extends string>({ label, colKey, sortKey, sortAsc, onSort, align = 'left' }: {
  label: string; colKey: K; sortKey: K; sortAsc: boolean;
  onSort: (k: K) => void; align?: 'left' | 'right';
}) {
  const active = sortKey === colKey;
  return (
    <button onClick={() => onSort(colKey)} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
      color: active ? 'var(--g500)' : 'var(--ink4)', fontFamily: 'var(--font-sora)', transition: 'color .15s',
    }}>
      {label}<IcoSortArrow active={active} asc={sortAsc}/>
    </button>
  );
}

// ── MatchRow (Por Jogo) ───────────────────────────────────────
function MatchRow({ jogo, isMax, isMin, expanded, onToggle }: {
  jogo: JogoComRelacoes; isMax: boolean; isMin: boolean; expanded: boolean; onToggle: () => void;
}) {
  const p = jogo.pct_ocupacao ?? 0;
  return (
    <>
      <div className={`match-row ${expanded ? 'is-expanded' : ''}`} onClick={onToggle}>
        <div className="match-jornada">{jogo.jornada}</div>
        <div className="match-body">
          <div className="match-top">
            <span className="match-opponent">{jogo.adversario}</span>
            <span className="match-attendance">{jogo.jogo_porta_fechada ? '—' : fmt(jogo.assistencia)}</span>
          </div>
          {jogo.jogo_porta_fechada
            ? <span className="chip chip-gray" style={{ fontSize: 10, marginTop: 2 }}>Porta fechada</span>
            : <div className="match-bar-row">
                <div className="match-bar-track"><div className="match-bar-fill" style={{ width: `${Math.min(p, 100)}%`, background: barColor(p) }}/></div>
                <span className="match-pct">{p.toFixed(0)}%</span>
              </div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, minWidth: 60 }}>
          {isMax && <span className="chip chip-record">↑ Recorde</span>}
          {isMin && !jogo.jogo_porta_fechada && <span className="chip chip-gray">↓ Mín.</span>}
          {!isMax && !isMin && <span style={{ color: 'var(--ink4)' }}><IcoChevron open={expanded}/></span>}
        </div>
      </div>
      {expanded && (
        <div className="expand-panel anim-slide">
          <div><div className="expand-item-label">Capacidade</div><div className="expand-item-value">{fmt(jogo.capacidade_jogo)}</div></div>
          <div><div className="expand-item-label">Ocupação</div><div className="expand-item-value" style={{ color: 'var(--g500)' }}>{jogo.jogo_porta_fechada ? '—' : `${p.toFixed(1)}%`}</div></div>
          <div><div className="expand-item-label">Estádio</div><div className="expand-item-value">{jogo.estadio?.nome ?? 'Arcos'}</div></div>
          {jogo.notas && <div style={{ gridColumn: '1 / -1' }}><div className="expand-item-label">Nota</div><div className="expand-item-value" style={{ fontSize: 12 }}>{jogo.notas}</div></div>}
        </div>
      )}
    </>
  );
}

// ── AdversariosSection ────────────────────────────────────────
function AdversariosSection() {
  const [sortKey, setSortKey]   = useState<AdvSortKey>('media');
  const [sortAsc, setSortAsc]   = useState(false);
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [histSort, setHistSort] = useState<HistSortKey>('epoca');
  const [histAsc, setHistAsc]   = useState(false);

  const data     = useMemo(() => getEstatisticasAdversarios(), []);
  const maxMedia = data.length ? data[0].media : 1;

  const sorted = useMemo(() => {
    let list = [...data];
    if (search.trim()) list = list.filter(a => a.adversario.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      const va = a[sortKey]; const vb = b[sortKey];
      if (typeof va === 'string' && typeof vb === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return list;
  }, [data, sortKey, sortAsc, search]);

  function toggleSort(key: AdvSortKey) {
    if (sortKey === key) setSortAsc(a => !a); else { setSortKey(key); setSortAsc(key === 'adversario'); }
  }

  const COLS: { key: AdvSortKey; label: string; align: 'left' | 'right'; w?: number }[] = [
    { key: 'adversario', label: 'Adversário',  align: 'left' },
    { key: 'visitas',    label: 'Jogos',        align: 'right', w: 60 },
    { key: 'media',      label: 'Esp. Arcos',   align: 'right', w: 80 },
    { key: 'maximo',     label: 'Recorde',      align: 'right', w: 72 },
  ];
  const gridCols = `1fr ${COLS.slice(1).map(c => `${c.w}px`).join(' ')}`;

  return (
    <div className="section-card anim-rise delay-3">
      <div className="section-header">
        <div>
          <div className="section-title">Adversários nos Arcos</div>
          <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>
            {sorted.length}{search ? ` de ${data.length}` : ''} adversários · 2025/26
          </div>
        </div>
        <div className="search-wrap">
          <span className="search-icon"><IcoSearch/></span>
          <input className="search-field" placeholder="Pesquisar equipa..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: 170 }} autoComplete="off"/>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, padding: '7px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', gap: 8 }}>
        {COLS.map(col => <ColHeader key={col.key} label={col.label} colKey={col.key} sortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort} align={col.align}/>)}
      </div>
      {sorted.length === 0
        ? <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>Sem resultados para &ldquo;{search}&rdquo;</div>
        : sorted.map((adv, i) => {
          const barW   = maxMedia > 0 ? (adv.media / maxMedia) * 100 : 0;
          const isOpen = expanded === adv.adversario;
          const historico = isOpen ? getHistoricoAdversario(adv.adversario) : [];
          const histMax   = historico.length ? historico[0].assistencia : 1;
          const histSorted = [...historico].sort((a, b) => {
            if (histSort === 'assistencia') return histAsc ? a.assistencia - b.assistencia : b.assistencia - a.assistencia;
            return histAsc ? a.ano_inicio - b.ano_inicio : b.ano_inicio - a.ano_inicio;
          });

          return (
            <div key={adv.adversario}>
              <div onClick={() => setExpanded(isOpen ? null : adv.adversario)}
                style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 8, padding: '10px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center', cursor: 'pointer', transition: 'background .1s', background: isOpen ? 'var(--g50)' : 'transparent' }}
                onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'var(--g50)'; }}
                onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adv.adversario}</span>
                    <span style={{ color: 'var(--ink4)', display: 'flex', flexShrink: 0 }}><IcoChevron open={isOpen}/></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barW}%`, background: barColor((adv.media / 5300) * 100), borderRadius: 99 }}/>
                    </div>
                    <span style={{ fontSize: 9, color: 'var(--ink4)', whiteSpace: 'nowrap' }}>{adv.epocas} {adv.epocas === 1 ? 'época' : 'épocas'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>{adv.visitas}×</div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--g500)' }}>{adv.media > 0 ? fmt(adv.media) : '—'}</div>
                <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>{adv.maximo > 0 ? fmt(adv.maximo) : '—'}</div>
              </div>
              {isOpen && (
                <div className="anim-slide" style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)', padding: '10px 20px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                      Jogos nos Arcos · {adv.adversario}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {([['epoca','Época'],['assistencia','Esp.']] as [HistSortKey,string][]).map(([k,l]) => (
                        <button key={k} onClick={() => { if (histSort===k) setHistAsc(a=>!a); else { setHistSort(k); setHistAsc(false); } }}
                          style={{ display:'flex', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', fontSize:10, fontWeight:700, color: histSort===k ? 'var(--g500)' : 'var(--ink4)', fontFamily:'var(--font-sora)' }}>
                          {l}<IcoSortArrow active={histSort===k} asc={histAsc}/>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {histSorted.map(h => {
                      const bw = histMax > 0 ? (h.assistencia / histMax) * 100 : 0;
                      return (
                        <div key={`${h.epoca}-${h.jornada}`} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 60px', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', textAlign: 'right' }}>{h.epoca}</span>
                          <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${bw}%`, background: barColor((h.assistencia / 5300) * 100), borderRadius: 99 }}/>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(h.assistencia)}</span>
                        </div>
                      );
                    })}
                  </div>
                  {historico.length > 0 && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink4)' }}>
                      <span>Total: <strong style={{ color: 'var(--ink2)' }}>{fmt(historico.reduce((s, h) => s + h.assistencia, 0))}</strong></span>
                      <span>Média: <strong style={{ color: 'var(--g500)' }}>{fmt(adv.media)}</strong> esp.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      }
      <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--ink4)' }}>{sorted.length} adversários</span>
        <span style={{ fontSize: 11, color: 'var(--ink4)' }}>Espectadores · jogos nos Arcos · 2025/26</span>
      </div>
    </div>
  );
}

// ── HistorySection ────────────────────────────────────────────
function HistorySection() {
  const epocas   = MOCK_RESUMO_EPOCAS.filter(e => e.total_assistencia > 0);
  const maxMedia = Math.max(...epocas.map(e => e.media_assistencia));
  return (
    <div className="section-card anim-rise">
      <div className="section-header">
        <span className="section-title">Média histórica · espectadores / jogo</span>
        <span className="chip chip-gray">{epocas.length} épocas</span>
      </div>
      <div style={{ padding: '10px 0 6px' }}>
        {epocas.map(e => (
          <div key={e.epoca} className="hist-row">
            <span className="hist-epoch">{e.epoca}</span>
            <div className="hist-bar-track">
              <div className="hist-bar-fill" style={{ width: `${maxMedia > 0 ? (e.media_assistencia / maxMedia) * 100 : 0}%`, background: e.ativa ? 'linear-gradient(90deg, var(--g700), var(--g300))' : 'var(--g100)' }}/>
            </div>
            <span className="hist-value" style={{ color: e.ativa ? 'var(--g500)' : 'var(--ink3)' }}>{fmt(e.media_assistencia)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
type Tab = 'jogos' | 'adversarios' | 'historico';

export default function AssistenciasPage() {
  const [tab, setTab]           = useState<Tab>('jogos');
  const [epocaSel, setEpocaSel] = useState('25/26');
  const [sortKey, setSortKey]   = useState<SortKey>('jornada');
  const [sortAsc, setSortAsc]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch]     = useState('');

  const jogos = useMemo(() => getJogosByEpoca(epocaSel), [epocaSel]);
  const kpis  = useMemo(() => calcularKpis(jogos), [jogos]);

  const sorted = useMemo(() => {
    let list = [...jogos];
    if (search.trim()) list = list.filter(j => j.adversario.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      const va = a[sortKey] ?? 0; const vb = b[sortKey] ?? 0;
      if (typeof va === 'string' && typeof vb === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return list;
  }, [jogos, sortKey, sortAsc, search]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a); else { setSortKey(key); setSortAsc(key === 'jornada'); }
  }

  const resumoAtual    = MOCK_RESUMO_EPOCAS.find(e => e.epoca === epocaSel);
  const resumoAnterior = MOCK_RESUMO_EPOCAS.find(e => e.ano_inicio === (resumoAtual?.ano_inicio ?? 2025) - 1);
  const diffMedia      = resumoAnterior ? kpis.media - resumoAnterior.media_assistencia : null;

  const TABS = [
    { id: 'jogos' as Tab,       label: 'Por Jogo' },
    { id: 'adversarios' as Tab, label: 'Adversários' },
    { id: 'historico' as Tab,   label: 'Por Época' },
  ];

  const JOGO_COLS: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
    { key: 'jornada',     label: 'J',          align: 'left' },
    { key: 'adversario',  label: 'Adversário', align: 'left' },
    { key: 'assistencia', label: 'Esp.',       align: 'right' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface3)' }}>
      {/* Header */}
      <header className="app-header">
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--ink3)', fontSize: 12, fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
              Início
            </Link>
            <span style={{ color: 'var(--bd)' }}>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, var(--g7), var(--g3))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>RA</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Assistências nos Arcos</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--ink4)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Rio Ave FC · Estádio dos Arcos</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Hero */}
        <div className="hero-card anim-rise" style={{ padding: 24 }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span className="chip" style={{ background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.8)', border: '1px solid rgba(255,255,255,.15)', fontSize: 10 }}>Época {epocaSel}</span>
              {resumoAtual?.ativa && <span className="chip" style={{ background: 'rgba(0,200,100,.2)', color: '#5CFF9D', border: '1px solid rgba(0,200,100,.3)', fontSize: 10 }}>● Em curso</span>}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.45)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Total Acumulado · Espectadores</div>
            <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-.03em' }}>{fmt(kpis.total)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, marginTop: 20, background: 'rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden' }}>
              {[{ label: 'Média / jogo', value: fmt(kpis.media) }, { label: 'Recorde', value: fmt(kpis.maximo) }, { label: 'Ocup. média', value: kpis.total === 0 ? '—' : `${kpis.pctMedia}%` }].map(s => (
                <div key={s.label} style={{ padding: '12px 14px', background: 'rgba(0,0,0,.15)' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Variação */}
        {diffMedia !== null && resumoAnterior && (
          <div className="anim-rise delay-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-xs)' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Variação vs {resumoAnterior.epoca}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ color: diffMedia >= 0 ? 'var(--g500)' : '#E03131' }}><IcoArrow up={diffMedia >= 0}/></span>
                <span style={{ fontSize: 20, fontWeight: 800, color: diffMedia >= 0 ? 'var(--g500)' : '#E03131', letterSpacing: '-.02em' }}>{diffMedia >= 0 ? '+' : ''}{fmt(diffMedia)}</span>
                <span style={{ fontSize: 11, color: 'var(--ink4)' }}>esp. por jogo</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="anim-rise delay-2" style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '7px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sora)', transition: 'all .15s',
              background: tab === t.id ? 'var(--g500)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--ink3)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Por Jogo */}
        {tab === 'jogos' && (
          <div className="section-card anim-rise delay-3">
            <div className="section-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: '100%' }}>
                <div className="section-title" style={{ marginBottom: 8 }}>Seleciona a Época</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {EPOCAS_ORDENADAS.map(ep => (
                    <button key={ep} onClick={() => { setEpocaSel(ep); setExpanded(null); setSearch(''); setSortKey('jornada'); setSortAsc(true); }} style={{
                      padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                      border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-sora)', transition: 'all .12s', whiteSpace: 'nowrap',
                      borderColor: epocaSel === ep ? 'var(--g500)' : 'var(--border)',
                      background:  epocaSel === ep ? 'var(--g500)' : 'var(--surface)',
                      color:       epocaSel === ep ? '#fff' : 'var(--ink3)',
                    }}>{ep}</button>
                  ))}
                </div>
              </div>
              <div className="search-wrap">
                <span className="search-icon"><IcoSearch/></span>
                <input className="search-field" placeholder="Pesquisar adversário..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }}/>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 48px', gap: 8, padding: '7px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
              <ColHeader label="J"          colKey="jornada"     sortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort} align="left"/>
              <ColHeader label="Adversário" colKey="adversario"  sortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort} align="left"/>
              <ColHeader label="Esp."       colKey="assistencia" sortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort} align="right"/>
              <span/>
            </div>
            {sorted.length === 0
              ? <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>{search ? `Sem resultados para "${search}"` : 'Sem dados para esta época.'}</div>
              : sorted.map(jogo => (
                <MatchRow key={jogo.id} jogo={jogo}
                  isMax={!jogo.jogo_porta_fechada && jogo.assistencia === kpis.maximo && kpis.maximo > 0}
                  isMin={!jogo.jogo_porta_fechada && jogo.assistencia === kpis.minimo && kpis.minimo > 0 && kpis.maximo !== kpis.minimo}
                  expanded={expanded === jogo.id}
                  onToggle={() => setExpanded(p => p === jogo.id ? null : jogo.id)}
                />
              ))
            }
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', background: 'var(--surface2)' }}>
              <span style={{ fontSize: 11, color: 'var(--ink4)' }}>{sorted.length} jogos</span>
              <span style={{ fontSize: 11, color: 'var(--ink4)' }}>Total: <strong style={{ color: 'var(--ink2)' }}>{fmt(sorted.reduce((s, j) => s + (j.assistencia ?? 0), 0))}</strong></span>
            </div>
          </div>
        )}

        {tab === 'adversarios' && <AdversariosSection/>}
        {tab === 'historico'   && <HistorySection/>}

        <div style={{ textAlign: 'center', padding: '6px 0 16px', fontSize: 11, color: 'var(--ink4)' }}>
          Dados coletados por Daniel Silva · Sócio 3883
        </div>
      </main>
    </div>
  );
}
