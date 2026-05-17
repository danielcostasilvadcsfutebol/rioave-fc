'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useIsMobile } from '@/lib/useIsMobile';
import { supabase } from '@/lib/supabase-client';

function nameMatch(a: string|undefined, b: string): boolean {
  if (!a) return false;
  const ta=a.trim().toLowerCase(), tb=b.trim().toLowerCase();
  return ta===tb||ta.endsWith(' '+tb)||tb.endsWith(' '+ta)||ta.startsWith(tb+' ')||tb.startsWith(ta+' ');
}
function mne(e: any) { return (e.minuto??0)+(e.minuto_extra??0); }
function normPos(p?: string) {
  if (!p) return '';
  if (['DD','DC','DE'].includes(p)) return 'DEF';
  if (['MDC','MI','ME','MAD','MAM','MAE','MC'].includes(p)) return 'MED';
  return p;
}
function fmtDate(d: string) {
  return new Date(d+'T00:00:00').toLocaleDateString('pt-PT',{day:'2-digit',month:'2-digit'});
}

function Sec({ title }: { title: string }) {
  return <div style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>{title}</div>;
}
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{background:'#fff',border:'1.5px solid #E4E7EC',borderRadius:12,padding:'14px 16px',...style}}>{children}</div>;
}
function Kpi({ label, value, color='#111318', sub }: { label:string; value:string|number; color?:string; sub?:string }) {
  return <div style={{background:'#F9FAFB',borderRadius:10,padding:'12px 8px',textAlign:'center'}}>
    <div style={{fontSize:22,fontWeight:800,color,lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:'#9CA3AF',marginTop:2}}>{sub}</div>}
    <div style={{fontSize:9,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.06em',marginTop:4}}>{label}</div>
  </div>;
}
function Bar({ label, value, max, color='#006B3C', right }: { label:string; value:number; max:number; color?:string; right?:string }) {
  const p=max>0?Math.min(value/max*100,100):0;
  return <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,alignItems:'center',padding:'4px 0',borderBottom:'1px solid #F3F4F6'}}>
    <div><div style={{fontSize:11,color:'#374151',marginBottom:2}}>{label}</div>
      <div style={{height:4,background:'#F0F2F5',borderRadius:99,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${p}%`,background:color,borderRadius:99}}/>
      </div>
    </div>
    <div style={{fontSize:13,fontWeight:700,color,minWidth:28,textAlign:'right'}}>{right??value}</div>
  </div>;
}

async function loadAll() {
  const [{ data: jogos }, { data: eventos }, { data: fichas }] = await Promise.all([
    supabase.from('jogos').select('*').eq('epoca','25/26').order('data'),
    supabase.from('eventos_jogo').select('*'),
    supabase.from('fichas_jogo').select('*').eq('equipa','ra'),
  ]);
  if (!jogos?.length) return null;

  const total=jogos.length;
  const wins=jogos.filter(j=>j.resultado==='V').length;
  const draws=jogos.filter(j=>j.resultado==='E').length;
  const losses=jogos.filter(j=>j.resultado==='D').length;
  const pts=wins*3+draws;
  const gm=jogos.reduce((s,j)=>s+j.golos_ra,0);
  const gs=jogos.reduce((s,j)=>s+j.golos_adv,0);
  const cleanSheets=jogos.filter(j=>j.golos_adv===0).length;

  const home=jogos.filter(j=>j.local==='casa');
  const away=jogos.filter(j=>j.local==='fora');
  const homeWins=home.filter(j=>j.resultado==='V').length;
  const awayWins=away.filter(j=>j.resultado==='V').length;
  const homeGm=home.reduce((s,j)=>s+j.golos_ra,0);
  const awayGm=away.reduce((s,j)=>s+j.golos_ra,0);
  const homeGs=home.reduce((s,j)=>s+j.golos_adv,0);
  const awayGs=away.reduce((s,j)=>s+j.golos_adv,0);

  const recentForm=[...jogos].reverse().slice(0,5).map(j=>({r:j.resultado,adv:j.adversario,jornada:j.jornada}));

  // Streaks
  let bestW=0,curW=0,bestU=0,curU=0,bestL=0,curL=0;
  jogos.forEach(j=>{
    curW=j.resultado==='V'?curW+1:0; if(curW>bestW)bestW=curW;
    curU=j.resultado!=='D'?curU+1:0; if(curU>bestU)bestU=curU;
    curL=j.resultado==='D'?curL+1:0; if(curL>bestL)bestL=curL;
  });

  // Goals by jornada
  const goalsByJ=jogos.map(j=>({j:j.jornada,gm:j.golos_ra,gs:j.golos_adv}));

  // Goals by phase
  const raG=(eventos??[]).filter((e:any)=>['golo','golo_penalidade'].includes(e.tipo)&&e.equipa==='ra');
  const advG=(eventos??[]).filter((e:any)=>['golo','golo_penalidade'].includes(e.tipo)&&e.equipa==='adv');
  const ownG=(eventos??[]).filter((e:any)=>e.tipo==='auto_golo'&&e.equipa==='ra');
  const conceded=[...advG,...ownG];
  const gmPhase=[raG.filter((e:any)=>mne(e)<=30).length,raG.filter((e:any)=>mne(e)>30&&mne(e)<=60).length,raG.filter((e:any)=>mne(e)>60).length];
  const gsPhase=[conceded.filter((e:any)=>mne(e)<=30).length,conceded.filter((e:any)=>mne(e)>30&&mne(e)<=60).length,conceded.filter((e:any)=>mne(e)>60).length];

  // Top scorers
  const scorerMap=new Map<string,number>();
  raG.forEach((e:any)=>scorerMap.set(e.jogador,(scorerMap.get(e.jogador)||0)+1));
  const topScorers=Array.from(scorerMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // Top assists
  const assistMap=new Map<string,number>();
  raG.filter((e:any)=>e.jogador2).forEach((e:any)=>assistMap.set(e.jogador2,(assistMap.get(e.jogador2)||0)+1));
  const topAssists=Array.from(assistMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // Top contributions
  const contribMap=new Map<string,number>();
  scorerMap.forEach((v,k)=>contribMap.set(k,(contribMap.get(k)||0)+v));
  assistMap.forEach((v,k)=>contribMap.set(k,(contribMap.get(k)||0)+v));
  const topContribs=Array.from(contribMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // Minutes per player
  const minuteMap=new Map<string,{mins:number;jogos:number;posicao:string}>();
  const fichasByGame=new Map<string,any[]>();
  (fichas??[]).forEach((f:any)=>{
    if(!fichasByGame.has(f.jogo_id))fichasByGame.set(f.jogo_id,[]);
    fichasByGame.get(f.jogo_id)!.push(f);
  });
  fichasByGame.forEach((gFichas,jogoId)=>{
    const evs=(eventos??[]).filter((e:any)=>e.jogo_id===jogoId);
    gFichas.forEach((f:any)=>{
      const nome=f.nome.trim();
      const isTit=f.tipo==='titular', isSup=f.tipo==='suplente';
      const red=evs.find((e:any)=>e.tipo==='cartao_vermelho'&&e.equipa==='ra'&&nameMatch(e.jogador,nome));
      const minExp=red?mne(red):Infinity;
      const sub=evs.find((e:any)=>e.tipo==='substituicao'&&e.equipa==='ra'&&(nameMatch(e.jogador,nome)||nameMatch(e.jogador2,nome)));
      let mins=0;
      if(isTit){const ms=sub?mne(sub):Infinity;mins=Math.min(ms,minExp,90);}
      else if(isSup&&sub){mins=Math.min(90,minExp)-mne(sub);}
      if(mins>0){const prev=minuteMap.get(nome)||{mins:0,jogos:0,posicao:f.posicao||''};minuteMap.set(nome,{mins:prev.mins+mins,jogos:prev.jogos+1,posicao:f.posicao||prev.posicao});}
    });
  });
  const allPlayers=Array.from(minuteMap.entries()).map(([nome,d])=>({nome,...d})).sort((a,b)=>b.mins-a.mins);
  const topMinutes=allPlayers.slice(0,5);
  const byPos=(pos:string)=>allPlayers.filter(p=>normPos(p.posicao)===pos).slice(0,5);

  // Discipline
  const yellowMap=new Map<string,number>(), redMap=new Map<string,number>();
  (eventos??[]).filter((e:any)=>e.equipa==='ra').forEach((e:any)=>{
    if(e.tipo==='cartao_amarelo')yellowMap.set(e.jogador,(yellowMap.get(e.jogador)||0)+1);
    if(e.tipo==='cartao_vermelho')redMap.set(e.jogador,(redMap.get(e.jogador)||0)+1);
  });
  const topYellows=Array.from(yellowMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const topReds=Array.from(redMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // Most disciplined (most mins without card)
  const mostDisciplined=allPlayers
    .filter(p=>!yellowMap.has(p.nome)&&!redMap.has(p.nome)&&p.mins>90)
    .sort((a,b)=>b.mins-a.mins).slice(0,3);

  // Subs from bench
  const subEntryMap=new Map<string,number>();
  (eventos??[]).filter((e:any)=>e.tipo==='substituicao'&&e.equipa==='ra').forEach((e:any)=>{
    if(e.jogador2)subEntryMap.set(e.jogador2,(subEntryMap.get(e.jogador2)||0)+1);
  });
  const topSubEntries=Array.from(subEntryMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // Attendance
  const homeWithEsp=home.filter(j=>j.espectadores);
  const avgEsp=homeWithEsp.length?Math.round(homeWithEsp.reduce((s:number,j:any)=>s+j.espectadores,0)/homeWithEsp.length):0;
  const bestEsp=[...homeWithEsp].sort((a:any,b:any)=>b.espectadores-a.espectadores)[0];

  // Opponents
  const oppMap=new Map<string,{v:number;e:number;d:number}>();
  jogos.forEach((j:any)=>{
    const prev=oppMap.get(j.adversario)||{v:0,e:0,d:0};
    oppMap.set(j.adversario,{v:prev.v+(j.resultado==='V'?1:0),e:prev.e+(j.resultado==='E'?1:0),d:prev.d+(j.resultado==='D'?1:0)});
  });
  const bestOpp=Array.from(oppMap.entries()).filter(([,v])=>v.v>0).sort((a,b)=>b[1].v-a[1].v)[0];
  const worstOpp=Array.from(oppMap.entries()).filter(([,v])=>v.d>0).sort((a,b)=>b[1].d-a[1].d)[0];

  // Records
  const biggestWin=[...jogos].filter((j:any)=>j.resultado==='V').sort((a:any,b:any)=>(b.golos_ra-b.golos_adv)-(a.golos_ra-a.golos_adv))[0];
  const biggestLoss=[...jogos].filter((j:any)=>j.resultado==='D').sort((a:any,b:any)=>(b.golos_adv-b.golos_ra)-(a.golos_adv-a.golos_ra))[0];
  const highestScoring=[...jogos].sort((a:any,b:any)=>(b.golos_ra+b.golos_adv)-(a.golos_ra+a.golos_adv))[0];

  // Cumulative points per jornada
  let cp=0;
  const cumPoints=jogos.map((j:any)=>{
    cp+=j.resultado==='V'?3:j.resultado==='E'?1:0;
    return {j:j.jornada,pts:cp,res:j.resultado as string};
  });

  // Goal minutes for heatmap
  const gmMinutes=raG.map((e:any)=>mne(e));
  const gsMinutes=conceded.map((e:any)=>mne(e));

  // Radar metrics (0–1 normalised)
  const totalYl=(eventos??[]).filter((e:any)=>e.tipo==='cartao_amarelo'&&e.equipa==='ra').length;
  const totalRed=(eventos??[]).filter((e:any)=>e.tipo==='cartao_vermelho'&&e.equipa==='ra').length;
  const radarData={
    ataque:Math.min(1,(gm/Math.max(total,1))/2.5),
    defesa:Math.max(0,1-(gs/Math.max(total,1))/2.5),
    disciplina:Math.max(0,1-(totalYl*0.04+totalRed*0.18)),
    eficacia:Math.min(1,wins/Math.max(total,1)*2),
    presenca:allPlayers.length>0?Math.min(1,allPlayers[0].mins/(Math.max(total,1)*90)):0,
  };

  // Surprise facts
  const facts:string[]=[];
  const secHalf=raG.filter((e:any)=>mne(e)>45).length;
  if(gm>0)facts.push(`${Math.round(secHalf/gm*100)}% dos golos foram marcados na 2ª parte`);
  if(topScorers[0]){
    const sGames=(fichas??[]).filter((f:any)=>f.tipo==='titular'&&nameMatch(f.nome,topScorers[0][0])).length;
    if(sGames>0&&topScorers[0][1]>0)facts.push(`${topScorers[0][0]} marcou em ${Math.round(topScorers[0][1]/sGames*100)}% dos jogos em que foi titular`);
  }
  if(cleanSheets>0)facts.push(`Baliza a zero em ${Math.round(cleanSheets/total*100)}% dos jogos — ${cleanSheets} clean sheet${cleanSheets>1?'s':''}`);
  const lateG=raG.filter((e:any)=>mne(e)>75).length;
  if(lateG>0)facts.push(`${lateG} golo${lateG>1?'s':''} marcado${lateG>1?'s':''} depois do minuto 75`);
  if(home.length>0&&away.length>0&&homeGm>0)facts.push(`Em casa: ${(homeGm/home.length).toFixed(1)} golos/jogo · Fora: ${(awayGm/away.length).toFixed(1)} golos/jogo`);
  const earlyG=raG.filter((e:any)=>mne(e)<=15).length;
  if(earlyG>0)facts.push(`${earlyG} golo${earlyG>1?'s':''} marcado${earlyG>1?'s':''} nos primeiros 15 minutos`);

  return {
    total,wins,draws,losses,pts,gm,gs,cleanSheets,
    home:home.length,homeWins,homeGm,homeGs,
    away:away.length,awayWins,awayGm,awayGs,
    recentForm,bestW,bestU,bestL,goalsByJ,
    gmPhase,gsPhase,topScorers,topAssists,topContribs,
    topMinutes,topGR:byPos('GR'),topDEF:byPos('DEF'),topMED:byPos('MED'),topAV:byPos('AV'),
    topYellows,topReds,mostDisciplined,topSubEntries,
    avgEsp,bestEsp,bestOpp,worstOpp,biggestWin,biggestLoss,highestScoring,
    jogos,cumPoints,gmMinutes,gsMinutes,radarData,facts,
  };
}

const RES_BG={V:'#EEF7F2',E:'#F3F4F6',D:'#FCEBEB'};
const RES_C={V:'#006B3C',E:'#6B7280',D:'#DC2626'};

export default function EquipaPage() {
  const isMobile=useIsMobile();
  const [d,setD]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [animated,setAnimated]=useState(false);

  useEffect(()=>{loadAll().then(r=>{setD(r);setLoading(false);setTimeout(()=>setAnimated(true),100);});},[]);

  if(loading) return <div style={{minHeight:'100vh',background:'#F0F2F5',display:'flex',alignItems:'center',justifyContent:'center',color:'#9CA3AF',fontSize:14}}>A carregar estatísticas…</div>;
  if(!d) return <div style={{minHeight:'100vh',background:'#F0F2F5',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
    <div style={{fontSize:40}}>📊</div>
    <div style={{fontSize:15,fontWeight:700,color:'#374151'}}>Sem dados suficientes</div>
    <Link href="/" style={{fontSize:13,color:'#006B3C',textDecoration:'none',fontWeight:600}}>← Início</Link>
  </div>;

  const pctW=d.total>0?Math.round(d.wins/d.total*100):0;
  const maxSc=d.topScorers[0]?.[1]||1;
  const maxAs=d.topAssists[0]?.[1]||1;
  const maxCo=d.topContribs[0]?.[1]||1;
  const maxMin=d.topMinutes[0]?.mins||1;
  const maxY=d.topYellows[0]?.[1]||1;
  const maxSub=d.topSubEntries[0]?.[1]||1;

  const grid2:React.CSSProperties={display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:12};
  const grid4:React.CSSProperties={display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:8};

  return (
    <div style={{minHeight:'100vh',background:'#F0F2F5'}}>
      <header style={{background:'#fff',borderBottom:'0.5px solid #E4E7EC',position:'sticky',top:0,zIndex:50}}>
        <div style={{maxWidth:860,margin:'0 auto',padding:'0 16px',height:48,display:'flex',alignItems:'center',gap:10}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:4,textDecoration:'none',color:'#6B7280',fontSize:12,fontWeight:600}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 2L4 7l5 5"/></svg>Início
          </Link>
          <span style={{color:'#E4E7EC'}}>·</span>
          <span style={{fontSize:13,fontWeight:700,color:'#111318'}}>Estatísticas da Equipa</span>
        </div>
      </header>

      <main style={{maxWidth:860,margin:'0 auto',padding:isMobile?'10px':'16px',display:'flex',flexDirection:'column',gap:14}}>

        {/* HERO */}
        <div style={{background:'#111318',borderRadius:16,padding:isMobile?'20px 16px':'28px 28px 24px',color:'#fff',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',right:20,top:'50%',transform:'translateY(-50%)',fontSize:120,fontWeight:900,color:'rgba(255,255,255,.03)',lineHeight:1,userSelect:'none'}}>25/26</div>
          <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.35)',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:6}}>Rio Ave FC · Época 2025/26</div>
          <div style={{fontSize:isMobile?22:30,fontWeight:900,letterSpacing:-1,marginBottom:16}}>Estatísticas da Equipa</div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(3,1fr)':'repeat(6,1fr)',gap:isMobile?8:12}}>
            {[['Jogos',d.total],['V',d.wins],['E',d.draws],['D',d.losses],['Pts',d.pts],['CS',d.cleanSheets]].map(([l,v],i)=>(
              <div key={i} style={{textAlign:'center'}}>
                <div style={{fontSize:isMobile?20:26,fontWeight:900,color:l==='V'?'#5CFF9D':l==='D'?'#FF6B6B':l==='CS'?'#5CFF9D':'#fff',lineHeight:1}}>{v}</div>
                <div style={{fontSize:9,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'.08em',marginTop:3}}>{l==='CS'?'Clean Sheets':l}</div>
              </div>
            ))}
          </div>
        </div>


        {/* NÚMEROS QUE SURPREENDEM */}
        {d.facts?.length>0&&<>
          <Sec title="Números que surpreendem"/>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(2,1fr)',gap:10}}>
            {d.facts.slice(0,6).map((f:string,i:number)=>(
              <div key={i} style={{background:'#111318',borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'flex-start',gap:10,
                opacity:animated?1:0,transform:animated?'none':'translateY(12px)',
                transition:`opacity .4s ease ${i*80}ms, transform .4s ease ${i*80}ms`}}>
                <span style={{fontSize:20,flexShrink:0}}>{'💡⚡🎯🔥🛡️⚽'.split('')[i]||'💡'}</span>
                <span style={{fontSize:13,color:'rgba(255,255,255,.85)',lineHeight:1.5,fontWeight:500}}>{f}</span>
              </div>
            ))}
          </div>
        </>}

        {/* FORMA GRÁFICA */}
        {d.cumPoints?.length>0&&<>
          <Sec title="Forma gráfica · pontos acumulados"/>
          <Card>
            {(()=>{
              const pts=d.cumPoints as {j:string;pts:number;res:string}[];
              const maxPts=pts[pts.length-1]?.pts||1;
              const W=580, H=140, PL=36, PR=16, PT=12, PB=28;
              const iW=W-PL-PR, iH=H-PT-PB;
              const xOf=(i:number)=>PL+i/(pts.length-1||1)*iW;
              const yOf=(p:number)=>PT+iH-(p/maxPts)*iH;
              const pathD=pts.map((p,i)=>`${i===0?'M':'L'}${xOf(i).toFixed(1)},${yOf(p.pts).toFixed(1)}`).join(' ');
              const areaD=`${pathD} L${xOf(pts.length-1).toFixed(1)},${(PT+iH).toFixed(1)} L${PL},${(PT+iH).toFixed(1)} Z`;
              const totalLen=pts.length*80;
              return (
                <div style={{overflowX:'auto'}}>
                  <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
                    {/* Y grid lines */}
                    {[0,.25,.5,.75,1].map(p=>{
                      const y=yOf(p*maxPts);
                      return <g key={p}>
                        <line x1={PL} y1={y} x2={W-PR} y2={y} stroke="#F0F2F5" strokeWidth="0.8"/>
                        <text x={PL-4} y={y+4} textAnchor="end" fontSize="9" fill="#9CA3AF">{Math.round(p*maxPts)}</text>
                      </g>;
                    })}
                    {/* Area fill */}
                    <path d={areaD} fill="#006B3C" fillOpacity=".08"
                      style={{opacity:animated?1:0,transition:'opacity .8s ease .3s'}}/>
                    {/* Line */}
                    <path d={pathD} fill="none" stroke="#006B3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray={totalLen} strokeDashoffset={animated?0:totalLen}
                      style={{transition:`stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1) .2s`}}/>
                    {/* Dots */}
                    {pts.map((p,i)=>(
                      <circle key={i} cx={xOf(i)} cy={yOf(p.pts)} r="4"
                        fill={p.res==='V'?'#006B3C':p.res==='E'?'#6B7280':'#DC2626'}
                        stroke="#fff" strokeWidth="1.5"
                        style={{opacity:animated?1:0,transition:`opacity .2s ease ${.4+i*.06}s`}}>
                        <title>{p.j} · {p.pts} pts · {p.res==='V'?'Vitória':p.res==='E'?'Empate':'Derrota'}</title>
                      </circle>
                    ))}
                    {/* X labels - every 5 jornadas */}
                    {pts.filter((_,i)=>i%5===0||i===pts.length-1).map((p,_,arr)=>{
                      const i=pts.indexOf(p);
                      return <text key={i} x={xOf(i)} y={H-4} textAnchor="middle" fontSize="9" fill="#9CA3AF">J{p.j.replace(/[^0-9]/g,'')}</text>;
                    })}
                  </svg>
                  <div style={{display:'flex',gap:12,marginTop:4,fontSize:11,color:'#9CA3AF'}}>
                    {[['#006B3C','Vitória'],['#6B7280','Empate'],['#DC2626','Derrota']].map(([c,l])=>(
                      <span key={l} style={{display:'flex',alignItems:'center',gap:4}}>
                        <span style={{width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}}/>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </Card>
        </>}


        {/* RADAR + MAPA DE CALOR */}
        <Sec title="Perfil da equipa"/>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:12}}>

          {/* RADAR */}
          <Card>
            <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>Radar da equipa</div>
            {(()=>{
              const R=62,CX=90,CY=90;
              const axes=[
                {label:'ATAQUE',  v:d.radarData?.ataque||0, a:-90},
                {label:'EFICÁCIA',v:d.radarData?.eficacia||0,a:-18},
                {label:'PRESENÇA',v:d.radarData?.presenca||0,a:54},
                {label:'DEFESA',  v:d.radarData?.defesa||0, a:126},
                {label:'DISCIPL.',v:d.radarData?.disciplina||0,a:198},
              ];
              const pt=(a:number,r:number)=>{const rad=a*Math.PI/180;return{x:CX+Math.cos(rad)*r,y:CY+Math.sin(rad)*r};};
              const gridPts=(r:number)=>axes.map(ax=>pt(ax.a,r)).map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
              const playerPts=axes.map(ax=>{const p=pt(ax.a,ax.v*R);return`${p.x.toFixed(1)},${p.y.toFixed(1)}`;}).join(' ');
              const zeroPts=axes.map(()=>`${CX},${CY}`).join(' ');
              return (
                <div style={{display:'flex',gap:16,alignItems:'center'}}>
                  <svg width={180} height={180} viewBox="0 0 180 180">
                    <g stroke="#F0F2F5" fill="none" strokeWidth="0.8">
                      {[1,.67,.33].map((s,i)=><polygon key={i} points={gridPts(R*s)}/>)}
                    </g>
                    <g stroke="#E8EAF0" strokeWidth="0.5">
                      {axes.map((ax,i)=>{const p=pt(ax.a,R);return<line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y}/>;  })}
                    </g>
                    <polygon points={animated?playerPts:zeroPts}
                      fill="#006B3C" fillOpacity=".18" stroke="#006B3C" strokeWidth="2" strokeLinejoin="round"
                      style={{transition:'points 1s cubic-bezier(.4,0,.2,1) .3s'}}/>
                    {axes.map((ax,i)=>{
                      const p=pt(ax.a,ax.v*R);
                      const lp=pt(ax.a,R+18);
                      return <g key={i}>
                        <circle cx={animated?p.x:CX} cy={animated?p.y:CY} r="3.5" fill="#006B3C"
                          style={{transition:`cx 1s ease .3s, cy 1s ease .3s`}}/>
                        <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
                          fontSize="8" fill="#9CA3AF" fontWeight="600">{ax.label}</text>
                      </g>;
                    })}
                  </svg>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {axes.map(ax=>(
                      <div key={ax.label} style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'center'}}>
                        <span style={{fontSize:10,color:'#9CA3AF'}}>{ax.label}</span>
                        <span style={{fontSize:12,fontWeight:700,color:'#006B3C'}}>{Math.round(ax.v*100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </Card>

          {/* MAPA DE CALOR */}
          <Card>
            <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>Mapa de calor de golos</div>
            {(()=>{
              const W=220,H=130,gms:number[]=d.gmMinutes||[],gss:number[]=d.gsMinutes||[];
              const allMins=[...gms,...gss];
              const xOf=(min:number)=>12+min/90*(W-24);
              const yOf=(i:number,total:number,arr:number[])=>{
                // spread dots vertically within bands to avoid overlap
                const same=arr.filter(m=>Math.abs(m-arr[i])<3);
                const idx=same.indexOf(arr[i]);
                return H/2+(idx%2===0?1:-1)*(Math.floor(idx/2)+1)*9;
              };
              return (
                <div>
                  <svg width="100%" viewBox={`0 0 ${W+20} ${H+20}`}>
                    {/* Pitch */}
                    <rect x={10} y={5} width={W} height={H} rx="4" fill="#F9FFF9" stroke="#D1E8D1" strokeWidth="1"/>
                    {/* Half line */}
                    <line x1={10+W/2} y1={5} x2={10+W/2} y2={5+H} stroke="#D1E8D1" strokeWidth="0.8" strokeDasharray="3,3"/>
                    {/* Minute axis */}
                    {[0,15,30,45,60,75,90].map(m=>{
                      const x=10+xOf(m);
                      return <g key={m}>
                        <line x1={x} y1={5+H} x2={x} y2={5+H+4} stroke="#C8D5C8" strokeWidth="0.6"/>
                        <text x={x} y={5+H+12} textAnchor="middle" fontSize="7.5" fill="#9CA3AF">{m}&apos;</text>
                      </g>;
                    })}
                    {/* Conceded goals */}
                    {gss.map((min,i)=>{
                      const y=yOf(i,gss.length,gss);
                      return <circle key={`gs${i}`} cx={10+xOf(min)} cy={H/2+5+(y-H/2)*0.4}
                        r="5" fill="#DC2626" fillOpacity=".7" stroke="#fff" strokeWidth="0.8"
                        style={{opacity:animated?1:0,transition:`opacity .3s ease ${.6+i*.12}s`}}>
                        <title>Golo sofrido — {min}&apos;</title>
                      </circle>;
                    })}
                    {/* Scored goals */}
                    {gms.map((min,i)=>{
                      const y=yOf(i,gms.length,gms);
                      return <circle key={`gm${i}`} cx={10+xOf(min)} cy={H/2+5-(y-H/2)*0.4}
                        r="5.5" fill="#006B3C" fillOpacity=".8" stroke="#fff" strokeWidth="0.8"
                        style={{opacity:animated?1:0,transition:`opacity .3s ease ${.4+i*.1}s`}}>
                        <title>Golo marcado — {min}&apos;</title>
                      </circle>;
                    })}
                  </svg>
                  <div style={{display:'flex',gap:12,fontSize:11,color:'#9CA3AF',marginTop:2}}>
                    <span><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#006B3C',marginRight:4}}/>Marcados ({gms.length})</span>
                    <span><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#DC2626',marginRight:4}}/>Sofridos ({gss.length})</span>
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>

        {/* RESULTADOS + FORMA */}
        <Sec title="Resultados"/>
        <div style={grid2}>
          <Card>
            <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>Distribuição de resultados</div>
            <div style={{display:'flex',gap:3,marginBottom:12,height:8}}>
              <div style={{flex:d.wins,background:'#006B3C',borderRadius:'4px 0 0 4px'}}/>
              <div style={{flex:d.draws,background:'#6B7280'}}/>
              <div style={{flex:d.losses,background:'#DC2626',borderRadius:'0 4px 4px 0'}}/>
            </div>
            {[['Vitórias',d.wins,'#006B3C'],[`Empates`,d.draws,'#6B7280'],['Derrotas',d.losses,'#DC2626']].map(([l,v,c])=>(
              <div key={l as string} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0',borderBottom:'1px solid #F3F4F6'}}>
                <span style={{fontSize:12,color:'#374151'}}>{l}</span>
                <span style={{fontSize:13,fontWeight:700,color:c as string}}>{v} <span style={{fontSize:10,fontWeight:400,color:'#9CA3AF'}}>({d.total>0?Math.round((v as number)/d.total*100):0}%)</span></span>
              </div>
            ))}
            <div style={{marginTop:8,display:'flex',gap:12,flexWrap:'wrap'}}>
              <span style={{fontSize:11,color:'#9CA3AF'}}>% vitórias: <strong style={{color:'#006B3C'}}>{pctW}%</strong></span>
              <span style={{fontSize:11,color:'#9CA3AF'}}>Pontos: <strong style={{color:'#374151'}}>{d.pts}</strong></span>
              <span style={{fontSize:11,color:'#9CA3AF'}}>Dif. golos: <strong style={{color:d.gm-d.gs>=0?'#006B3C':'#DC2626'}}>{d.gm-d.gs>0?'+':''}{d.gm-d.gs}</strong></span>
            </div>
          </Card>
          <Card>
            <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>Casa vs Fora</div>
            {[['🏠 Casa',d.homeWins,d.home,d.homeGm,d.homeGs],['✈️ Fora',d.awayWins,d.away,d.awayGm,d.awayGs]].map(([l,w,t,gm,gs])=>(
              <div key={l as string} style={{display:'grid',gridTemplateColumns:'72px 1fr 1fr 1fr 1fr',gap:4,padding:'7px 0',borderBottom:'1px solid #F3F4F6',fontSize:12,alignItems:'center'}}>
                <span style={{fontWeight:600,color:'#374151'}}>{l}</span>
                <span style={{textAlign:'center',color:'#9CA3AF',fontSize:10}}>V: <strong style={{color:'#006B3C'}}>{w}</strong></span>
                <span style={{textAlign:'center',color:'#9CA3AF',fontSize:10}}>J: {t}</span>
                <span style={{textAlign:'center',color:'#006B3C',fontWeight:700}}>{gm}⚽</span>
                <span style={{textAlign:'center',color:'#DC2626',fontWeight:700}}>-{gs}</span>
              </div>
            ))}
            <div style={{marginTop:12}}>
              <div style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>Forma recente</div>
              <div style={{display:'flex',gap:6}}>
                {d.recentForm.map((f:any,i:number)=>(
                  <div key={i} style={{width:32,height:32,borderRadius:8,background:RES_BG[f.r as keyof typeof RES_BG],border:`1.5px solid ${RES_C[f.r as keyof typeof RES_C]}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:RES_C[f.r as keyof typeof RES_C]}} title={f.adv}>
                    {f.r}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* SEQUÊNCIAS */}
        <Card>
          <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>Melhores sequências</div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(3,1fr)':'repeat(3,1fr)',gap:8}}>
            {[['Vitórias seguidas',d.bestW,'#006B3C'],['Sem perder',d.bestU,'#1A5FA8'],['Derrotas seguidas',d.bestL,'#DC2626']].map(([l,v,c])=>(
              <div key={l as string} style={{textAlign:'center',padding:'10px 8px',background:'#F9FAFB',borderRadius:8}}>
                <div style={{fontSize:26,fontWeight:800,color:c as string,lineHeight:1}}>{v}</div>
                <div style={{fontSize:10,color:'#9CA3AF',marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* GOLOS */}
        <Sec title="Golos"/>
        <div style={grid4}>
          <Kpi label="Marcados" value={d.gm} color="#006B3C"/>
          <Kpi label="Sofridos" value={d.gs} color="#DC2626"/>
          <Kpi label="Média/jogo" value={(d.gm/Math.max(d.total,1)).toFixed(1)} color="#006B3C"/>
          <Kpi label="Clean Sheets" value={d.cleanSheets} color="#006B3C" sub={`${d.total>0?Math.round(d.cleanSheets/d.total*100):0}% dos jogos`}/>
        </div>

        <Card>
          <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>Quando marcamos e sofremos?</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,marginBottom:10}}>
            {["1'–30'","31'–60'","61'–90'"].map((lbl,i)=>(
              <div key={i} style={{textAlign:'center',padding:'8px 4px',background:'#F9FAFB',borderRadius:8}}>
                <div style={{fontSize:9,color:'#9CA3AF',marginBottom:4}}>{lbl}</div>
                <div style={{fontSize:18,fontWeight:800,color:'#006B3C'}}>{d.gmPhase[i]}</div>
                <div style={{fontSize:11,color:'#DC2626',fontWeight:600}}>-{d.gsPhase[i]}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:12,fontSize:11,color:'#9CA3AF'}}>
            <span><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'#006B3C',marginRight:4}}/><strong style={{color:'#006B3C'}}>Verde</strong> = marcados</span>
            <span><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'#DC2626',marginRight:4}}/><strong style={{color:'#DC2626'}}>Vermelho</strong> = sofridos</span>
          </div>
        </Card>

        {/* TOP MARCADORES, ASSISTS, CONTRIB */}
        <div style={grid2}>
          <Card>
            <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>⚽ Top marcadores</div>
            {d.topScorers.length?d.topScorers.map(([nome,v]:any,i:number)=>(
              <Bar key={i} label={nome} value={v} max={maxSc}/>
            )):<div style={{fontSize:11,color:'#9CA3AF'}}>Sem dados</div>}
          </Card>
          <Card>
            <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>🅰 Top assistências</div>
            {d.topAssists.length?d.topAssists.map(([nome,v]:any,i:number)=>(
              <Bar key={i} label={nome} value={v} max={maxAs} color="#1A5FA8"/>
            )):<div style={{fontSize:11,color:'#9CA3AF'}}>Sem dados</div>}
          </Card>
        </div>
        <Card>
          <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>🏅 Top contribuições (golos + assistências)</div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(5,1fr)',gap:8}}>
            {d.topContribs.slice(0,5).map(([nome,v]:any,i:number)=>(
              <div key={i} style={{textAlign:'center',padding:'10px 8px',background:'#F9FAFB',borderRadius:8}}>
                <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',marginBottom:2}}>#{i+1}</div>
                <div style={{fontSize:18,fontWeight:800,color:'#006B3C'}}>{v}</div>
                <div style={{fontSize:11,color:'#374151',marginTop:4,lineHeight:1.3}}>{nome}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* UTILIZAÇÃO */}
        <Sec title="Utilização"/>
        <div style={grid2}>
          <Card>
            <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>Top 5 mais utilizados (minutos)</div>
            {d.topMinutes.map((p:any,i:number)=>(
              <Bar key={i} label={p.nome} value={p.mins} max={maxMin} right={`${p.mins}'`}/>
            ))}
          </Card>
          <Card>
            <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>🔄 Mais vezes a entrar do banco</div>
            {d.topSubEntries.length?d.topSubEntries.map(([nome,v]:any,i:number)=>(
              <Bar key={i} label={nome} value={v} max={maxSub} color="#1A5FA8" right={`${v}×`}/>
            )):<div style={{fontSize:11,color:'#9CA3AF'}}>Sem dados</div>}
          </Card>
        </div>
        {/* Top 5 por posição */}
        <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:10}}>
          {[['🧤 GR',d.topGR],['🛡️ DEF',d.topDEF],['⚙️ MED',d.topMED],['⚡ AV',d.topAV]].map(([pos,players]:any)=>(
            <Card key={pos} style={{padding:'12px 14px'}}>
              <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:8}}>{pos}</div>
              {players.length?players.map((p:any,i:number)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0',borderBottom:'1px solid #F3F4F6',fontSize:11}}>
                  <span style={{color:'#374151',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginRight:6}}>{p.nome}</span>
                  <span style={{fontWeight:700,color:'#006B3C',flexShrink:0}}>{p.mins}'</span>
                </div>
              )):<div style={{fontSize:11,color:'#9CA3AF'}}>Sem dados</div>}
            </Card>
          ))}
        </div>

        {/* DISCIPLINA */}
        <Sec title="Disciplina"/>
        <div style={grid2}>
          <Card>
            <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>🟨 Top cartões amarelos</div>
            {d.topYellows.length?d.topYellows.map(([nome,v]:any,i:number)=>(
              <Bar key={i} label={nome} value={v} max={maxY} color="#EF9F27"/>
            )):<div style={{fontSize:11,color:'#9CA3AF'}}>Sem dados</div>}
          </Card>
          <Card>
            <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>🟥 Cartões vermelhos + Mais disciplinados</div>
            {d.topReds.length>0&&<>
              {d.topReds.map(([nome,v]:any,i:number)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid #F3F4F6',fontSize:11}}>
                  <span style={{color:'#374151'}}>{nome}</span>
                  <span style={{fontWeight:700,color:'#DC2626'}}>{v}🟥</span>
                </div>
              ))}
              <div style={{marginTop:10}}/>
            </>}
            <div style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>Sem cartões</div>
            {d.mostDisciplined.length?d.mostDisciplined.map((p:any,i:number)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid #F3F4F6',fontSize:11}}>
                <span style={{color:'#374151'}}>{p.nome}</span>
                <span style={{fontWeight:700,color:'#006B3C'}}>{p.mins}'</span>
              </div>
            )):<div style={{fontSize:11,color:'#9CA3AF'}}>Sem dados suficientes</div>}
          </Card>
        </div>

        {/* ADVERSÁRIOS + RECORDES */}
        <Sec title="Adversários e recordes"/>
        <div style={grid2}>
          <Card>
            <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>Adversários</div>
            {d.bestOpp&&<div style={{padding:'8px 10px',background:'#EEF7F2',borderRadius:8,marginBottom:8}}>
              <div style={{fontSize:10,color:'#006B3C',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:2}}>Adversário favorito</div>
              <div style={{fontSize:13,fontWeight:700,color:'#111318'}}>{d.bestOpp[0]}</div>
              <div style={{fontSize:11,color:'#9CA3AF'}}>{d.bestOpp[1].v}V · {d.bestOpp[1].e}E · {d.bestOpp[1].d}D</div>
            </div>}
            {d.worstOpp&&<div style={{padding:'8px 10px',background:'#FCEBEB',borderRadius:8}}>
              <div style={{fontSize:10,color:'#DC2626',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:2}}>Adversário mais difícil</div>
              <div style={{fontSize:13,fontWeight:700,color:'#111318'}}>{d.worstOpp[0]}</div>
              <div style={{fontSize:11,color:'#9CA3AF'}}>{d.worstOpp[1].v}V · {d.worstOpp[1].e}E · {d.worstOpp[1].d}D</div>
            </div>}
          </Card>
          <Card>
            <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>Recordes de jogo</div>
            {[
              ['Maior vitória', d.biggestWin, '#006B3C'],
              ['Maior derrota', d.biggestLoss, '#DC2626'],
              ['Mais golos', d.highestScoring, '#1A5FA8'],
            ].map(([l,j,c])=>j&&(
              <div key={l as string} style={{padding:'6px 0',borderBottom:'1px solid #F3F4F6'}}>
                <div style={{fontSize:10,color:'#9CA3AF',marginBottom:1}}>{l}</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:12,color:'#374151'}}>{(j as any).adversario} <span style={{color:'#9CA3AF',fontSize:10}}>({fmtDate((j as any).data)})</span></span>
                  <span style={{fontSize:13,fontWeight:800,color:c as string}}>{(j as any).golos_ra}–{(j as any).golos_adv}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* ESPECTADORES */}
        {d.avgEsp>0&&<>
          <Sec title="Espectadores (jogos em casa)"/>
          <div style={grid4}>
            <Kpi label="Média" value={d.avgEsp.toLocaleString('pt-PT')} color="#006B3C"/>
            <Kpi label="Capacidade" value="5 300"/>
            <Kpi label="% Ocupação média" value={`${Math.round(d.avgEsp/5300*100)}%`} color={d.avgEsp/5300>0.7?'#006B3C':'#EF9F27'}/>
            <Kpi label="Jogos em casa" value={d.home}/>
          </div>
          {d.bestEsp&&<Card>
            <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:8}}>Melhor assistência</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:'#111318'}}>{d.bestEsp.adversario}</div>
                <div style={{fontSize:11,color:'#9CA3AF'}}>{fmtDate(d.bestEsp.data)} · Jornada {d.bestEsp.jornada}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:22,fontWeight:800,color:'#006B3C'}}>{d.bestEsp.espectadores?.toLocaleString('pt-PT')}</div>
                <div style={{fontSize:10,color:'#9CA3AF'}}>{Math.round(d.bestEsp.espectadores/5300*100)}% de ocupação</div>
              </div>
            </div>
          </Card>}
        </>}

        <div style={{textAlign:'center',padding:'4px 0 16px',fontSize:11,color:'#B0B5BE'}}>
          Dados coletados por Daniel Silva · Sócio 3883
        </div>
      </main>
    </div>
  );
}
