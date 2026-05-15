'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getRosterRA, getPlayerStats, FICHAS_RA, TOTAL_JOGOS_EPOCA, type JogadorPlantel } from '@/lib/mock-jogos-equipa';

const EPOCAS = ['25/26'];
const POS_GROUP: Record<string,string> = {
  GR:'Guarda-Redes', DC:'Defesas', DD:'Defesas', DE:'Defesas',
  MDC:'Médios', MI:'Médios', ME:'Médios', MAD:'Médios', MAM:'Médios', MAE:'Médios', MC:'Médios',
  AV:'Avançados',
};
const GROUP_ORDER = ['Guarda-Redes','Defesas','Médios','Avançados'];
const GBG: Record<string,string> = { 'Guarda-Redes':'#EBF4FF','Defesas':'#EEF7F2','Médios':'#FFF4E5','Avançados':'#FCEBEB' };
const GBT: Record<string,string> = { 'Guarda-Redes':'#1A5FA8','Defesas':'#006B3C','Médios':'#A05C00','Avançados':'#A32D2D' };

function StatPill({ v, label, color='#111318' }: { v: number|string; label: string; color?: string }) {
  return (
    <div style={{ textAlign:'center', minWidth:38 }}>
      <div style={{ fontSize:13, fontWeight:700, color, lineHeight:1 }}>{v}</div>
      <div style={{ fontSize:8, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em', marginTop:1 }}>{label}</div>
    </div>
  );
}

export default function PlantelPage() {
  const [epoca, setEpoca]   = useState('25/26');
  const [search, setSearch] = useState('');

  const roster     = useMemo(() => getRosterRA(epoca), [epoca]);
  const fichas     = FICHAS_RA[epoca]?.length ?? 0;
  const totalJogos = TOTAL_JOGOS_EPOCA[epoca] ?? 34;

  // Pre-compute stats for all players
  const statsMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof getPlayerStats>>();
    roster.forEach(p => m.set(p.nome, getPlayerStats(p.nome, epoca)));
    return m;
  }, [roster, epoca]);

  const filtered = useMemo(() => {
    if (!search.trim()) return roster;
    return roster.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));
  }, [roster, search]);

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

  // Summary KPIs from all players
  const totalGolos    = Array.from(statsMap.values()).reduce((s, v) => s + (v?.golosMarcados ?? 0), 0);
  const totalAssists  = Array.from(statsMap.values()).reduce((s, v) => s + (v?.assistencias ?? 0), 0);
  const totalAmarelos = Array.from(statsMap.values()).reduce((s, v) => s + (v?.cartoesAmarelos ?? 0), 0);

  const COLS = ['Nº', 'Jogador', 'Min', 'Fichas', 'Tit', 'Sub', '⚽', '🅰', '🟨', 'GS'];
  const GRID = '44px 1fr 52px 44px 44px 44px 36px 36px 36px 36px';

  return (
    <div style={{ minHeight:'100vh', background:'#F0F2F5' }}>
      <header style={{ background:'#fff', borderBottom:'0.5px solid #E4E7EC', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:860, margin:'0 auto', padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:5, textDecoration:'none', color:'#6B7280', fontSize:12, fontWeight:600 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
            Início
          </Link>
          <span style={{ color:'#E4E7EC' }}>·</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#111318' }}>Plantel</div>
            <div style={{ fontSize:9, fontWeight:600, color:'#B0B5BE', letterSpacing:'.08em', textTransform:'uppercase' }}>Rio Ave FC · {epoca}</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:860, margin:'0 auto', padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>

        {/* Banner */}
        <div style={{ background:'linear-gradient(135deg,#003D20,#005A30)', borderRadius:14, padding:'18px 22px', color:'#fff' }}>
          <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,.4)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:10 }}>
            Plantel · Fichas de jogo · {fichas} de {totalJogos}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8 }}>
            {[
              { l:'Jogadores', v:roster.length },
              { l:'Fichas disp.', v:`${fichas}/${totalJogos}` },
              { l:'Golos', v:totalGolos, color:'#5CFF9D' },
              { l:'Assist.', v:totalAssists, color:'#7CD4FD' },
              { l:'Amarelos', v:totalAmarelos, color:'#FDE68A' },
              { l:'Época', v:epoca },
            ].map(s => (
              <div key={s.l} style={{ background:'rgba(0,0,0,.2)', borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:800, color:(s as any).color ?? '#fff', lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:8, color:'rgba(255,255,255,.4)', marginTop:2, textTransform:'uppercase', letterSpacing:'.05em' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
        <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'8px 14px', fontSize:11, color:'#92400E' }}>
          ⚠️ Estatísticas baseadas em <strong>{fichas} fichas</strong> de {totalJogos} jogos da época. As colunas Min · ⚽ · 🅰 · 🟨 · GS referem-se apenas aos jogos com dados disponíveis.
        </div>

        {/* Filters */}
        <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:'12px 14px', display:'flex', gap:12, alignItems:'flex-start', flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>Época</div>
            <div style={{ display:'flex', gap:5 }}>
              {EPOCAS.map(e => (
                <button key={e} onClick={() => setEpoca(e)} style={{ padding:'5px 12px', borderRadius:99, fontSize:11, fontWeight:600, border:'1.5px solid', cursor:'pointer', borderColor:epoca===e?'#006B3C':'#D1D5DB', background:epoca===e?'#006B3C':'#fff', color:epoca===e?'#fff':'#6B7280' }}>{e}</button>
              ))}
            </div>
          </div>
          <div style={{ flex:1, minWidth:160 }}>
            <div style={{ fontSize:10, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>Pesquisar</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'#F9FAFB', border:'1px solid #E4E7EC', borderRadius:8, padding:'6px 10px' }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#9CA3AF" strokeWidth="1.8"><circle cx="5.5" cy="5.5" r="4.5"/><path d="M9.5 9.5l2.5 2.5" strokeLinecap="round"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome do jogador..."
                style={{ border:'none', background:'transparent', fontSize:12, color:'#111318', outline:'none', flex:1 }}/>
            </div>
          </div>
        </div>

        {/* Player groups */}
        {GROUP_ORDER.map(group => {
          const players = grouped.get(group) ?? [];
          if (!players.length) return null;
          return (
            <div key={group} style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, overflow:'hidden' }}>
              {/* Group header */}
              <div style={{ padding:'10px 16px', background:'#F9FAFB', borderBottom:'1px solid #E4E7EC', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#111318' }}>{group}</span>
                <span style={{ fontSize:11, color:'#9CA3AF' }}>{players.length} jogadores</span>
              </div>

              {/* Column headers */}
              <div style={{ display:'grid', gridTemplateColumns:GRID, gap:6, padding:'5px 14px', borderBottom:'1px solid #F3F4F6', background:'#FAFAFA' }}>
                {COLS.map(h => (
                  <div key={h} style={{ fontSize:9, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', textAlign:h==='Jogador'?'left':'center' }}>{h}</div>
                ))}
              </div>

              {/* Players */}
              {players.map((p, i) => {
                const s = statsMap.get(p.nome);
                const pctMin = s && s.minutosDisponiveis > 0
                  ? Math.round(s.minutosJogados / s.minutosDisponiveis * 100) : 0;
                const noData = !s || s.jogosTotal === 0;
                return (
                  <div key={p.nome} style={{ display:'grid', gridTemplateColumns:GRID, gap:6, padding:'9px 14px', borderBottom:i<players.length-1?'1px solid #F3F4F6':'none', alignItems:'center' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#F9FAFB'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}
                  >
                    {/* Number */}
                    <div style={{ width:34, height:34, borderRadius:8, background:'#F0F2F5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#374151' }}>
                      {p.numero}
                    </div>

                    {/* Name + position */}
                    <div>
                      <Link href={`/plantel/${encodeURIComponent(p.nome)}`} style={{ textDecoration:'none' }}>
                        <span style={{ fontSize:13, fontWeight:600, color:'#006B3C', cursor:'pointer', textDecoration:'underline', textDecorationStyle:'dotted', textUnderlineOffset:3 }}>{p.nome}</span>
                      </Link>
                      {p.posicao && (
                        <span style={{ marginLeft:5, fontSize:8, fontWeight:700, padding:'1px 4px', borderRadius:3, background:GBG[group]??'#F0F2F5', color:GBT[group]??'#6B7280', textTransform:'uppercase', letterSpacing:'.04em' }}>{p.posicao}</span>
                      )}
                    </div>

                    {/* Minutes with % bar */}
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#374151', lineHeight:1 }}>{noData?'—':`${s!.minutosJogados}'`}</div>
                      {!noData && (
                        <div style={{ height:3, background:'#F0F2F5', borderRadius:99, marginTop:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pctMin}%`, background:'#006B3C', borderRadius:99 }}/>
                        </div>
                      )}
                    </div>

                    {/* Fichas */}
                    <StatPill v={noData?'—':p.jogosTotal} label="jogos" color="#006B3C"/>
                    <StatPill v={noData?'—':p.jogosTitular} label="tit"/>
                    <StatPill v={noData?'—':p.jogosSuplente} label="sub" color="#6B7280"/>

                    {/* Goals */}
                    <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color: !noData && s!.golosMarcados>0?'#006B3C':'#9CA3AF' }}>
                      {noData?'—':s!.golosMarcados}
                    </div>

                    {/* Assists */}
                    <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color: !noData && s!.assistencias>0?'#1A5FA8':'#9CA3AF' }}>
                      {noData?'—':s!.assistencias}
                    </div>

                    {/* Yellow cards */}
                    <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color: !noData && s!.cartoesAmarelos>0?'#EF9F27':'#9CA3AF' }}>
                      {noData?'—':s!.cartoesAmarelos}
                    </div>

                    {/* Goals suffered on field */}
                    <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color: !noData && s!.golosSofridosEmCampo>0?'#DC2626':'#9CA3AF' }}>
                      {noData?'—':s!.golosSofridosEmCampo}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Legend */}
        <div style={{ background:'#fff', border:'1px solid #E4E7EC', borderRadius:10, padding:'10px 14px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>Legenda das colunas</div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:11, color:'#6B7280' }}>
            {[['Min','Minutos jogados (barra = % dos disponíveis)'],['Fichas','Jogos na ficha de jogo'],['Tit','Titular'],['Sub','Entrou como suplente'],['⚽','Golos marcados'],['🅰','Assistências'],['🟨','Cartões amarelos'],['GS','Golos sofridos em campo']].map(([k,v])=>(
              <span key={k}><strong style={{ color:'#374151' }}>{k}</strong> — {v}</span>
            ))}
          </div>
        </div>

        <div style={{ textAlign:'center', padding:'4px 0 16px', fontSize:11, color:'#B0B5BE' }}>
          Dados coletados por Daniel Silva · Sócio 3883
        </div>
      </main>
    </div>
  );
}
