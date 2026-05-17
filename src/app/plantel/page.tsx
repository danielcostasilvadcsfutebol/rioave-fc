'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getFichasEpocaDB } from '@/lib/db';
import { getRosterRA, getPlayerStats, TOTAL_JOGOS_EPOCA, type JogadorPlantel, type FichaData } from '@/lib/mock-jogos-equipa';

// Normaliza posições antigas para formato simplificado
function normPos(pos?: string): string | undefined {
  if (!pos) return undefined;
  if (['DD','DC','DE'].includes(pos)) return 'DEF';
  if (['MDC','MI','ME','MAD','MAM','MAE','MC'].includes(pos)) return 'MED';
  return pos;
}
const POS_GROUP: Record<string,string> = {
  GR:'Guarda-Redes', DEF:'Defesas', MED:'Médios', AV:'Avançados',
  // Legacy support
  DC:'Defesas', DD:'Defesas', DE:'Defesas',
  MDC:'Médios', MI:'Médios', ME:'Médios', MAD:'Médios', MAM:'Médios', MAE:'Médios', MC:'Médios',
};
const GROUP_ORDER = ['Guarda-Redes','Defesas','Médios','Avançados'];
const GBG: Record<string,string> = {'Guarda-Redes':'#EBF4FF','Defesas':'#EEF7F2','Médios':'#FFF4E5','Avançados':'#FCEBEB'};
const GBT: Record<string,string> = {'Guarda-Redes':'#1A5FA8','Defesas':'#006B3C','Médios':'#A05C00','Avançados':'#A32D2D'};

function StatPill({v,label,color='#111318'}:{v:number|string;label:string;color?:string}) {
  return <div style={{textAlign:'center',minWidth:38}}><div style={{fontSize:13,fontWeight:700,color,lineHeight:1}}>{v}</div><div style={{fontSize:8,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.06em',marginTop:1}}>{label}</div></div>;
}

export default function PlantelPage() {
  const [epoca] = useState('25/26');
  const [search, setSearch] = useState('');
  const [fichas, setFichas] = useState<FichaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFichasEpocaDB(epoca).then(data => { setFichas(data); setLoading(false); });
  }, [epoca]);

  // Fetch all active players for this epoch from jogadores_epoca
  const [jogadoresEpoca, setJogadoresEpoca] = useState<{nome_display:string;posicao:string;numero:number}[]>([]);
  useEffect(() => {
    import('@/lib/supabase-client').then(({ supabase }) =>
      supabase.from('jogadores_epoca')
        .select('numero, jogadores(nome_display, posicao)')
        .eq('epoca', epoca).eq('ativo', true).order('numero')
        .then(({ data }) => {
          setJogadoresEpoca((data ?? []).map((r: any) => ({
            nome_display: r.jogadores.nome_display,
            posicao: r.jogadores.posicao,
            numero: r.numero,
          })));
        })
    );
  }, [epoca]);

  // Roster = all players from jogadores_epoca (shows everyone, stats computed where available)
  const roster = useMemo((): JogadorPlantel[] => {
    const POS_ORDER: Record<string,number> = { GR:100, DEF:80, MED:60, AV:20 };
    return jogadoresEpoca.map(j => ({
      nome: j.nome_display, numero: j.numero, posicao: j.posicao,
      jogosTitular:0, jogosSuplente:0, jogosTotal:0,
    })).sort((a,b) => {
      const pa=POS_ORDER[a.posicao??'']??0, pb=POS_ORDER[b.posicao??'']??0;
      return pb!==pa ? pb-pa : (a.numero??99)-(b.numero??99);
    });
  }, [jogadoresEpoca]);

  // Pre-compute stats for all players using Supabase fichas
  const statsMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof computePlayerStats>>();
    roster.forEach(p => {
      // Temporarily override FICHAS_RA with Supabase data
      m.set(p.nome, computePlayerStats(p.nome, fichas));
    });
    return m;
  }, [roster, fichas]);

  const totalJogos = TOTAL_JOGOS_EPOCA[epoca] ?? 34;
  const totalGolos = Array.from(statsMap.values()).reduce((s,v) => s+(v?.golosMarcados??0), 0);
  const totalAssists = Array.from(statsMap.values()).reduce((s,v) => s+(v?.assistencias??0), 0);
  const totalAmarelos = Array.from(statsMap.values()).reduce((s,v) => s+(v?.cartoesAmarelos??0), 0);

  const filtered = useMemo(() => {
    if (!search.trim()) return roster;
    return roster.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));
  }, [roster, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, JogadorPlantel[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const p of filtered) {
      const g = POS_GROUP[normPos(p.posicao)??p.posicao??'']??POS_GROUP[p.posicao??'']??'Outros';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(p);
    }
    return map;
  }, [filtered]);

  const GRID = '44px 1fr 52px 44px 44px 44px 36px 36px 36px 36px 36px';
  const COLS: {key:string; tip:string}[] = [
    {key:'Nº',    tip:'Número de camisola'},
    {key:'Jogador',tip:'Nome do jogador'},
    {key:'Min',   tip:'Minutos jogados'},
    {key:'Fichas',tip:'Nº de jogos na ficha'},
    {key:'Tit',   tip:'Jogos como titular'},
    {key:'Sub',   tip:'Jogos como suplente (entrou)'},
    {key:'⚽',    tip:'Golos marcados'},
    {key:'🅰',    tip:'Assistências'},
    {key:'🟨',    tip:'Cartões amarelos'},
    {key:'🟥',    tip:'Cartões vermelhos'},
    {key:'GS',    tip:'Golos sofridos em campo'},
  ];

  return (
    <div style={{minHeight:'100vh',background:'#F0F2F5'}}>
      <header style={{background:'#fff',borderBottom:'0.5px solid #E4E7EC',position:'sticky',top:0,zIndex:50}}>
        <div style={{maxWidth:860,margin:'0 auto',padding:'0 16px',height:52,display:'flex',alignItems:'center',gap:12}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:5,textDecoration:'none',color:'#6B7280',fontSize:12,fontWeight:600}}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>Início
          </Link>
          <span style={{color:'#E4E7EC'}}>·</span>
          <div><div style={{fontSize:13,fontWeight:700,color:'#111318'}}>Plantel</div><div style={{fontSize:9,fontWeight:600,color:'#B0B5BE',letterSpacing:'.08em',textTransform:'uppercase'}}>Rio Ave FC · {epoca}</div></div>
        </div>
      </header>
      <main style={{maxWidth:860,margin:'0 auto',padding:'16px',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{background:'linear-gradient(135deg,#003D20,#005A30)',borderRadius:14,padding:'18px 22px',color:'#fff'}}>
          <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,.4)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:10}}>Plantel · Fichas de jogo · {fichas.length} de {totalJogos}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
            {[{l:'Jogadores',v:roster.length},{l:'Fichas disp.',v:`${fichas.length}/${totalJogos}`},{l:'Golos',v:totalGolos,color:'#5CFF9D'},{l:'Assist.',v:totalAssists,color:'#7CD4FD'},{l:'Amarelos',v:totalAmarelos,color:'#FDE68A'},{l:'Época',v:epoca}].map((s:any) => (
              <div key={s.l} style={{background:'rgba(0,0,0,.2)',borderRadius:8,padding:'8px 6px',textAlign:'center'}}>
                <div style={{fontSize:18,fontWeight:800,color:s.color??'#fff',lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:8,color:'rgba(255,255,255,.4)',marginTop:2,textTransform:'uppercase',letterSpacing:'.05em'}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:10,padding:'8px 14px',fontSize:11,color:'#92400E'}}>
          ⚠️ Estatísticas baseadas em <strong>{fichas.length} fichas</strong> de {totalJogos} jogos. As colunas Min · ⚽ · 🅰 · 🟨 · GS referem-se apenas aos jogos com dados disponíveis.
        </div>
        <div style={{background:'#fff',border:'1.5px solid #E4E7EC',borderRadius:12,padding:'12px 14px',display:'flex',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:160}}>
            <div style={{fontSize:10,fontWeight:600,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>Pesquisar</div>
            <div style={{display:'flex',alignItems:'center',gap:6,background:'#F9FAFB',border:'1px solid #E4E7EC',borderRadius:8,padding:'6px 10px'}}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#9CA3AF" strokeWidth="1.8"><circle cx="5.5" cy="5.5" r="4.5"/><path d="M9.5 9.5l2.5 2.5" strokeLinecap="round"/></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome do jogador..." style={{border:'none',background:'transparent',fontSize:12,color:'#111318',outline:'none',flex:1}}/>
            </div>
          </div>
        </div>
        {loading ? (
          <div style={{background:'#fff',border:'1.5px solid #E4E7EC',borderRadius:12,padding:'40px',textAlign:'center',color:'#9CA3AF'}}>A carregar plantel…</div>
        ) : (
          GROUP_ORDER.map(group => {
            const players = grouped.get(group)??[];
            if (!players.length) return null;
            return (
              <div key={group} style={{background:'#fff',border:'1.5px solid #E4E7EC',borderRadius:12,overflow:'hidden'}}>
                <div style={{padding:'10px 16px',background:'#F9FAFB',borderBottom:'1px solid #E4E7EC',display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:'#111318'}}>{group}</span>
                  <span style={{fontSize:11,color:'#9CA3AF'}}>{players.length} jogadores</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:GRID,gap:6,padding:'5px 14px',borderBottom:'1px solid #F3F4F6',background:'#FAFAFA'}}>
                  {COLS.map(h=><div key={h.key} title={h.tip} style={{fontSize:9,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.07em',textAlign:h.key==='Jogador'?'left':'center',cursor:'default'}}>{h.key}</div>)}
                </div>
                {players.map((p,i) => {
                  const s = statsMap.get(p.nome);
                  const pctMin = s&&s.minutosDisponiveis>0 ? Math.round(s.minutosJogados/s.minutosDisponiveis*100) : 0;
                  return (
                    <div key={p.nome} style={{display:'grid',gridTemplateColumns:GRID,gap:6,padding:'9px 14px',borderBottom:i<players.length-1?'1px solid #F3F4F6':'none',alignItems:'center'}}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#F9FAFB'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
                    >
                      <div style={{width:34,height:34,borderRadius:8,background:'#F0F2F5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#374151'}}>{p.numero}</div>
                      <div>
                        <Link href={`/plantel/${encodeURIComponent(p.nome)}`} style={{textDecoration:'none'}}>
                          <span style={{fontSize:13,fontWeight:600,color:'#006B3C',cursor:'pointer',textDecoration:'underline',textDecorationStyle:'dotted',textUnderlineOffset:3}}>{p.nome}</span>
                        </Link>
                        {p.posicao&&<span style={{marginLeft:5,fontSize:8,fontWeight:700,padding:'1px 4px',borderRadius:3,background:GBG[group]??'#F0F2F5',color:GBT[group]??'#6B7280',textTransform:'uppercase',letterSpacing:'.04em'}}>{normPos(p.posicao)}</span>}
                      </div>
                      <div title="Minutos jogados" style={{textAlign:'center'}}>
                        <div style={{fontSize:12,fontWeight:700,color:'#374151',lineHeight:1}}>{s?`${s.minutosJogados}'`:'—'}</div>
                        {s&&<div style={{height:3,background:'#F0F2F5',borderRadius:99,marginTop:3,overflow:'hidden'}}><div style={{height:'100%',width:`${pctMin}%`,background:'#006B3C',borderRadius:99}}/></div>}
                      </div>
                      <StatPill v={s?.jogosTotal ?? 0} label="jogos" color="#006B3C"/>
                      <StatPill v={s?.jogosTitular ?? 0} label="tit"/>
                      <StatPill v={s?.jogosSuplente ?? 0} label="sub" color="#6B7280"/>
                      <div title="Golos marcados" style={{textAlign:'center',fontSize:13,fontWeight:700,color:s&&s.golosMarcados>0?'#006B3C':'#9CA3AF',cursor:'default'}}>{s?s.golosMarcados:'—'}</div>
                      <div title="Assistências" style={{textAlign:'center',fontSize:13,fontWeight:700,color:s&&s.assistencias>0?'#1A5FA8':'#9CA3AF',cursor:'default'}}>{s?s.assistencias:'—'}</div>
                      <div title="Cartões amarelos" style={{textAlign:'center',fontSize:13,fontWeight:700,color:s&&s.cartoesAmarelos>0?'#EF9F27':'#9CA3AF',cursor:'default'}}>{s?s.cartoesAmarelos:'—'}</div>
                      <div title="Cartões vermelhos" style={{textAlign:'center',fontSize:13,fontWeight:700,color:s&&s.cartoesVermelhos>0?'#DC2626':'#9CA3AF',cursor:'default'}}>{s?s.cartoesVermelhos:'—'}</div>
                      <div title="Golos sofridos em campo" style={{textAlign:'center',fontSize:13,fontWeight:700,color:s&&s.golosSofridosEmCampo>0?'#DC2626':'#9CA3AF',cursor:'default'}}>{s?s.golosSofridosEmCampo:'—'}</div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
        <div style={{background:'#fff',border:'1px solid #E4E7EC',borderRadius:10,padding:'10px 14px'}}>
          <div style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>Legenda</div>
          <div style={{display:'flex',gap:16,flexWrap:'wrap',fontSize:11,color:'#6B7280'}}>
            {[['Min','Minutos jogados'],['Fichas','Jogos na ficha'],['Tit','Titular'],['Sub','Entrou como sub'],['⚽','Golos'],['🅰','Assistências'],['🟨','Amarelos'],['🟥','Cartões vermelhos'],['GS','Golos sofridos em campo']].map(([k,v])=>(
              <span key={k}><strong style={{color:'#374151'}}>{k}</strong> — {v}</span>
            ))}
          </div>
        </div>
        <div style={{textAlign:'center',padding:'4px 0 16px',fontSize:11,color:'#B0B5BE'}}>Dados coletados por Daniel Silva · Sócio 3883</div>
      </main>
    </div>
  );
}

// ── Stats computation (same logic as jogador_page) ──────────

// Correspondência de nomes: aceita match parcial (ex: "Spikic" == "Dario Spikic")
const nameMatch = (a: string | undefined, b: string): boolean => {
  if (!a) return false;
  const ta = a.trim().toLowerCase();
  const tb = b.trim().toLowerCase();
  if (ta === tb) return true;
  // Match se um contém o outro como palavra separada
  return ta.endsWith(' ' + tb) || tb.endsWith(' ' + ta) ||
         ta.startsWith(tb + ' ') || tb.startsWith(ta + ' ');
};

function isDoubleYellow(red: any, evts: any[]): boolean {
  return evts.some((e: any) =>
    e.tipo === 'cartao_amarelo' && e.equipa === red.equipa &&
    e.jogador === red.jogador && e.minuto < red.minuto
  );
}

function computePlayerStats(nome: string, fichas: FichaData[]) {
  const k = nome.trim();
  let numero = 0; let posicao: string | undefined;
  for (const f of fichas) {
    const p = [...f.titulares, ...f.suplentes].find(p => nameMatch(p.nome, k));
    if (p) { numero = p.numero; posicao = p.posicao; break; }
  }
  if (!numero && !posicao) return null;

  let jogosTotal=0, jogosTitular=0, jogosSuplente=0, jogosBancoReal=0, minutosJogados=0;
  let golosMarcados=0, assistencias=0, cartoesAmarelos=0, cartoesVermelhos=0;
  let golosSofridosEmCampo=0, golsEquipaEmCampo=0;
  let vitorias=0, empates=0, derrotas=0, vitoriasTitular=0, cleanSheets=0;

  function mne(e: any) { return e.minuto + (e.minuto_extra ?? 0); }

  for (const f of fichas) {
    const isTitular  = f.titulares.some(p => nameMatch(p.nome, k));
    const isSuplente = f.suplentes.some(p => nameMatch(p.nome, k));
    if (!isTitular && !isSuplente) continue;

    // Expulsion minute
    const redCard = f.eventos.find((e: any) =>
      e.tipo === 'cartao_vermelho' && e.equipa === 'ra' && e.jogador.trim() === k
    );
    const minExpulsao = redCard ? mne(redCard) : Infinity;

    // Robusto a subs com jogador/jogador2 trocados: procura em ambos os campos
    const saiuEvt = isTitular ? (
      f.eventos.find((e: any) => e.tipo==='substituicao' && e.equipa==='ra' && nameMatch(e.jogador, k)) ||
      f.eventos.find((e: any) => e.tipo==='substituicao' && e.equipa==='ra' && nameMatch(e.jogador2, k))
    ) : null;
    const entrouEvt = isSuplente ? (
      f.eventos.find((e: any) => e.tipo==='substituicao' && e.equipa==='ra' && nameMatch(e.jogador2, k)) ||
      f.eventos.find((e: any) => e.tipo==='substituicao' && e.equipa==='ra' && nameMatch(e.jogador, k))
    ) : null;
    const minSaiu   = saiuEvt   ? mne(saiuEvt)  : Infinity;
    const minEntrou = entrouEvt ? mne(entrouEvt) : null;

    // Minutos reais em campo (considera sub + expulsão)
    const calcMins = (): number => {
      if (isTitular) return Math.min(minSaiu, minExpulsao, 90);
      if (minEntrou === null) return 0;
      return Math.min(90, minExpulsao) - minEntrou;
    };

    // Estava em campo no minuto X?
    const emCampo = (min: number): boolean => {
      const minFim = Math.min(minSaiu, minExpulsao, 90);
      if (isTitular) return min <= minFim;
      if (minEntrou === null) return false;
      return min >= minEntrou && min <= Math.min(minExpulsao, 90);
    };

    const mins = calcMins();
    if (mins === 0) { jogosBancoReal++; continue; }

    const gm  = f.eventos.filter((e: any) => ['golo','golo_penalidade'].includes(e.tipo) && e.equipa==='ra' && e.jogador.trim()===k).length;
    const ast = f.eventos.filter((e: any) => ['golo','golo_penalidade'].includes(e.tipo) && e.equipa==='ra' && e.jogador2?.trim()===k).length;
    const yl  = f.eventos.filter((e: any) => e.tipo==='cartao_amarelo' && e.equipa==='ra' && e.jogador.trim()===k).length;
    const reds = f.eventos.filter((e: any) => e.tipo==='cartao_vermelho' && e.equipa==='ra' && e.jogador.trim()===k);
    const extraYl = reds.filter((r: any) => isDoubleYellow(r, f.eventos)).length;
    const gc  = f.eventos.filter((e: any) => {
      const isAdv = (e.tipo==='golo'||e.tipo==='golo_penalidade') && e.equipa==='adv';
      const isOwn = e.tipo==='auto_golo' && e.equipa==='ra';
      return (isAdv||isOwn) && emCampo(mne(e));
    }).length;
    const gea = f.eventos.filter((e: any) =>
      ['golo','golo_penalidade'].includes(e.tipo) && e.equipa==='ra' && emCampo(mne(e))
    ).length;

    jogosTotal++; minutosJogados += mins;
    if (isTitular) { jogosTitular++; if (f.resultado==='V') vitoriasTitular++; }
    else jogosSuplente++;
    if (f.resultado==='V') vitorias++;
    else if (f.resultado==='E') empates++;
    else derrotas++;
    golosMarcados+=gm; assistencias+=ast;
    cartoesAmarelos+=(yl+extraYl); cartoesVermelhos+=reds.length;
    golosSofridosEmCampo+=gc; golsEquipaEmCampo+=gea;
    if (gc===0) cleanSheets++;
  }

  const minutosDisponiveis = (jogosTotal + jogosBancoReal) * 90;
  return {
    nome:k, numero, posicao, isGR: posicao==='GR', epoca:'25/26',
    jogosTotal, jogosTitular, jogosSuplente, jogosBanco:jogosBancoReal,
    minutosJogados, minutosDisponiveis,
    golosMarcados, assistencias, contribuicoes:golosMarcados+assistencias,
    cartoesAmarelos, cartoesVermelhos,
    golosSofridosEmCampo, golsEquipaEmCampo,
    diferencaEmCampo:golsEquipaEmCampo-golosSofridosEmCampo,
    cleanSheets, vitorias, empates, derrotas, vitoriasTitular,
  };
}
