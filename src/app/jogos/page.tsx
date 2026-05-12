'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  JOGOS_2526, filtrarJogos, calcularStatsEpoca,
  STATS_J33_SPORTING, EVENTOS_J33_SPORTING,
  TITULARES_RA_J33, TITULARES_ADV_J33,
  type PartidaEquipa, type EventoJogo,
} from '@/lib/mock-jogos-equipa';

// ── Utilities ─────────────────────────────────────────────────
function IcoChevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d={open ? 'M3 9l4-4 4 4' : 'M3 5l4 4 4-4'}/>
    </svg>
  );
}

const COMP_COLORS: Record<string, { bg: string; color: string }> = {
  'liga':     { bg: '#EBF4FF', color: '#1A5FA8' },
  'taca-pt':  { bg: '#FFF4E5', color: '#A05C00' },
  'taca-liga':{ bg: '#F3EFFF', color: '#5B34C0' },
  'europa':   { bg: '#E5F5FF', color: '#0B6B9E' },
  'amigavel': { bg: '#F5F5F5', color: '#7B8089' },
};

// ── PartidaRow ────────────────────────────────────────────────
function PartidaRow({ partida, expanded, detalhe, onToggle, onDetalhe }: {
  partida: PartidaEquipa;
  expanded: boolean;
  detalhe: 'eventos' | 'stats' | 'formacao';
  onToggle: () => void;
  onDetalhe: (d: 'eventos' | 'stats' | 'formacao') => void;
}) {
  const isHome = partida.local === 'casa';
  const resMap = { V: { label: 'Vitória' }, E: { label: 'Empate' }, D: { label: 'Derrota' } };
  const res    = resMap[partida.resultado];
  const compClr = COMP_COLORS[partida.competicao] ?? COMP_COLORS['amigavel'];

  const scoreL = isHome ? partida.golos_ra  : partida.golos_adv;
  const scoreR = isHome ? partida.golos_adv : partida.golos_ra;
  const teamL  = isHome ? 'Rio Ave FC'       : partida.adversario;
  const teamR  = isHome ? partida.adversario : 'Rio Ave FC';

  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const badgeBg = partida.resultado === 'V' ? '#006B3C' : partida.resultado === 'E' ? '#6B7280' : '#DC2626';

  const hasReal   = partida.hasDetail;
  const eventos   = hasReal ? EVENTOS_J33_SPORTING : null;
  const statsJogo = hasReal ? STATS_J33_SPORTING   : null;
  const titRA     = hasReal ? TITULARES_RA_J33     : null;
  const titAdv    = hasReal ? TITULARES_ADV_J33    : null;

  function EventRow({ ev }: { ev: EventoJogo }) {
    const isRA  = ev.equipa === 'ra';
    const icon  = ['golo','golo_penalidade','auto_golo'].includes(ev.tipo) ? '⚽' : ev.tipo === 'cartao_amarelo' ? '🟨' : ev.tipo === 'cartao_vermelho' ? '🟥' : '↕';
    const score = ev.score_ra != null
      ? <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#F5F5F5', marginLeft: 4 }}>{ev.score_ra}-{ev.score_adv}</span>
      : null;
    const min = ev.minuto_extra ? `${ev.minuto}+${ev.minuto_extra}'` : `${ev.minuto}'`;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 44px', alignItems: 'center', minHeight: 26, padding: '2px 0' }}>
        {isRA ? (
          <>
            <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--ink4)' }}>{min}</div>
            <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{ev.jogador}</span>
              {ev.jogador2 && ev.tipo === 'substituicao' && <span style={{ fontSize: 10, color: 'var(--ink3)' }}>← {ev.jogador2}</span>}
              {ev.jogador2 && ev.tipo !== 'substituicao' && <span style={{ fontSize: 10, color: 'var(--ink3)' }}>({ev.jogador2})</span>}
              {ev.descricao && <span style={{ fontSize: 10, color: 'var(--ink3)' }}>{ev.descricao}</span>}
              {score}
            </div>
            <div/>
          </>
        ) : (
          <>
            <div/>
            <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              {score}
              {ev.descricao && <span style={{ fontSize: 10, color: 'var(--ink3)' }}>{ev.descricao}</span>}
              {ev.jogador2 && ev.tipo !== 'substituicao' && <span style={{ fontSize: 10, color: 'var(--ink3)' }}>({ev.jogador2})</span>}
              {ev.jogador2 && ev.tipo === 'substituicao' && <span style={{ fontSize: 10, color: 'var(--ink3)' }}>{ev.jogador2} →</span>}
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{ev.jogador}</span>
              <span>{icon}</span>
            </div>
            <div style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ink4)' }}>{min}</div>
          </>
        )}
      </div>
    );
  }

  const STATS_LABELS: [keyof typeof STATS_J33_SPORTING, string][] = [
    ['posse_bola','% Posse de bola'],['remates','Remates'],['remates_baliza','Remates à baliza'],
    ['remates_poste','Remates ao poste'],['grandes_oportunidades','Grandes oportunidades'],
    ['assistencias','Assistências'],['cruzamentos','Cruzamentos'],['cantos','Cantos'],
    ['livres','Livres'],['ataques','Ataques'],['ataques_centro','Ataques pelo centro'],
    ['ataques_esquerda','Ataques pela esquerda'],['ataques_direita','Ataques pela direita'],
    ['defesas','Defesas'],['penaltis','Penáltis'],['penaltis_defendidos','Penáltis defendidos'],
    ['foras_jogo','Foras de jogo'],['faltas','Faltas'],['amarelos','Amarelos'],['vermelhos','Vermelhos'],
  ];

  return (
    <>
      <div style={{ padding: '6px 14px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ padding: '2px 6px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: compClr.bg, color: compClr.color }}>
          {partida.competicao_label} · {partida.jornada}
        </span>
        <span style={{ fontSize: 10, color: 'var(--ink4)' }}>{fmtDate(partida.data)} · {partida.hora}</span>
      </div>

      <div onClick={onToggle}
        style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, padding: '8px 14px 6px', cursor: 'pointer', transition: 'background .12s', background: expanded ? 'var(--g0)' : 'transparent' }}
        onMouseEnter={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background = 'var(--g0)'; }}
        onMouseLeave={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: isHome ? 'var(--g5)' : 'var(--ink)' }}>{teamL}</span>
          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase', alignSelf: 'flex-start', background: 'var(--g1)', color: 'var(--g7)' }}>Casa</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', letterSpacing: -1 }}>{scoreL} – {scoreR}</div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, display: 'inline-block', marginTop: 2, background: badgeBg, color: '#fff' }}>{res.label}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: !isHome ? 'var(--g5)' : 'var(--ink)' }}>{teamR}</span>
          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase', background: '#F1F3F5', color: 'var(--ink4)' }}>Fora</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 14px 8px', fontSize: 10, color: 'var(--ink4)', borderBottom: '0.5px solid var(--bd)' }}>
        <span>{isHome ? 'Estádio dos Arcos' : (partida.estadio ?? 'Estádio do adversário')}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {partida.espectadores && <span style={{ fontWeight: 600 }}>{partida.espectadores.toLocaleString('pt-PT')} esp.</span>}
          <span style={{ color: 'var(--ink3)' }}><IcoChevron open={expanded}/></span>
        </div>
      </div>

      {expanded && (
        <div style={{ background: 'var(--surface2)', borderBottom: '0.5px solid var(--bd)' }}>
          <div style={{ display: 'flex', borderBottom: '0.5px solid var(--bd)', background: 'var(--surface)' }}>
            {(['eventos', 'stats', 'formacao'] as const).map(d => (
              <button key={d} onClick={() => onDetalhe(d)} style={{
                flex: 1, padding: '7px', fontSize: 11, fontWeight: 600, textAlign: 'center',
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sora)', background: 'transparent',
                color: detalhe === d ? 'var(--g5)' : 'var(--ink3)',
                borderBottom: detalhe === d ? '2px solid var(--g5)' : '2px solid transparent',
              }}>
                {d === 'eventos' ? 'Eventos' : d === 'stats' ? 'Estatísticas' : 'Formações'}
              </button>
            ))}
          </div>

          {detalhe === 'eventos' && (
            <div style={{ padding: '8px 14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 44px', padding: '4px 0 6px', borderBottom: '0.5px solid var(--bd)', marginBottom: 4 }}>
                <span style={{ textAlign: 'right', fontSize: 9, fontWeight: 700, color: 'var(--g5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>RA</span>
                <span/>
                <span style={{ fontSize: 9, fontWeight: 700, color: isHome ? 'var(--ink3)' : 'var(--g5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{partida.adversario.split(' ')[0]}</span>
              </div>
              {hasReal && eventos
                ? eventos.map((ev, i) => <EventRow key={i} ev={ev}/>)
                : <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: 'var(--ink4)' }}>Eventos serão adicionados progressivamente.</div>
              }
            </div>
          )}

          {detalhe === 'stats' && (
            <div style={{ padding: '10px 14px' }}>
              {hasReal && statsJogo ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px', gap: 8, paddingBottom: 7, borderBottom: '0.5px solid var(--bd)', marginBottom: 7 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--g5)' }}>RA</span>
                    <span/>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#DC2626', textAlign: 'right' }}>{partida.adversario.split(' ')[0]}</span>
                  </div>
                  {STATS_LABELS.map(([key, label]) => {
                    const [vl, vr] = statsJogo[key];
                    const tot = Math.max(vl + vr, 1);
                    const pl  = Math.round(vl / tot * 100);
                    return (
                      <div key={key} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{key === 'posse_bola' ? `${vl}%` : vl}</div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--ink3)', textAlign: 'center', marginBottom: 3 }}>{label}</div>
                          <div style={{ height: 4, background: 'var(--bd)', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                            <div style={{ background: 'var(--g5)', height: '100%', width: `${pl}%` }}/>
                            <div style={{ background: '#DC2626', height: '100%', width: `${100 - pl}%`, marginLeft: 'auto' }}/>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', textAlign: 'right' }}>{key === 'posse_bola' ? `${vr}%` : vr}</div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: 'var(--ink4)' }}>Estatísticas serão adicionadas progressivamente.</div>
              )}
            </div>
          )}

          {detalhe === 'formacao' && (
            <div style={{ padding: '10px 14px' }}>
              {hasReal && titRA && titAdv ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[{ title: `Rio Ave FC · ${partida.formacao_ra}`, tits: titRA, color: 'var(--g5)' }, { title: `${partida.adversario} · ${partida.formacao_adv}`, tits: titAdv, color: '#1A5FA8' }].map(({ title, tits, color }) => (
                    <div key={title} style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 6 }}>{title}</div>
                      {tits.map(p => (
                        <div key={p.numero} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0', borderBottom: '0.5px solid var(--bd)', fontSize: 11 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink4)', minWidth: 16 }}>{p.numero}</span>
                          <span style={{ color: 'var(--ink)', flex: 1 }}>{p.nome}{p.capitao ? ' (C)' : ''}</span>
                          <span style={{ fontSize: 9, color: 'var(--ink4)' }}>{p.posicao}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: 'var(--ink4)' }}>Formações serão adicionadas progressivamente.</div>
              )}
              {partida.arbitro && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink4)', textAlign: 'center' }}>Árbitro: {partida.arbitro}</div>}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function JogosPage() {
  const [comp, setComp]         = useState<string>('todas');
  const [local, setLocal]       = useState<string>('todos');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detalhe, setDetalhe]   = useState<'eventos' | 'stats' | 'formacao'>('eventos');

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
    { value: 'todas',    label: 'Todas' },
    { value: 'liga',     label: 'Liga' },
    { value: 'taca-pt',  label: 'Taça Portugal' },
    { value: 'taca-liga',label: 'Taça Liga' },
    { value: 'europa',   label: 'Europa' },
    { value: 'amigavel', label: 'Amigáveis' },
  ];
  const LOCAL_OPTS = [
    { value: 'todos', label: 'Todos' },
    { value: 'casa',  label: 'Casa' },
    { value: 'fora',  label: 'Fora' },
  ];
  const pill = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600,
    border: '0.5px solid', cursor: 'pointer', fontFamily: 'var(--font-sora)',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--surface2)', borderRadius: '10px 10px 0 0', border: '0.5px solid var(--bd)', borderBottom: 'none' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink2)' }}>{label}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {([[gv, 'V', '#006B3C'], [ge, 'E', '#6B7280'], [gd, 'D', '#DC2626']] as [number, string, string][]).map(([n, l, c]) =>
              n > 0 && <span key={l} style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: c, color: '#fff' }}>{n}{l}</span>
            )}
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '0.5px solid var(--bd)', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
          {gJogos.map(p => (
            <PartidaRow key={p.id} partida={p}
              expanded={expanded === p.id} detalhe={detalhe}
              onToggle={() => setExpanded(x => x === p.id ? null : p.id)}
              onDetalhe={setDetalhe}
            />
          ))}
        </div>
      </div>
    );
  }

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
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Jogos da Equipa</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--ink4)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Rio Ave FC · 2025/26</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Season banner */}
        <div className="hero-card anim-rise" style={{ padding: 20 }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              Época 2025/26 · Todos os jogos
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4 }}>
              {[
                { l: 'Jogos',    v: stats.total,   s: `${stats.v}V·${stats.e}E·${stats.d}D` },
                { l: 'Vitórias', v: stats.v,       s: `${Math.round(stats.v / stats.total * 100)}%` },
                { l: 'Golos',    v: stats.gm,      s: 'marcados' },
                { l: 'Sofridos', v: stats.gs,      s: 'golos' },
                { l: 'Pts Liga', v: stats.ligaPts, s: 'pontos' },
              ].map(s => (
                <div key={s.l} style={{ background: 'rgba(0,0,0,.2)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>{s.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-.5px', lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,.35)' }}>{s.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: 'var(--surface)', border: '0.5px solid var(--bd)', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Competição</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {COMP_OPTS.map(o => <button key={o.value} onClick={() => setComp(o.value)} style={pill(comp === o.value)}>{o.label}</button>)}
            </div>
          </div>
          <div style={{ width: '0.5px', background: 'var(--bd)', alignSelf: 'stretch', margin: '0 2px' }}/>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Local</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {LOCAL_OPTS.map(o => <button key={o.value} onClick={() => setLocal(o.value)} style={pill(local === o.value)}>{o.label}</button>)}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', fontSize: 11, color: 'var(--ink4)' }}>
            {filtered.length} jogo{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Match list */}
        {filtered.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '0.5px solid var(--bd)', borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
            Nenhum jogo encontrado.
          </div>
        ) : grouped ? (
          Array.from(grouped.entries()).map(([compKey, { label, jogos: gJogos }]) => (
            <MatchGroup key={compKey} label={label} jogos={gJogos}/>
          ))
        ) : (
          <div style={{ background: 'var(--surface)', border: '0.5px solid var(--bd)', borderRadius: 12, overflow: 'hidden' }}>
            {filtered.map(p => (
              <PartidaRow key={p.id} partida={p}
                expanded={expanded === p.id} detalhe={detalhe}
                onToggle={() => setExpanded(x => x === p.id ? null : p.id)}
                onDetalhe={setDetalhe}
              />
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '4px 0 12px', fontSize: 11, color: 'var(--ink4)' }}>
          Dados coletados por Daniel Silva · Sócio 3883
        </div>
      </main>
    </div>
  );
}
