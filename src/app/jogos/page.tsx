'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { filtrarJogos, calcularStatsEpoca, type PartidaEquipa, type EventoJogo, type EstatisticasJogo, type JogadorTitular } from '@/lib/mock-jogos-equipa';
import { getJogosDB, getEventosDB, getEstatisticasDB, getFichasDB, type FichasJogo } from '@/lib/db';

// ── Icons ─────────────────────────────────────────────────────
function IcoChevron({ open }: { open: boolean }) {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d={open?'M3 9l4-4 4 4':'M3 5l4 4 4-4'}/></svg>;
}
function IcoSub() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M11 1.5v12M8.5 4L11 1.5 13.5 4" stroke="#006B3C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 13.5v-12M1.5 11L4 13.5 6.5 11" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}


// Normaliza posições para GR / DEF / MED / AV
function normPos(pos?: string): string | undefined {
  if (!pos) return undefined;
  if (['DD','DC','DE'].includes(pos)) return 'DEF';
  if (['MDC','MI','ME','MAD','MAM','MAE','MC'].includes(pos)) return 'MED';
  return pos;
}
const COMP_COLORS: Record<string,{bg:string;color:string}> = {
  'liga':{bg:'#EBF4FF',color:'#1A5FA8'},'taca-pt':{bg:'#FFF4E5',color:'#A05C00'},
  'taca-liga':{bg:'#F3EFFF',color:'#5B34C0'},'europa':{bg:'#E5F5FF',color:'#0B6B9E'},
  'amigavel':{bg:'#F5F5F5',color:'#7B8089'},
};

const STATS_LABELS: [string,string][] = [
  ['posse_bola','% Posse de bola'],['remates','Remates'],['remates_baliza','Remates à baliza'],
  ['remates_poste','Remates ao poste'],['grandes_oportunidades','Grandes oportunidades'],
  ['assistencias','Assistências'],['cruzamentos','Cruzamentos'],['cantos','Cantos'],
  ['livres','Livres'],['ataques','Ataques'],['ataques_centro','Ataques pelo centro'],
  ['ataques_esquerda','Ataques pela esquerda'],['ataques_direita','Ataques pela direita'],
  ['defesas','Defesas'],['penaltis','Penáltis'],['penaltis_defendidos','Penáltis defendidos'],
  ['foras_jogo','Foras de jogo'],['faltas','Faltas'],['amarelos','Amarelos'],['vermelhos','Vermelhos'],
];

function calcHalfScores(eventos: EventoJogo[]) {
  let ra1=0,adv1=0,ra2=0,adv2=0;
  for (const ev of eventos) {
    const first = ev.minuto <= 45;
    if (ev.tipo==='golo'||ev.tipo==='golo_penalidade') {
      if(ev.equipa==='ra'){first?ra1++:ra2++}else{first?adv1++:adv2++}
    } else if(ev.tipo==='auto_golo') {
      if(ev.equipa==='ra'){first?adv1++:adv2++}else{first?ra1++:ra2++}
    }
  }
  return { hs1:`${ra1} — ${adv1}`, hs2:`${ra2} — ${adv2}` };
}

// ── PartidaRow ────────────────────────────────────────────────
function PartidaRow({ partida, expanded, detalhe, onToggle, onDetalhe, cardBg }: {
  partida: PartidaEquipa; expanded: boolean; detalhe: 'eventos'|'stats'|'formacao';
  onToggle:()=>void; onDetalhe:(d:'eventos'|'stats'|'formacao')=>void; cardBg?: string;
}) {
  const [detail, setDetail] = useState<{eventos:EventoJogo[];stats:EstatisticasJogo|null;fichas:FichasJogo|null}|null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (expanded && !detail) {
      setLoadingDetail(true);
      Promise.all([getEventosDB(partida.id), getEstatisticasDB(partida.id), getFichasDB(partida.id)])
        .then(([eventos, stats, fichas]) => { setDetail({ eventos, stats, fichas }); setLoadingDetail(false); });
    }
  }, [expanded, partida.id, detail]);

  const isHome = partida.local === 'casa';
  const res = {V:'Vitória',E:'Empate',D:'Derrota'}[partida.resultado];
  const compClr = COMP_COLORS[partida.competicao]??COMP_COLORS['amigavel'];
  const scoreL = isHome ? partida.golos_ra : partida.golos_adv;
  const scoreR = isHome ? partida.golos_adv : partida.golos_ra;
  const teamL  = isHome ? 'Rio Ave FC' : partida.adversario;
  const teamR  = isHome ? partida.adversario : 'Rio Ave FC';
  const badgeBg = partida.resultado==='V'?'#006B3C':partida.resultado==='E'?'#6B7280':'#DC2626';
  const fmtDate = (d:string) => new Date(d+'T00:00:00').toLocaleDateString('pt-PT',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'});

  const eventos  = detail?.eventos ?? [];
  const statsJogo = detail?.stats;
  const titRA    = detail?.fichas?.titulares_ra ?? [];
  const titAdv   = detail?.fichas?.titulares_adv ?? [];
  const supRA    = detail?.fichas?.suplentes_ra ?? [];
  const supAdv   = detail?.fichas?.suplentes_adv ?? [];
  const { hs1, hs2 } = useMemo(() => calcHalfScores(eventos), [eventos]);

  function isDoubleYellow(ev:EventoJogo) {
    if (ev.tipo!=='cartao_vermelho') return false;
    return eventos.some(e => e.tipo==='cartao_amarelo' && e.equipa===ev.equipa && e.jogador===ev.jogador && e.minuto<ev.minuto);
  }

  function CardIcon({type,double:dbl}:{type:'yellow'|'red';double?:boolean}) {
    if(dbl) return <div style={{display:'flex',alignItems:'center',gap:3}}><div style={{position:'relative',width:20,height:14}}><div style={{position:'absolute',left:0,width:10,height:13,borderRadius:2,background:'#EF9F27',border:'0.5px solid rgba(0,0,0,.15)'}}/><div style={{position:'absolute',left:6,width:10,height:13,borderRadius:2,background:'#EF9F27',border:'0.5px solid rgba(0,0,0,.15)'}}/></div><span style={{fontSize:9,color:'#9CA3AF'}}>→</span><div style={{width:10,height:13,borderRadius:2,background:'#DC2626',border:'0.5px solid rgba(0,0,0,.15)'}}/></div>;
    return <div style={{width:11,height:14,borderRadius:2,background:type==='yellow'?'#EF9F27':'#DC2626',border:'0.5px solid rgba(0,0,0,.15)',flexShrink:0}}/>;
  }

  function EventRow({ev}:{ev:EventoJogo}) {
    const isRA=ev.equipa==='ra';
    const showLeft=isHome?isRA:!isRA;
    const isGoal=['golo','golo_penalidade','auto_golo'].includes(ev.tipo);
    const isSub=ev.tipo==='substituicao';
    const isYellow=ev.tipo==='cartao_amarelo';
    const isRed=ev.tipo==='cartao_vermelho';
    const isDbl=isRed&&isDoubleYellow(ev);
    const score=ev.score_ra!=null?<span style={{fontSize:11,fontWeight:800,padding:'2px 7px',borderRadius:5,background:'rgba(0,0,0,.07)',color:'#111318'}}>{ev.score_ra}–{ev.score_adv}</span>:null;
    const min=ev.minuto_extra?`${ev.minuto}+${ev.minuto_extra}'`:`${ev.minuto}'`;
    // auto_golo by RA = goal for opponent → red background
    const isAutoGoalRA = ev.tipo==='auto_golo' && isRA;
    const rowBg=isGoal?(isAutoGoalRA||!isRA?'rgba(220,38,38,.05)':'rgba(0,107,60,.06)'):'transparent';
    const iconEl=isGoal?<span style={{fontSize:16}}>⚽</span>:isSub?<IcoSub/>:(isYellow||isRed)?<CardIcon type={isYellow?'yellow':'red'} double={isDbl}/>:null;
    const nameStyle:React.CSSProperties={fontSize:12,fontWeight:isGoal?700:600,color:'#111318'};
    const mainName=isSub&&ev.jogador2?ev.jogador2:ev.jogador;
    const subDetail=isSub&&ev.jogador2?<span style={{fontSize:10,color:'#9CA3AF',marginLeft:4}}>↓ {ev.jogador}</span>:isGoal&&ev.jogador2?<span style={{fontSize:10,color:'#9CA3AF',marginLeft:4}}>assist. {ev.jogador2}</span>:null;
    if(showLeft) return <div style={{display:'grid',gridTemplateColumns:'40px 1fr 40px',alignItems:'center',minHeight:isGoal?36:28,padding:'3px 4px',background:rowBg,borderRadius:6}}><div style={{textAlign:'right',fontSize:11,fontWeight:700,color:'#9CA3AF'}}>{min}</div><div style={{padding:'0 8px',display:'flex',alignItems:'center',gap:5}}>{iconEl}<span style={nameStyle}>{mainName}</span>{subDetail}{score&&<div style={{marginLeft:4}}>{score}</div>}</div><div/></div>;
    return <div style={{display:'grid',gridTemplateColumns:'40px 1fr 40px',alignItems:'center',minHeight:isGoal?36:28,padding:'3px 4px',background:rowBg,borderRadius:6}}><div/><div style={{padding:'0 8px',display:'flex',alignItems:'center',justifyContent:'flex-end',gap:5}}>{score&&<div>{score}</div>}{subDetail&&(isSub&&ev.jogador2?<span style={{fontSize:10,color:'#9CA3AF',marginRight:4}}>↓ {ev.jogador}</span>:isGoal&&ev.jogador2?<span style={{fontSize:10,color:'#9CA3AF',marginRight:4}}>assist. {ev.jogador2}</span>:null)}<span style={nameStyle}>{mainName}</span>{iconEl}</div><div style={{textAlign:'left',fontSize:11,fontWeight:700,color:'#9CA3AF'}}>{min}</div></div>;
  }

  function HalfDivider({label,score}:{label:string;score:string}) {
    return <div style={{display:'flex',alignItems:'center',gap:8,margin:'10px 0 6px',padding:'6px 10px',background:'#F0F2F5',borderRadius:8}}><span style={{fontSize:10,fontWeight:700,color:'#6B7280',textTransform:'uppercase',letterSpacing:'.08em',flex:1}}>{label}</span><span style={{fontSize:12,fontWeight:800,color:'#374151',background:'#fff',padding:'2px 10px',borderRadius:6,border:'1px solid #E4E7EC'}}>{score}</span></div>;
  }

  function EventsList() {
    if (!eventos.length) return <div style={{padding:'20px 0',textAlign:'center',fontSize:12,color:'#9CA3AF'}}>Eventos serão adicionados progressivamente.</div>;
    const rows:React.ReactNode[]=[];
    let shownSecond=false;
    rows.push(<HalfDivider key="first" label="1ª Parte" score={hs1}/>);
    for(const ev of eventos){
      if(ev.minuto>45&&!ev.minuto_extra&&!shownSecond){rows.push(<HalfDivider key="second" label="2ª Parte" score={hs2}/>);shownSecond=true;}
      rows.push(<EventRow key={`${ev.minuto}-${ev.tipo}-${ev.jogador}`} ev={ev}/>);
    }
    return <>{rows}</>;
  }

  const detailTab=(d:'eventos'|'stats'|'formacao'):React.CSSProperties=>({flex:1,padding:'9px 8px',fontSize:11,fontWeight:600,textAlign:'center' as const,cursor:'pointer',fontFamily:'inherit',transition:'all .15s',border:'0.5px solid',borderColor:detalhe===d?'#006B3C':'#E4E7EC',background:detalhe===d?'#006B3C':'#fff',color:detalhe===d?'#fff':'#7B8089',borderRadius:8,margin:'0 3px'});

  const ann=(pNome:string,evs:EventoJogo[],eq:'ra'|'adv')=>{
    const e=evs.filter(x=>x.equipa===eq);
    const y=e.filter(x=>x.tipo==='cartao_amarelo'&&x.jogador===pNome).length;
    const r=e.filter(x=>x.tipo==='cartao_vermelho'&&x.jogador===pNome).length;
    const out=e.find(x=>x.tipo==='substituicao'&&x.jogador===pNome);
    const inn=e.find(x=>x.tipo==='substituicao'&&x.jogador2===pNome);
    return{y,r,dbl:r>0&&y>0,out,inn};
  };

  return (
    <div style={{background:cardBg??'#fff',border:'1.5px solid #E4E7EC',borderRadius:12,overflow:'hidden',marginBottom:10,boxShadow:'0 1px 4px rgba(0,0,0,.05)'}}>
      <div style={{padding:'8px 14px 0',display:'flex',alignItems:'center',gap:6}}>
        <span style={{padding:'2px 8px',borderRadius:99,fontSize:9,fontWeight:700,background:compClr.bg,color:compClr.color}}>{partida.competicao_label} · {partida.jornada}</span>
        <span style={{fontSize:10,color:'#9CA3AF'}}>{fmtDate(partida.data)} · {partida.hora}</span>
      </div>
      <div onClick={onToggle} style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:8,padding:'10px 14px 6px',cursor:'pointer',transition:'background .12s',background:expanded?'#EEF7F2':'transparent'}}
        onMouseEnter={e=>{if(!expanded)(e.currentTarget as HTMLElement).style.background='#F9FAFB'}}
        onMouseLeave={e=>{if(!expanded)(e.currentTarget as HTMLElement).style.background='transparent'}}
      >
        <div style={{display:'flex',flexDirection:'column',gap:3}}>
          <span style={{fontSize:15,fontWeight:700,color:isHome?'#006B3C':'#111318'}}>{teamL}</span>
          <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:3,textTransform:'uppercase' as const,alignSelf:'flex-start',background:'#EEF7F2',color:'#006B3C',letterSpacing:'.04em'}}>CASA</span>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:26,fontWeight:800,color:'#111318',letterSpacing:-2,lineHeight:1}}>{scoreL} – {scoreR}</div>
          <div style={{marginTop:4}}><span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,display:'inline-block',background:badgeBg,color:'#fff'}}>{res}</span></div>
          <div style={{fontSize:10,color:'#9CA3AF',marginTop:5}}>Clica para mais dados</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:3,alignItems:'flex-end'}}>
          <span style={{fontSize:15,fontWeight:700,color:!isHome?'#006B3C':'#111318'}}>{teamR}</span>
          <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:3,textTransform:'uppercase' as const,background:'#F1F3F5',color:'#6B7280',letterSpacing:'.04em'}}>FORA</span>
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 14px 10px',fontSize:10,color:'#9CA3AF',borderBottom:expanded?'1px solid #E4E7EC':'none'}}>
        <span>{isHome?'Estádio dos Arcos':(partida.estadio??'Estádio do adversário')}</span>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {partida.espectadores&&<span style={{fontWeight:600,color:'#6B7280'}}>{partida.espectadores.toLocaleString('pt-PT')} esp.</span>}
          <span style={{color:'#9CA3AF'}}><IcoChevron open={expanded}/></span>
        </div>
      </div>
      {expanded && (
        <div style={{background:'#F9FAFB'}}>
          <div style={{display:'flex',padding:'10px 10px 6px',gap:0}}>
            {(['eventos','stats','formacao'] as const).map(d=><button key={d} onClick={()=>onDetalhe(d)} style={detailTab(d)}>{d==='eventos'?'⚡ Eventos':d==='stats'?'📊 Estatísticas':'👕 Formações'}</button>)}
          </div>
          {loadingDetail && <div style={{padding:'20px',textAlign:'center',fontSize:12,color:'#9CA3AF'}}>A carregar dados…</div>}
          {!loadingDetail && detalhe==='eventos' && (
            <div style={{padding:'4px 14px 12px'}}>
              <div style={{display:'grid',gridTemplateColumns:'40px 1fr 40px',padding:'6px 0',marginBottom:4,borderBottom:'1px solid #E4E7EC'}}>
                <span style={{textAlign:'right',fontSize:9,fontWeight:700,color:isHome?'#006B3C':'#6B7280',textTransform:'uppercase',letterSpacing:'.07em'}}>{isHome?'RA':partida.adversario.split(' ')[0]}</span>
                <span/>
                <span style={{fontSize:9,fontWeight:700,color:isHome?'#6B7280':'#006B3C',textTransform:'uppercase',letterSpacing:'.07em'}}>{isHome?partida.adversario.split(' ')[0]:'RA'}</span>
              </div>
              <EventsList/>
            </div>
          )}
          {!loadingDetail && detalhe==='stats' && (
            <div style={{padding:'6px 14px 12px'}}>
              {statsJogo ? (
                <>
                  {/* Casa à esquerda, Fora à direita */}
                  <div style={{display:'grid',gridTemplateColumns:'44px 1fr 44px',gap:8,paddingBottom:8,borderBottom:'1.5px solid #E4E7EC',marginBottom:4}}>
                    <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:isHome?'#006B3C':'#DC2626'}}>
                      {isHome?'RA':partida.adversario.split(' ')[0]}
                    </span>
                    <span style={{fontSize:9,color:'#9CA3AF',textAlign:'center',alignSelf:'center'}}>casa · fora</span>
                    <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:isHome?'#DC2626':'#006B3C',textAlign:'right'}}>
                      {isHome?partida.adversario.split(' ')[0]:'RA'}
                    </span>
                  </div>
                  {STATS_LABELS.map(([key,label],idx)=>{
                    const vals=statsJogo[key as keyof EstatisticasJogo] as [number,number];
                    const [raVal,advVal]=vals??[0,0];
                    // Casa à esquerda: quando RA é casa usa raVal esq, quando RA é fora usa advVal esq
                    const [vl,vr]=isHome?[raVal,advVal]:[advVal,raVal];
                    const tot=Math.max(vl+vr,1);
                    const pl=Math.round(vl/tot*100);
                    const colorL=isHome?'#006B3C':'#DC2626';
                    const colorR=isHome?'#DC2626':'#006B3C';
                    return <div key={key} style={{display:'grid',gridTemplateColumns:'44px 1fr 44px',gap:8,alignItems:'center',padding:'7px 6px',background:idx%2===0?'#fff':'#F9FAFB',borderRadius:6}}>
                      <div style={{fontSize:13,fontWeight:700,color:'#111318'}}>{key==='posse_bola'?`${vl}%`:vl}</div>
                      <div>
                        <div style={{fontSize:10,color:'#9CA3AF',textAlign:'center',marginBottom:4}}>{label}</div>
                        <div style={{height:5,background:'#E4E7EC',borderRadius:99,overflow:'hidden',display:'flex'}}>
                          <div style={{background:colorL,height:'100%',width:`${pl}%`,borderRadius:'99px 0 0 99px'}}/>
                          <div style={{background:colorR,height:'100%',width:`${100-pl}%`,marginLeft:'auto',borderRadius:'0 99px 99px 0'}}/>
                        </div>
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:'#111318',textAlign:'right'}}>{key==='posse_bola'?`${vr}%`:vr}</div>
                    </div>;
                  })}
                </>
              ) : <div style={{padding:'20px 0',textAlign:'center',fontSize:12,color:'#9CA3AF'}}>Estatísticas serão adicionadas progressivamente.</div>}
            </div>
          )}
          {!loadingDetail && detalhe==='formacao' && (
            <div style={{padding:'6px 14px 12px'}}>
              {titRA.length>0 ? (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {([{title:'Rio Ave FC',scheme:partida.formacao_ra,tits:titRA,sups:supRA,color:'#006B3C',eq:'ra' as const},{title:partida.adversario,scheme:partida.formacao_adv,tits:titAdv,sups:supAdv,color:'#1A5FA8',eq:'adv' as const}]).map(({title,scheme,tits,sups,color,eq})=>(
                    <div key={title} style={{background:'#fff',border:'1px solid #E4E7EC',borderRadius:10,overflow:'hidden'}}>
                      <div style={{padding:'8px 10px',borderBottom:'1px solid #E4E7EC',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#F9FAFB'}}>
                        <span style={{fontSize:12,fontWeight:700,color}}>{title}</span>
                        {scheme&&<span style={{fontSize:10,fontWeight:600,color:'#9CA3AF',background:'#F0F2F5',padding:'2px 7px',borderRadius:99}}>{scheme}</span>}
                      </div>
                      <div style={{padding:'4px 0'}}>
                        <div style={{padding:'3px 10px 2px',fontSize:9,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.08em'}}>Titulares</div>
                        {tits.map(p=>{const a=ann(p.nome,eventos,eq);return(<div key={p.numero} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 10px',fontSize:11}}><span style={{fontSize:10,fontWeight:700,color:'#9CA3AF',minWidth:18,textAlign:'right'}}>{p.numero}</span><span style={{color:'#111318',flex:1}}>{p.nome}{p.capitao?' (C)':''}</span>{!a.dbl&&a.y>0&&<div style={{width:9,height:11,borderRadius:1.5,background:'#EF9F27',flexShrink:0}}/>}{a.dbl&&<><div style={{position:'relative',width:17,height:11,flexShrink:0}}><div style={{position:'absolute',left:0,width:9,height:11,borderRadius:1.5,background:'#EF9F27'}}/><div style={{position:'absolute',left:5,width:9,height:11,borderRadius:1.5,background:'#EF9F27'}}/></div><div style={{width:9,height:11,borderRadius:1.5,background:'#DC2626'}}/></>}{a.r>0&&!a.dbl&&<div style={{width:9,height:11,borderRadius:1.5,background:'#DC2626',flexShrink:0}}/>}{a.out&&<span style={{fontSize:9,fontWeight:700,color:'#DC2626',background:'rgba(220,38,38,.08)',padding:'1px 4px',borderRadius:4,flexShrink:0}}>↓{a.out.minuto}&apos;</span>}{p.posicao&&<span style={{fontSize:8,color:'#9CA3AF',background:'#F0F2F5',padding:'1px 4px',borderRadius:3}}>{normPos(p.posicao)}</span>}</div>);})}
                      </div>
                      {sups.length>0&&<div style={{borderTop:'1px solid #E4E7EC',padding:'4px 0'}}><div style={{padding:'3px 10px 2px',fontSize:9,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.08em'}}>Banco</div>{sups.map(p=>{const a=ann(p.nome,eventos,eq);return(<div key={p.numero+p.nome} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 10px',fontSize:11,opacity:a.inn?1:.55}}><span style={{fontSize:10,fontWeight:700,color:'#9CA3AF',minWidth:18,textAlign:'right'}}>{p.numero}</span><span style={{color:a.inn?'#111318':'#6B7280',flex:1}}>{p.nome}</span>{a.inn&&<span style={{fontSize:9,fontWeight:700,color:'#006B3C',background:'rgba(0,107,60,.08)',padding:'1px 4px',borderRadius:4,flexShrink:0}}>↑{a.inn.minuto}&apos;</span>}</div>);})}</div>}
                    </div>
                  ))}
                </div>
              ) : <div style={{padding:'20px 0',textAlign:'center',fontSize:12,color:'#9CA3AF'}}>Formações serão adicionadas progressivamente.</div>}
              {partida.arbitro&&<div style={{marginTop:8,fontSize:11,color:'#9CA3AF',textAlign:'center'}}>Árbitro: {partida.arbitro}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function JogosPage() {
  const [jogos, setJogos]       = useState<PartidaEquipa[]>([]);
  const [loadingJogos, setLoadingJogos] = useState(true);
  const [comp, setComp]         = useState('todas');
  const [local, setLocal]       = useState('todos');
  const [expanded, setExpanded] = useState<string|null>(null);
  const [detalhe, setDetalhe]   = useState<'eventos'|'stats'|'formacao'>('eventos');

  useEffect(() => {
    getJogosDB('25/26').then(data => { setJogos(data); setLoadingJogos(false); });
  }, []);

  const filtered   = useMemo(()=>filtrarJogos(jogos,comp,local),[jogos,comp,local]);
  const stats      = useMemo(()=>calcularStatsEpoca(filtered),[filtered]);
  const casaStats  = useMemo(()=>calcularStatsEpoca(filtrarJogos(jogos,comp,'casa')),[jogos,comp]);
  const foraStats  = useMemo(()=>calcularStatsEpoca(filtrarJogos(jogos,comp,'fora')),[jogos,comp]);
  const showBreak  = local==='todos';

  const grouped = useMemo(()=>{
    if(comp!=='todas') return null;
    const map=new Map<string,{label:string;jogos:PartidaEquipa[]}>();
    for(const j of filtered){if(!map.has(j.competicao))map.set(j.competicao,{label:j.competicao_label,jogos:[]});map.get(j.competicao)!.jogos.push(j);}
    return map;
  },[filtered,comp]);

  const COMP_OPTS=[{value:'todas',label:'Todas'},{value:'liga',label:'Liga'},{value:'taca-pt',label:'Taça Portugal'},{value:'taca-liga',label:'Taça Liga'},{value:'europa',label:'Europa'},{value:'amigavel',label:'Amigáveis'}];
  const LOCAL_OPTS=[{value:'todos',label:'Todos'},{value:'casa',label:'Casa'},{value:'fora',label:'Fora'}];
  const pill=(active:boolean):React.CSSProperties=>({padding:'5px 13px',borderRadius:99,fontSize:11,fontWeight:600,border:'1.5px solid',cursor:'pointer',borderColor:active?'#006B3C':'#D1D5DB',background:active?'#006B3C':'#fff',color:active?'#fff':'#6B7280',transition:'all .12s'});

  function MatchGroup({label,jogos:gJogos}:{label:string;jogos:PartidaEquipa[]}) {
    const gv=gJogos.filter(j=>j.resultado==='V').length;
    const ge=gJogos.filter(j=>j.resultado==='E').length;
    const gd=gJogos.filter(j=>j.resultado==='D').length;
    return <div style={{marginBottom:12}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'#fff',borderRadius:'12px 12px 0 0',border:'1.5px solid #E4E7EC',borderBottom:'none'}}>
        <span style={{fontSize:13,fontWeight:700,color:'#111318'}}>{label}</span>
        <div style={{display:'flex',gap:6}}>{([[gv,'V','#006B3C'],[ge,'E','#6B7280'],[gd,'D','#DC2626']] as [number,string,string][]).map(([n,l,c])=>n>0&&<span key={l} style={{fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:99,background:c,color:'#fff'}}>{n}{l}</span>)}</div>
      </div>
      {gJogos.map((p,mapIdx)=>{const bg=mapIdx%2===0?'#fff':'#F8FBF9';return(<div key={p.id} style={{borderLeft:'1.5px solid #E4E7EC',borderRight:'1.5px solid #E4E7EC',borderBottom:'1.5px solid #E4E7EC',background:bg,borderRadius:p===gJogos[gJogos.length-1]?'0 0 12px 12px':0,overflow:'hidden'}}><PartidaRow partida={p} cardBg={bg} expanded={expanded===p.id} detalhe={detalhe} onToggle={()=>setExpanded(x=>x===p.id?null:p.id)} onDetalhe={setDetalhe}/></div>);})}
    </div>;
  }

  return (
    <div style={{minHeight:'100vh',background:'#F0F2F5'}}>
      <header style={{background:'#fff',borderBottom:'0.5px solid #E4E7EC',position:'sticky',top:0,zIndex:50}}>
        <div style={{maxWidth:760,margin:'0 auto',padding:'0 16px',height:52,display:'flex',alignItems:'center',gap:12}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:5,textDecoration:'none',color:'#6B7280',fontSize:12,fontWeight:600}}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>Início
          </Link>
          <span style={{color:'#E4E7EC'}}>·</span>
          <div><div style={{fontSize:13,fontWeight:700,color:'#111318'}}>Jogos da Equipa</div><div style={{fontSize:9,fontWeight:600,color:'#B0B5BE',letterSpacing:'.08em',textTransform:'uppercase'}}>Rio Ave FC · 2025/26</div></div>
        </div>
      </header>
      <main style={{maxWidth:760,margin:'0 auto',padding:'16px',display:'flex',flexDirection:'column',gap:12}}>
        {/* Banner */}
        <div style={{background:'linear-gradient(135deg,#003D20,#005A30)',borderRadius:14,padding:20,color:'#fff'}}>
          <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,.4)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:10}}>Época 2025/26 · {comp==='todas'?'Todas as competições':COMP_OPTS.find(o=>o.value===comp)?.label} · {local==='todos'?'Casa + Fora':local==='casa'?'Casa':'Fora'}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:showBreak?12:0}}>
            {[{l:'Jogos',v:stats.total,s:`${stats.v}V · ${stats.e}E · ${stats.d}D`},{l:'Vitórias',v:stats.v,s:`${stats.total>0?Math.round(stats.v/stats.total*100):0}%`},{l:'Golos',v:stats.gm,s:`sofridos: ${stats.gs}`},{l:'Pts Liga',v:stats.ligaPts,s:'pontos'}].map(s=>(
              <div key={s.l} style={{background:'rgba(0,0,0,.2)',borderRadius:9,padding:'9px 8px',textAlign:'center'}}>
                <div style={{fontSize:8,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>{s.l}</div>
                <div style={{fontSize:20,fontWeight:800,color:'#fff',letterSpacing:'-.5px',lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,.35)',marginTop:1}}>{s.s}</div>
              </div>
            ))}
          </div>
          {showBreak&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[{label:'🏠 Casa',s:casaStats},{label:'✈️ Fora',s:foraStats}].map(({label,s})=>(<div key={label} style={{background:'rgba(255,255,255,.08)',borderRadius:9,padding:'10px 12px'}}><div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.6)',marginBottom:6}}>{label}</div><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4}}>{[{l:'Jogos',v:s.total},{l:'V-E-D',v:`${s.v}-${s.e}-${s.d}`},{l:'Golos',v:s.gm},{l:'Sofrid',v:s.gs}].map(k=>(<div key={k.l} style={{textAlign:'center'}}><div style={{fontSize:14,fontWeight:700,color:'#fff',lineHeight:1}}>{k.v}</div><div style={{fontSize:8,color:'rgba(255,255,255,.35)',marginTop:1}}>{k.l}</div></div>))}</div></div>))}</div>}
        </div>
        {/* Filters */}
        <div style={{background:'#fff',border:'1.5px solid #E4E7EC',borderRadius:14,padding:'14px 16px'}}>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Competição</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{COMP_OPTS.map(o=><button key={o.value} onClick={()=>setComp(o.value)} style={pill(comp===o.value)}>{o.label}</button>)}</div>
          </div>
          <div style={{borderTop:'1px solid #F3F4F6',paddingTop:10,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
            <div><div style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Local</div><div style={{display:'flex',gap:6}}>{LOCAL_OPTS.map(o=><button key={o.value} onClick={()=>setLocal(o.value)} style={pill(local===o.value)}>{o.label}</button>)}</div></div>
            <span style={{fontSize:12,color:'#9CA3AF'}}>{filtered.length} jogo{filtered.length!==1?'s':''}</span>
          </div>
        </div>
        {/* Match list */}
        {loadingJogos ? (
          <div style={{background:'#fff',border:'1.5px solid #E4E7EC',borderRadius:14,padding:'40px',textAlign:'center',color:'#9CA3AF'}}>A carregar jogos…</div>
        ) : filtered.length===0 ? (
          <div style={{background:'#fff',border:'1.5px solid #E4E7EC',borderRadius:14,padding:'40px 20px',textAlign:'center',color:'#9CA3AF'}}>Nenhum jogo encontrado.</div>
        ) : grouped ? (
          Array.from(grouped.entries()).map(([ck,{label,jogos:gJogos}])=><MatchGroup key={ck} label={label} jogos={gJogos}/>)
        ) : (
          <>
            {filtered.map((p,idx)=><PartidaRow key={p.id} partida={p} cardBg={idx%2===0?'#fff':'#F8FBF9'} expanded={expanded===p.id} detalhe={detalhe} onToggle={()=>setExpanded(x=>x===p.id?null:p.id)} onDetalhe={setDetalhe}/>)}
          </>
        )}
        <div style={{textAlign:'center',padding:'4px 0 16px',fontSize:11,color:'#B0B5BE'}}>Dados coletados por Daniel Silva · Sócio 3883</div>
      </main>
    </div>
  );
}
