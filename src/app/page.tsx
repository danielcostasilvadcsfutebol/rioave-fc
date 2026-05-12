'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  EPOCAS_ORDENADAS, getJogosByEpoca, MOCK_RESUMO_EPOCAS,
  calcularKpis, getEstatisticasAdversarios, getHistoricoAdversario,
} from '@/lib/mock-data';
import {
  JOGOS_2526, filtrarJogos, calcularStatsEpoca,
  STATS_J33_SPORTING, EVENTOS_J33_SPORTING,
  TITULARES_RA_J33, TITULARES_ADV_J33,
  type PartidaEquipa, type EventoJogo,
} from '@/lib/mock-jogos-equipa';
import type { JogoComRelacoes } from '@/types';

// ── Utils ─────────────────────────────────────────────────────
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

// ── Icons ─────────────────────────────────────────────────────
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

// ── Clickable column header ───────────────────────────────────
function ColHeader<K extends string>({
  label, colKey, sortKey, sortAsc, onSort, align = 'left', width,
}: {
  label: string; colKey: K; sortKey: K; sortAsc: boolean;
  onSort: (k: K) => void; align?: 'left' | 'right'; width?: number;
}) {
  const active = sortKey === colKey;
  return (
    <button
      onClick={() => onSort(colKey)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        width: width ? `${width}px` : undefined,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: active ? 'var(--g500)' : 'var(--ink4)',
        fontFamily: 'var(--font-sora)', transition: 'color 0.15s',
      }}
    >
      {label}
      <IcoSortArrow active={active} asc={sortAsc} />
    </button>
  );
}

// ── Nav Dropdown ──────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'assistencias', label: 'Assistências nos Arcos', available: true },
  { id: 'jogos-equipa', label: 'Jogos da Equipa', available: true },
];

function NavDropdown({ onSelect }: { onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'baseline', gap: 4,
        fontSize: 12, fontWeight: 600, color: 'var(--g500)',
        padding: '5px 10px', borderRadius: 6,
        background: 'var(--g50)', border: '1px solid var(--g100)',
        cursor: 'pointer', fontFamily: 'var(--font-sora)', transition: 'all 0.15s',
      }}>
        <span>Assistências</span>
        <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--g300)', letterSpacing: '0.04em' }}>nos Arcos</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ marginLeft: 2, color: 'var(--g400)' }}>
          <path d={open ? 'M2 7l3-3 3 3' : 'M2 3l3 3 3-3'}/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
          minWidth: 210, overflow: 'hidden', zIndex: 100,
        }}>
          {NAV_ITEMS.map((item, i) => (
            <div key={item.id} onClick={() => { if (item.available) { setOpen(false); onSelect(item.id); } }} style={{
              padding: '10px 14px',
              borderBottom: i < NAV_ITEMS.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: item.available ? 'pointer' : 'default',
              background: item.available ? 'transparent' : 'var(--surface2)',
              opacity: item.available ? 1 : 0.5, transition: 'background 0.1s',
            }}
              onMouseEnter={e => { if (item.available) (e.currentTarget as HTMLElement).style.background = 'var(--g50)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = item.available ? 'transparent' : 'var(--surface2)'; }}
            >
              <span style={{ fontSize: 13, fontWeight: item.available ? 600 : 400, color: item.available ? 'var(--ink)' : 'var(--ink4)' }}>{item.label}</span>
              {item.available
                ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--g500)', display: 'inline-block' }}/>
                : <span style={{ fontSize: 9, color: 'var(--ink4)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Brevemente</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Match Row (Por Jogo tab) ──────────────────────────────────
function MatchRow({ jogo, isMax, isMin, expanded, onToggle }: {
  jogo: JogoComRelacoes; isMax: boolean; isMin: boolean;
  expanded: boolean; onToggle: () => void;
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
                <div className="match-bar-track">
                  <div className="match-bar-fill" style={{ width: `${Math.min(p, 100)}%`, background: barColor(p) }}/>
                </div>
                <span className="match-pct">{p.toFixed(0)}%</span>
              </div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, minWidth: 60 }}>
          {isMax && <span className="chip chip-record">↑ Recorde</span>}
          {isMin && !jogo.jogo_porta_fechada && <span className="chip chip-gray">↓ Mín.</span>}
          {jogo.estadio_alternativo && <span className="chip" style={{ background: '#FFF3CD', color: '#856404', border: '1px solid #FFE69C', fontSize: 10 }}>Alt.</span>}
          {!isMax && !isMin && !jogo.estadio_alternativo && <span style={{ color: 'var(--ink4)' }}><IcoChevron open={expanded}/></span>}
        </div>
      </div>
      {expanded && (
        <div className="expand-panel anim-slide">
          <div><div className="expand-item-label">Capacidade</div><div className="expand-item-value">{fmt(jogo.capacidade_jogo)}</div></div>
          <div><div className="expand-item-label">Ocupação</div><div className="expand-item-value" style={{ color: 'var(--g500)' }}>{jogo.jogo_porta_fechada ? '—' : `${p.toFixed(1)}%`}</div></div>
          <div><div className="expand-item-label">Estádio</div><div className="expand-item-value">{jogo.estadio?.nome ?? 'Arcos'}</div></div>
          {jogo.notas && <div style={{ gridColumn: '1 / -1' }}><div className="expand-item-label">Nota</div><div className="expand-item-value" style={{ fontSize: 12, color: 'var(--ink3)' }}>{jogo.notas}</div></div>}
        </div>
      )}
    </>
  );
}

// ── Adversários Section ───────────────────────────────────────
type AdvSortKey = 'adversario' | 'visitas' | 'media' | 'maximo';

type HistSortKey = 'epoca' | 'assistencia';

function AdversariosSection() {
  const [sortKey, setSortKey]     = useState<AdvSortKey>('media');
  const [sortAsc, setSortAsc]     = useState(false);
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [histSort, setHistSort]   = useState<HistSortKey>('epoca');
  const [histAsc, setHistAsc]     = useState(false); // mais recente primeiro

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
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(key === 'adversario'); }
  }

  const COLS: { key: AdvSortKey; label: string; align: 'left' | 'right'; w?: number }[] = [
    { key: 'adversario', label: 'Adversário', align: 'left' },
    { key: 'visitas',    label: 'Visitas',    align: 'right', w: 60  },
    { key: 'media',      label: 'Esp. Arcos', align: 'right', w: 80  },
    { key: 'maximo',     label: 'Recorde',    align: 'right', w: 72  },
  ];
  const gridCols = `1fr ${COLS.slice(1).map(c => `${c.w}px`).join(' ')}`;

  return (
    <div className="section-card anim-rise delay-3">
      <div className="section-header">
        <div>
          <div className="section-title">Adversários nos Arcos</div>
          <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>
            {sorted.length}{search ? ` de ${data.length}` : ''} adversários · desde 2006
          </div>
        </div>
        <div className="search-wrap">
          <span className="search-icon"><IcoSearch/></span>
          <input className="search-field" placeholder="Pesquisar equipa..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: 170 }} autoComplete="off"/>
        </div>
      </div>

      {/* Clickable headers */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, padding: '7px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', gap: 8 }}>
        {COLS.map(col => (
          <ColHeader key={col.key} label={col.label} colKey={col.key} sortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort} align={col.align} width={col.w}/>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
          Sem resultados para &ldquo;{search}&rdquo;
        </div>
      ) : sorted.map((adv, i) => {
        const barW     = maxMedia > 0 ? (adv.media / maxMedia) * 100 : 0;
        const isOpen   = expanded === adv.adversario;
        const historico = isOpen ? getHistoricoAdversario(adv.adversario) : [];
        // histMax calculated inside expanded panel

        return (
          <div key={adv.adversario}>
            {/* Main row — clickable */}
            <div
              onClick={() => setExpanded(isOpen ? null : adv.adversario)}
              style={{
                display: 'grid', gridTemplateColumns: gridCols, gap: 8,
                padding: '10px 20px',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center', cursor: 'pointer', transition: 'background 0.1s',
                background: isOpen ? 'var(--g50)' : 'transparent',
              }}
              onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'var(--g50)'; }}
              onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {/* Name + mini bar + chevron */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {adv.adversario}
                  </span>
                  <span style={{ color: 'var(--ink4)', display: 'flex', flexShrink: 0 }}>
                    <IcoChevron open={isOpen}/>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${barW}%`, background: barColor((adv.media / 5300) * 100), borderRadius: 99 }}/>
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--ink4)', whiteSpace: 'nowrap' }}>
                    {adv.epocas} {adv.epocas === 1 ? 'época' : 'épocas'}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>{adv.visitas}<span style={{fontSize:10,color:'var(--ink4)'}}>×</span></div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--g500)' }}>{fmt(adv.media)}</div>
              <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>{fmt(adv.maximo)}</div>
            </div>

            {/* Expand: historical matchups */}
            {isOpen && (() => {
              const historicoSorted = [...historico].sort((a, b) => {
                if (histSort === 'assistencia') {
                  return histAsc ? a.assistencia - b.assistencia : b.assistencia - a.assistencia;
                }
                // Ordem cronológica por ano
                return histAsc
                  ? a.ano_inicio - b.ano_inicio  // ascendente (mais antigo primeiro)
                  : b.ano_inicio - a.ano_inicio; // descendente (mais recente primeiro)
              });
              const histMaxVal = Math.max(...historico.filter(h => !h.porta_fechada).map(h => h.assistencia), 1);
              return (
                <div className="anim-slide" style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)', padding: '10px 20px 12px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Histórico de confrontos · {adv.adversario}
                  </div>

                  {/* Clickable column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 68px', gap: 10, marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                    {([
                      ['epoca',       'Época',      'left'],
                      ['assistencia', 'Espectadores', 'right'],
                    ] as [HistSortKey, string, string][]).map(([key, label, align]) => (
                      <button key={key}
                        onClick={() => { if (histSort === key) setHistAsc(a => !a); else { setHistSort(key); setHistAsc(key === 'epoca' ? false : false); }}}
                        style={{
                          gridColumn: key === 'assistencia' ? '3' : key === 'epoca' ? '1' : '2',
                          display: 'flex', alignItems: 'center', gap: 3,
                          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                          color: histSort === key ? 'var(--g500)' : 'var(--ink4)',
                          fontFamily: 'var(--font-sora)',
                        }}
                      >
                        {label}
                        <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor" style={{ opacity: histSort === key ? 1 : 0.3 }}>
                          <path d={histSort === key && histAsc ? 'M4 1L1 6h6L4 1z' : 'M4 7L1 2h6L4 7z'}/>
                        </svg>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {historicoSorted.map(h => {
                      const barW2 = histMaxVal > 0 && !h.porta_fechada ? (h.assistencia / histMaxVal) * 100 : 0;
                      return (
                        <div key={`${h.epoca}-${h.jornada}`} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 68px', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', textAlign: 'right' }}>{h.epoca}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {h.porta_fechada ? (
                              <span className="chip chip-gray" style={{ fontSize: 9 }}>Porta fechada</span>
                            ) : (
                              <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${barW2}%`, background: barColor((h.assistencia / 5300) * 100), borderRadius: 99 }}/>
                              </div>
                            )}
                            {h.estadio_alternativo && !h.porta_fechada && <span style={{ fontSize: 9, color: '#856404', fontWeight: 600 }}>Alt.</span>}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: h.porta_fechada ? 'var(--ink4)' : 'var(--ink)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            {h.porta_fechada ? '0' : fmt(h.assistencia)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink4)' }}>
                    <span>{historico.length} jogos · Total: <strong style={{ color: 'var(--ink2)' }}>{fmt(historico.reduce((s, h) => s + h.assistencia, 0))}</strong></span>
                    <span>Média: <strong style={{ color: 'var(--g500)' }}>{fmt(adv.media)}</strong> esp.</span>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}

      <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--ink4)' }}>{sorted.length} adversários</span>
        <span style={{ fontSize: 11, color: 'var(--ink4)' }}>Espectadores · jogos nos Arcos · 2025/26</span>
      </div>
    </div>
  );
}

// ── Histórico Section ─────────────────────────────────────────
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
      <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 16 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink4)' }}>
          <span style={{ width: 16, height: 5, borderRadius: 99, background: 'linear-gradient(90deg, var(--g700), var(--g300))', display: 'inline-block' }}/>Época atual
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink4)' }}>
          <span style={{ width: 16, height: 5, borderRadius: 99, background: 'var(--g100)', display: 'inline-block' }}/>Épocas anteriores
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
type Tab      = 'jogos' | 'adversarios' | 'historico';
type SortKey  = 'jornada' | 'adversario' | 'assistencia' | 'pct_ocupacao';


// ── Jogos da Equipa Section ───────────────────────────────────
const COMP_OPTS = [
  { value: 'todas',    label: 'Todas as competições' },
  { value: 'liga',     label: 'Liga Portugal Betclic' },
  { value: 'taca-pt',  label: 'Taça de Portugal' },
  { value: 'taca-liga',label: 'Taça da Liga' },
  { value: 'europa',   label: 'Liga Conferência UEFA' },
  { value: 'amigavel', label: 'Amigáveis' },
];

const LOCAL_OPTS = [
  { value: 'todos', label: 'Todos os jogos' },
  { value: 'casa',  label: 'Em casa' },
  { value: 'fora',  label: 'Fora' },
];

const COMP_COLORS: Record<string, { bg: string; color: string }> = {
  'liga':     { bg: '#EBF4FF', color: '#1A5FA8' },
  'taca-pt':  { bg: '#FFF4E5', color: '#A05C00' },
  'taca-liga':{ bg: '#F3EFFF', color: '#5B34C0' },
  'europa':   { bg: '#E5F5FF', color: '#0B6B9E' },
  'amigavel': { bg: '#F5F5F5', color: '#7B8089' },
};

function PartidaRow({ partida, expanded, detalhe, onToggle, onDetalhe }: {
  partida: PartidaEquipa;
  expanded: boolean;
  detalhe: 'eventos'|'stats'|'formacao';
  onToggle: () => void;
  onDetalhe: (d: 'eventos'|'stats'|'formacao') => void;
}) {
  const isHome = partida.local === 'casa';
  const resMap = { V:{ label:'Vitória' }, E:{ label:'Empate' }, D:{ label:'Derrota' } };
  const res    = resMap[partida.resultado];
  const compClr= (COMP_COLORS as Record<string,{bg:string;color:string}>)[partida.competicao] ?? COMP_COLORS['amigavel'];

  const scoreL = isHome ? partida.golos_ra  : partida.golos_adv;
  const scoreR = isHome ? partida.golos_adv : partida.golos_ra;
  const teamL  = isHome ? 'Rio Ave FC'       : partida.adversario;
  const teamR  = isHome ? partida.adversario : 'Rio Ave FC';

  const fmtDate = (d: string) => new Date(d+'T00:00:00').toLocaleDateString('pt-PT',{ weekday:'short', day:'2-digit', month:'short', year:'numeric' });

  const badgeBg = partida.resultado==='V' ? '#006B3C' : partida.resultado==='E' ? '#6B7280' : '#DC2626';

  // Real data for J33 Sporting
  const hasReal = partida.hasDetail;
  const eventos = hasReal ? EVENTOS_J33_SPORTING : null;
  const statsJogo = hasReal ? STATS_J33_SPORTING : null;
  const titRA  = hasReal ? TITULARES_RA_J33  : null;
  const titAdv = hasReal ? TITULARES_ADV_J33 : null;

  function EventRow({ ev }: { ev: EventoJogo }) {
    const isRA = ev.equipa === 'ra';
    const icon = ev.tipo === 'golo' ? '⚽' : ev.tipo === 'golo_penalidade' ? '⚽' : ev.tipo === 'auto_golo' ? '⚽' : ev.tipo === 'cartao_amarelo' ? '🟨' : ev.tipo === 'cartao_vermelho' ? '🟥' : '↕';
    const scoreBadge = ev.score_ra != null
      ? <span style={{ fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:4, background:'#F5F5F5', marginLeft:4 }}>{ev.score_ra}-{ev.score_adv}</span>
      : null;
    const min = ev.minuto_extra ? `${ev.minuto}+${ev.minuto_extra}'` : `${ev.minuto}'`;

    return (
      <div style={{ display:'grid', gridTemplateColumns:'44px 1fr 44px', alignItems:'center', minHeight:26, padding:'2px 0' }}>
        {isRA ? (
          <>
            <div style={{ textAlign:'right', fontSize:11, fontWeight:700, color:'var(--ink4)' }}>{min}</div>
            <div style={{ padding:'0 8px', display:'flex', alignItems:'center', gap:4 }}>
              <span>{icon}</span>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{ev.jogador}</span>
              {ev.jogador2 && ev.tipo==='substituicao' && <span style={{ fontSize:10, color:'var(--ink3)' }}>← {ev.jogador2}</span>}
              {ev.jogador2 && ev.tipo!=='substituicao' && <span style={{ fontSize:10, color:'var(--ink3)' }}>({ev.jogador2})</span>}
              {ev.descricao && <span style={{ fontSize:10, color:'var(--ink3)' }}>{ev.descricao}</span>}
              {scoreBadge}
            </div>
            <div/>
          </>
        ) : (
          <>
            <div/>
            <div style={{ padding:'0 8px', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4 }}>
              {scoreBadge}
              {ev.descricao && <span style={{ fontSize:10, color:'var(--ink3)' }}>{ev.descricao}</span>}
              {ev.jogador2 && ev.tipo!=='substituicao' && <span style={{ fontSize:10, color:'var(--ink3)' }}>({ev.jogador2})</span>}
              {ev.jogador2 && ev.tipo==='substituicao' && <span style={{ fontSize:10, color:'var(--ink3)' }}>{ev.jogador2} →</span>}
              <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{ev.jogador}</span>
              <span>{icon}</span>
            </div>
            <div style={{ textAlign:'left', fontSize:11, fontWeight:700, color:'var(--ink4)' }}>{min}</div>
          </>
        )}
      </div>
    );
  }

  const STATS_LABELS = [
    ['posse_bola','% Posse de bola'],['remates','Remates'],['remates_baliza','Remates à baliza'],
    ['remates_poste','Remates ao poste'],['grandes_oportunidades','Grandes oportunidades'],
    ['assistencias','Assistências'],['cruzamentos','Cruzamentos'],['cantos','Cantos'],
    ['livres','Livres'],['ataques','Ataques'],['ataques_centro','Ataques pelo centro'],
    ['ataques_esquerda','Ataques pela esquerda'],['ataques_direita','Ataques pela direita'],
    ['defesas','Defesas'],['penaltis','Penáltis'],['penaltis_defendidos','Penáltis defendidos'],
    ['foras_jogo','Foras de jogo'],['faltas','Faltas'],['amarelos','Amarelos'],['vermelhos','Vermelhos'],
  ] as [keyof typeof STATS_J33_SPORTING, string][];

  return (
    <>
      <div style={{ padding:'6px 14px 0', display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ padding:'2px 6px', borderRadius:99, fontSize:9, fontWeight:700, background:compClr.bg, color:compClr.color }}>
          {partida.competicao_label} · {partida.jornada}
        </span>
        <span style={{ fontSize:10, color:'var(--ink4)' }}>{fmtDate(partida.data)} · {partida.hora}</span>
      </div>

      <div onClick={onToggle} style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:8, padding:'8px 14px 6px', cursor:'pointer', transition:'background .12s', background: expanded ? 'var(--g0)' : 'transparent' }}
        onMouseEnter={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background='var(--g0)'; }}
        onMouseLeave={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background='transparent'; }}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          <span style={{ fontSize:13, fontWeight:700, color: isHome ? 'var(--g5)' : 'var(--ink)' }}>{teamL}</span>
          <span style={{ fontSize:9, fontWeight:600, padding:'1px 5px', borderRadius:3, textTransform:'uppercase', alignSelf:'flex-start', background:'var(--g1)', color:'var(--g7)' }}>Casa</span>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--ink)', letterSpacing:-1 }}>{scoreL} – {scoreR}</div>
          <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, display:'inline-block', marginTop:2, background:badgeBg, color:'#fff' }}>{res.label}</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:2, alignItems:'flex-end' }}>
          <span style={{ fontSize:13, fontWeight:700, color: !isHome ? 'var(--g5)' : 'var(--ink)' }}>{teamR}</span>
          <span style={{ fontSize:9, fontWeight:600, padding:'1px 5px', borderRadius:3, textTransform:'uppercase', background:'#F1F3F5', color:'var(--ink4)' }}>Fora</span>
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', padding:'2px 14px 8px', fontSize:10, color:'var(--ink4)', borderBottom:'0.5px solid var(--bd)' }}>
        <span>{isHome ? (partida.formacao_ra ? `${partida.formacao_ra} · ` : '') + 'Estádio dos Arcos' : (partida.estadio ?? 'Estádio do adversário')}</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {partida.espectadores && <span style={{ fontWeight:600 }}>{partida.espectadores.toLocaleString('pt-PT')} esp.</span>}
          <span style={{ color:'var(--ink3)' }}><IcoChevron open={expanded}/></span>
        </div>
      </div>

      {expanded && (
        <div style={{ background:'var(--surface2)', borderBottom:'0.5px solid var(--bd)' }}>
          {/* Detail tabs */}
          <div style={{ display:'flex', borderBottom:'0.5px solid var(--bd)', background:'var(--surface)' }}>
            {(['eventos','stats','formacao'] as const).map(d => (
              <button key={d} onClick={() => onDetalhe(d)} style={{
                flex:1, padding:'7px', fontSize:11, fontWeight:600, textAlign:'center',
                border:'none', cursor:'pointer', fontFamily:'var(--font-sora)',
                background:'transparent', color: detalhe===d ? 'var(--g5)' : 'var(--ink3)',
                borderBottom: detalhe===d ? '2px solid var(--g5)' : '2px solid transparent',
              }}>
                {d==='eventos'?'Eventos':d==='stats'?'Estatísticas':'Formações'}
              </button>
            ))}
          </div>

          {/* Eventos */}
          {detalhe === 'eventos' && (
            <div style={{ padding:'8px 14px' }}>
              {/* Column labels */}
              <div style={{ display:'grid', gridTemplateColumns:'44px 1fr 44px', padding:'4px 0 6px', borderBottom:'0.5px solid var(--bd)', marginBottom:4 }}>
                <span style={{ textAlign:'right', fontSize:9, fontWeight:700, color:'var(--g5)', textTransform:'uppercase', letterSpacing:'.06em' }}>RA</span>
                <span/>
                <span style={{ fontSize:9, fontWeight:700, color:isHome ? 'var(--ink3)' : 'var(--g5)', textTransform:'uppercase', letterSpacing:'.06em' }}>{partida.adversario.split(' ')[0]}</span>
              </div>
              {hasReal && eventos ? (
                eventos.map((ev, i) => <EventRow key={i} ev={ev}/>)
              ) : (
                <div style={{ padding:'16px 0', textAlign:'center', fontSize:12, color:'var(--ink4)' }}>
                  Eventos serão adicionados progressivamente.
                </div>
              )}
            </div>
          )}

          {/* Estatísticas */}
          {detalhe === 'stats' && (
            <div style={{ padding:'10px 14px' }}>
              {hasReal && statsJogo ? (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 40px', gap:8, paddingBottom:7, borderBottom:'0.5px solid var(--bd)', marginBottom:7 }}>
                    <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', color:'var(--g5)' }}>RA</span>
                    <span/>
                    <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', color:'#DC2626', textAlign:'right' }}>{partida.adversario.split(' ')[0]}</span>
                  </div>
                  {STATS_LABELS.map(([key, label]) => {
                    const [vl, vr] = statsJogo[key];
                    const tot = Math.max(vl+vr, 1);
                    const pl  = Math.round(vl/tot*100);
                    return (
                      <div key={key} style={{ display:'grid', gridTemplateColumns:'40px 1fr 40px', gap:8, alignItems:'center', marginBottom:5 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'var(--ink)' }}>{key==='posse_bola'?`${vl}%`:vl}</div>
                        <div>
                          <div style={{ fontSize:10, color:'var(--ink3)', textAlign:'center', marginBottom:3 }}>{label}</div>
                          <div style={{ height:4, background:'var(--bd)', borderRadius:99, overflow:'hidden', display:'flex' }}>
                            <div style={{ background:'var(--g5)', height:'100%', width:`${pl}%` }}/>
                            <div style={{ background:'#DC2626', height:'100%', width:`${100-pl}%`, marginLeft:'auto' }}/>
                          </div>
                        </div>
                        <div style={{ fontSize:12, fontWeight:700, color:'var(--ink)', textAlign:'right' }}>{key==='posse_bola'?`${vr}%`:vr}</div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div style={{ padding:'16px 0', textAlign:'center', fontSize:12, color:'var(--ink4)' }}>Estatísticas serão adicionadas progressivamente.</div>
              )}
            </div>
          )}

          {/* Formações */}
          {detalhe === 'formacao' && (
            <div style={{ padding:'10px 14px' }}>
              {hasReal && titRA && titAdv ? (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[{ title:`Rio Ave FC · ${partida.formacao_ra}`, tits:titRA, color:'var(--g5)' }, { title:`${partida.adversario} · ${partida.formacao_adv}`, tits:titAdv, color:'#1A5FA8' }].map(({ title, tits, color }) => (
                    <div key={title} style={{ background:'var(--bg)', borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:11, fontWeight:700, color, marginBottom:6 }}>{title}</div>
                      {tits.map(p => (
                        <div key={p.numero} style={{ display:'flex', alignItems:'center', gap:5, padding:'2px 0', borderBottom:'0.5px solid var(--bd)', fontSize:11 }}>
                          <span style={{ fontSize:10, fontWeight:700, color:'var(--ink4)', minWidth:16 }}>{p.numero}</span>
                          <span style={{ color:'var(--ink)', flex:1 }}>{p.nome}{p.capitao?' (C)':''}</span>
                          <span style={{ fontSize:9, color:'var(--ink4)' }}>{p.posicao}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding:'16px 0', textAlign:'center', fontSize:12, color:'var(--ink4)' }}>Formações serão adicionadas progressivamente.</div>
              )}
              {partida.arbitro && <div style={{ marginTop:8, fontSize:11, color:'var(--ink4)', textAlign:'center' }}>Árbitro: {partida.arbitro}</div>}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function JogosEquipaSection() {
  const [comp, setComp]         = useState<string>('todas');
  const [local, setLocal]       = useState<string>('todos');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detalhe, setDetalhe]   = useState<'eventos'|'stats'|'formacao'>('eventos');

  const jogos    = JOGOS_2526;
  const filtered = useMemo(() => filtrarJogos(jogos, comp, local), [jogos, comp, local]);
  const stats    = useMemo(() => calcularStatsEpoca(jogos), [jogos]);

  const grouped = useMemo(() => {
    if (comp !== 'todas') return null;
    const map = new Map<string, { label: string; jogos: PartidaEquipa[] }>();
    for (const j of filtered) {
      if (!map.has(j.competicao)) map.set(j.competicao, { label: j.competicao_label, jogos: [] });
      map.get(j.competicao)!.jogos.push(j);
    }
    return map;
  }, [filtered, comp]);

  const COMP_OPTS = [
    { value:'todas',    label:'Todas' },
    { value:'liga',     label:'Liga' },
    { value:'taca-pt',  label:'Taça Portugal' },
    { value:'taca-liga',label:'Taça Liga' },
    { value:'europa',   label:'Europa' },
    { value:'amigavel', label:'Amigáveis' },
  ];
  const LOCAL_OPTS = [
    { value:'todos', label:'Todos' },
    { value:'casa',  label:'Casa' },
    { value:'fora',  label:'Fora' },
  ];

  const filterPill = (active: boolean) => ({
    padding: '5px 12px' as const, borderRadius: 99, fontSize: 11, fontWeight: 600,
    border: '0.5px solid' as const, cursor: 'pointer' as const, fontFamily: 'var(--font-sora)',
    borderColor: active ? 'var(--g5)' : 'var(--bd)',
    background:  active ? 'var(--g5)' : 'var(--surface2)',
    color:       active ? '#fff' : 'var(--ink3)',
    transition: 'all .12s',
  });

  function MatchGroup({ label, jogos: gJogos }: { label: string; jogos: PartidaEquipa[] }) {
    const gv = gJogos.filter(j => j.resultado === 'V').length;
    const ge = gJogos.filter(j => j.resultado === 'E').length;
    const gd = gJogos.filter(j => j.resultado === 'D').length;
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', background:'var(--surface2)', borderRadius:'10px 10px 0 0', border:'0.5px solid var(--bd)', borderBottom:'none' }}>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--ink2)' }}>{label}</span>
          <div style={{ display:'flex', gap:5 }}>
            {[[gv,'V','#006B3C'],[ge,'E','#6B7280'],[gd,'D','#DC2626']].map(([n,l,c]) =>
              (n as number) > 0 && <span key={l as string} style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:99, background:c as string, color:'#fff' }}>{n}{l}</span>
            )}
          </div>
        </div>
        <div style={{ background:'var(--surface)', border:'0.5px solid var(--bd)', borderRadius:'0 0 10px 10px', overflow:'hidden' }}>
          {gJogos.map(p => (
            <PartidaRow key={p.id} partida={p}
              expanded={expanded===p.id} detalhe={detalhe}
              onToggle={() => setExpanded(x => x===p.id ? null : p.id)}
              onDetalhe={setDetalhe}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

      {/* Season banner */}
      <div className="hero-card anim-rise" style={{ padding:20 }}>
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,.4)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:6 }}>
            Época 2025/26 · Todos os jogos
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:4 }}>
            {[
              { l:'Jogos',    v:stats.total,   s:`${stats.v}V·${stats.e}E·${stats.d}D` },
              { l:'Vitórias', v:stats.v,       s:`${Math.round(stats.v/stats.total*100)}%` },
              { l:'Golos',    v:stats.gm,      s:'marcados' },
              { l:'Sofridos', v:stats.gs,      s:'golos' },
              { l:'Pts Liga', v:stats.ligaPts, s:'pontos' },
            ].map(s => (
              <div key={s.l} style={{ background:'rgba(0,0,0,.2)', borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
                <div style={{ fontSize:8, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:2 }}>{s.l}</div>
                <div style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-.5px', lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,.35)' }}>{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background:'var(--surface)', border:'0.5px solid var(--bd)', borderRadius:12, padding:'12px 14px', display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--ink4)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>Competição</div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {COMP_OPTS.map(o => <button key={o.value} onClick={() => setComp(o.value)} style={filterPill(comp===o.value)}>{o.label}</button>)}
          </div>
        </div>
        <div style={{ width:'0.5px', background:'var(--bd)', alignSelf:'stretch', margin:'0 2px' }}/>
        <div>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--ink4)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>Local</div>
          <div style={{ display:'flex', gap:5 }}>
            {LOCAL_OPTS.map(o => <button key={o.value} onClick={() => setLocal(o.value)} style={filterPill(local===o.value)}>{o.label}</button>)}
          </div>
        </div>
        <div style={{ marginLeft:'auto', alignSelf:'flex-end', fontSize:11, color:'var(--ink4)' }}>
          {filtered.length} jogo{filtered.length!==1?'s':''}
        </div>
      </div>

      {/* Match list */}
      {filtered.length === 0 ? (
        <div style={{ background:'var(--surface)', border:'0.5px solid var(--bd)', borderRadius:12, padding:'40px 20px', textAlign:'center', color:'var(--ink4)', fontSize:13 }}>
          Nenhum jogo encontrado.
        </div>
      ) : grouped ? (
        Array.from(grouped.entries()).map(([compKey, { label, jogos: gJogos }]) => (
          <MatchGroup key={compKey} label={label} jogos={gJogos} />
        ))
      ) : (
        <div style={{ background:'var(--surface)', border:'0.5px solid var(--bd)', borderRadius:12, overflow:'hidden' }}>
          {filtered.map(p => (
            <PartidaRow key={p.id} partida={p}
              expanded={expanded===p.id} detalhe={detalhe}
              onToggle={() => setExpanded(x => x===p.id ? null : p.id)}
              onDetalhe={setDetalhe}
            />
          ))}
        </div>
      )}

      <div style={{ textAlign:'center', padding:'4px 0 12px', fontSize:11, color:'var(--ink4)' }}>
        Dados coletados por Daniel Silva · Sócio 3883
      </div>
    </div>
  );
}


export default function HomePage() {
  const [activeSection, setActiveSection] = useState<'assistencias' | 'jogos-equipa'>('assistencias');
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
  function handleEpoca(e: string) { setEpocaSel(e); setExpanded(null); setSearch(''); setSortKey('jornada'); setSortAsc(true); }

  const resumoAtual    = MOCK_RESUMO_EPOCAS.find(e => e.epoca === epocaSel);
  const resumoAnterior = MOCK_RESUMO_EPOCAS.find(e => e.ano_inicio === (resumoAtual?.ano_inicio ?? 2025) - 1);
  const diffMedia      = resumoAnterior ? kpis.media - resumoAnterior.media_assistencia : null;

  const TABS = [
    { id: 'jogos' as Tab,       label: 'Por Jogo' },
    { id: 'adversarios' as Tab, label: 'Adversários' },
    { id: 'historico' as Tab,   label: 'Por Época' },
  ];

  // Por Jogo column definitions
  const JOGO_COLS: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
    { key: 'jornada',    label: 'J',          align: 'left'  },
    { key: 'adversario', label: 'Adversário', align: 'left'  },
    { key: 'assistencia', label: 'Esp.',      align: 'right' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface3)' }}>

      {/* Header */}
      <header className="app-header">
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--g700), var(--g300))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,107,60,0.3)' }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>RA</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>Rio Ave FC</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--ink4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Estatísticas</div>
            </div>
          </div>
          <NavDropdown onSelect={(id) => setActiveSection(id as 'assistencias' | 'jogos-equipa')}/>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activeSection === 'jogos-equipa' && <JogosEquipaSection />}
        {activeSection === 'assistencias' && <>

        {/* Hero */}
        <div className="hero-card anim-rise" style={{ padding: 24 }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span className="chip" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)', fontSize: 10 }}>Época {epocaSel}</span>
              {resumoAtual?.ativa && <span className="chip" style={{ background: 'rgba(0,200,100,0.2)', color: '#5CFF9D', border: '1px solid rgba(0,200,100,0.3)', fontSize: 10 }}>● Em curso</span>}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              Total Acumulado · Número de Espectadores
            </div>
            <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>{fmt(kpis.total)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, marginTop: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
              {[{ label: 'Média / jogo', value: fmt(kpis.media) }, { label: 'Recorde', value: fmt(kpis.maximo) }, { label: 'Ocup. média', value: kpis.total === 0 ? '—' : `${kpis.pctMedia}%` }].map(s => (
                <div key={s.label} style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Variação */}
        {diffMedia !== null && resumoAnterior && (
          <div className="anim-rise delay-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-xs)' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Variação vs {resumoAnterior.epoca}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ color: diffMedia >= 0 ? 'var(--g500)' : '#E03131' }}><IcoArrow up={diffMedia >= 0}/></span>
                <span style={{ fontSize: 20, fontWeight: 800, color: diffMedia >= 0 ? 'var(--g500)' : '#E03131', letterSpacing: '-0.02em' }}>{diffMedia >= 0 ? '+' : ''}{fmt(diffMedia)}</span>
                <span style={{ fontSize: 11, color: 'var(--ink4)' }}>Espectadores por jogo</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{resumoAnterior.epoca} · <strong style={{ color: 'var(--ink2)' }}>{fmt(resumoAnterior.media_assistencia)}</strong></div>
              <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{epocaSel} · <strong style={{ color: 'var(--g500)' }}>{fmt(kpis.media)}</strong></div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="anim-rise delay-2" style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '7px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sora)', transition: 'all 0.15s',
              background: tab === t.id ? 'var(--g500)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--ink3)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* TAB: Por Jogo */}
        {tab === 'jogos' && (
          <div className="section-card anim-rise delay-3">
            {/* Epoch selector */}
            <div className="section-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: '100%' }}>
                <div className="section-title" style={{ marginBottom: 8 }}>Seleciona a Época</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {EPOCAS_ORDENADAS.map(ep => (
                    <button key={ep} onClick={() => handleEpoca(ep)} style={{
                      padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                      border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-sora)',
                      transition: 'all 0.12s', whiteSpace: 'nowrap',
                      borderColor: epocaSel === ep ? 'var(--g500)' : 'var(--border)',
                      background: epocaSel === ep ? 'var(--g500)' : 'var(--surface)',
                      color: epocaSel === ep ? '#fff' : 'var(--ink3)',
                    }}>{ep}</button>
                  ))}
                </div>
              </div>
              {/* Search */}
              <div className="search-wrap">
                <span className="search-icon"><IcoSearch/></span>
                <input className="search-field" placeholder="Pesquisar adversário..." value={search}
                  onChange={e => setSearch(e.target.value)} style={{ width: 200 }}/>
              </div>
            </div>

            {/* Clickable column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 48px', gap: 8, padding: '7px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
              <ColHeader label="J"          colKey="jornada"    sortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort} align="left"/>
              <ColHeader label="Adversário" colKey="adversario" sortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort} align="left"/>
              <ColHeader label="Esp."       colKey="assistencia" sortKey={sortKey} sortAsc={sortAsc} onSort={toggleSort} align="right"/>
              <span/>
            </div>

            {sorted.length === 0
              ? <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
                  {search ? `Sem resultados para "${search}"` : 'Sem dados para esta época.'}
                </div>
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
        </>}
      </main>
    </div>
  );
}
