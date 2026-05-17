'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

function nameMatch(a: string | undefined, b: string): boolean {
  if (!a) return false;
  const ta = a.trim().toLowerCase(), tb = b.trim().toLowerCase();
  return ta === tb || ta.endsWith(' '+tb) || tb.endsWith(' '+ta) ||
         ta.startsWith(tb+' ') || tb.startsWith(ta+' ');
}
function mne(e: any) { return (e.minuto ?? 0) + (e.minuto_extra ?? 0); }
function normPos(p?: string) {
  if (!p) return '';
  if (['DD','DC','DE'].includes(p)) return 'DEF';
  if (['MDC','MI','ME','MAD','MAM','MAE','MC'].includes(p)) return 'MED';
  return p;
}

function KpiCard({ label, value, sub, color='#111318' }: { label:string; value:string|number; sub?:string; color?:string }) {
  return <div style={{background:'#fff',border:'1.5px solid #E4E7EC',borderRadius:12,padding:'14px 10px',textAlign:'center'}}>
    <div style={{fontSize:24,fontWeight:800,color,lineHeight:1}}>{value}</div>
    {sub && <div style={{fontSize:10,color:'#9CA3AF',marginTop:2}}>{sub}</div>}
    <div style={{fontSize:9,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.07em',marginTop:4}}>{label}</div>
  </div>;
}
function BarStat({ label, value, max, color='#006B3C' }: { label:string; value:number; max:number; color?:string }) {
  const p = max > 0 ? Math.min(value/max*100, 100) : 0;
  return <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8,alignItems:'center',padding:'5px 0',borderBottom:'1px solid #F3F4F6'}}>
    <div><div style={{fontSize:11,color:'#374151',marginBottom:3}}>{label}</div>
      <div style={{height:5,background:'#F0F2F5',borderRadius:99,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${p}%`,background:color,borderRadius:99}}/>
      </div>
    </div>
    <div style={{fontSize:13,fontWeight:700,color:'#374151',minWidth:28,textAlign:'right'}}>{value}</div>
  </div>;
}
const RES_BG={V:'#EEF7F2',E:'#F3F4F6',D:'#FCEBEB'};
const RES_COLOR={V:'#006B3C',E:'#6B7280',D:'#DC2626'};

export default function JogadorPage() {
  const params = useParams();
  const nome = decodeURIComponent(params.jogador as string ?? '');
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState<any>(null);

  useEffect(() => {
    if (!nome) return;
    loadStats(nome).then(result => { setS(result); setLoading(false); });
  }, [nome]);

  async function loadStats(playerName: string) {
    // 1. Todos os jogos da época
    const { data: jogos, error: e1 } = await supabase
      .from('jogos').select('*').eq('epoca', '25/26').order('data');
    if (e1 || !jogos?.length) return null;

    // 2. Todas as fichas RA onde o jogador aparece
    const { data: minhasFichas, error: e2 } = await supabase
      .from('fichas_jogo').select('*')
      .eq('equipa', 'ra');
    if (e2 || !minhasFichas) return null;

    const fichasDoJogador = minhasFichas.filter(f => nameMatch(f.nome, playerName));
    if (!fichasDoJogador.length) return null;

    const numero = fichasDoJogador[0].numero;
    const posicao = fichasDoJogador[0].posicao;
    const jogoIds = [...new Set(fichasDoJogador.map(f => f.jogo_id))];

    // 3. Eventos de todos esses jogos
    const { data: todosEvt } = await supabase
      .from('eventos_jogo').select('*')
      .in('jogo_id', jogoIds).order('minuto');

    // 4. Todas as fichas RA desses jogos (para saber titular/suplente)
    const { data: todasFichasJogo } = await supabase
      .from('fichas_jogo').select('*')
      .eq('equipa', 'ra').in('jogo_id', jogoIds);

    const evPorJogo = new Map<string, any[]>();
    const ficPorJogo = new Map<string, any[]>();
    for (const e of (todosEvt ?? [])) {
      if (!evPorJogo.has(e.jogo_id)) evPorJogo.set(e.jogo_id, []);
      evPorJogo.get(e.jogo_id)!.push(e);
    }
    for (const f of (todasFichasJogo ?? [])) {
      if (!ficPorJogo.has(f.jogo_id)) ficPorJogo.set(f.jogo_id, []);
      ficPorJogo.get(f.jogo_id)!.push(f);
    }

    // 5. Calcular stats por jogo
    const partidas: any[] = [];
    let jogosTitular=0,jogosSuplente=0,jogosBanco=0,minutosJogados=0;
    let golosMarcados=0,assistencias=0,cartoesAmarelos=0,cartoesVermelhos=0;
    let golosSofridosEmCampo=0,golsEquipaEmCampo=0;
    let vitorias=0,empates=0,derrotas=0,vitoriasTitular=0,cleanSheets=0;

    for (const jogoId of jogoIds) {
      const jogo = jogos.find(j => j.id === jogoId);
      if (!jogo) continue;

      const ficJogo = ficPorJogo.get(jogoId) ?? [];
      const evJogo  = evPorJogo.get(jogoId)  ?? [];

      const isTitular  = ficJogo.some(f => f.tipo==='titular'  && nameMatch(f.nome, playerName));
      const isSuplente = ficJogo.some(f => f.tipo==='suplente' && nameMatch(f.nome, playerName));
      if (!isTitular && !isSuplente) continue;

      // Expulsão
      const redCard = evJogo.find((e:any) =>
        e.tipo==='cartao_vermelho' && e.equipa==='ra' && nameMatch(e.jogador, playerName)
      );
      const minExp = redCard ? mne(redCard) : Infinity;

      // Sub envolvendo o jogador (em qualquer campo)
      const subEv = evJogo.find((e:any) =>
        e.tipo==='substituicao' && e.equipa==='ra' &&
        (nameMatch(e.jogador, playerName) || nameMatch(e.jogador2, playerName))
      );

      let mins = 0;
      let minEntrou: number|null = null;
      let minSaiu = Infinity;

      if (isTitular) {
        if (subEv) minSaiu = mne(subEv);
        mins = Math.min(minSaiu, minExp, 90);
      } else {
        if (subEv) { minEntrou = mne(subEv); mins = Math.min(90, minExp) - (minEntrou ?? 0); }
      }

      if (mins <= 0) { jogosBanco++; continue; }

      const emCampo = (min: number) => {
        if (min > Math.min(minExp, 90)) return false;
        if (isTitular) return min <= Math.min(minSaiu, minExp, 90);
        return minEntrou !== null && min >= minEntrou && min <= Math.min(minExp, 90);
      };

      const gm  = evJogo.filter((e:any) => ['golo','golo_penalidade'].includes(e.tipo) && e.equipa==='ra' && nameMatch(e.jogador, playerName)).length;
      const ast = evJogo.filter((e:any) => ['golo','golo_penalidade'].includes(e.tipo) && e.equipa==='ra' && nameMatch(e.jogador2, playerName)).length;
      const yl  = evJogo.filter((e:any) => e.tipo==='cartao_amarelo' && e.equipa==='ra' && nameMatch(e.jogador, playerName)).length;
      const reds = evJogo.filter((e:any) => e.tipo==='cartao_vermelho' && e.equipa==='ra' && nameMatch(e.jogador, playerName));
      const extraYl = reds.filter((r:any) => evJogo.some((e:any) => e.tipo==='cartao_amarelo' && e.equipa==='ra' && nameMatch(e.jogador, r.jogador) && e.minuto < r.minuto)).length;
      const gc  = evJogo.filter((e:any) => {
        const isA=(e.tipo==='golo'||e.tipo==='golo_penalidade')&&e.equipa==='adv';
        const isO=e.tipo==='auto_golo'&&e.equipa==='ra';
        return (isA||isO) && emCampo(mne(e));
      }).length;
      const gea = evJogo.filter((e:any) => ['golo','golo_penalidade'].includes(e.tipo)&&e.equipa==='ra'&&emCampo(mne(e))).length;

      minutosJogados+=mins;
      if (isTitular){jogosTitular++;if(jogo.resultado==='V')vitoriasTitular++;}else jogosSuplente++;
      if(jogo.resultado==='V')vitorias++;else if(jogo.resultado==='E')empates++;else derrotas++;
      golosMarcados+=gm;assistencias+=ast;cartoesAmarelos+=yl+extraYl;cartoesVermelhos+=reds.length;
      golosSofridosEmCampo+=gc;golsEquipaEmCampo+=gea;if(gc===0)cleanSheets++;

      partidas.push({
        gameId:jogoId,jornada:jogo.jornada,data:jogo.data,adversario:jogo.adversario,
        local:jogo.local,resultado:jogo.resultado,golos_ra:jogo.golos_ra,golos_adv:jogo.golos_adv,
        foiTitular:isTitular,minutosJogados:mins,
        minEntrou: minEntrou, minSaiu: isTitular && minSaiu < Infinity ? minSaiu : null,
        golosMarcados:gm,assistencias:ast,cartoesAmarelos:yl+extraYl,cartoesVermelhos:reds.length,
        golosSofridosEmCampo:gc,
      });
    }

    // Calcular top 5 companheiros
    const companheiroMap = new Map<string, {nome:string;posicao:string;min:number;jogos:number}>();
    for (const jogoId of jogoIds) {
      const jogo = jogos.find(j => j.id === jogoId);
      if (!jogo) continue;
      const ficJogo = ficPorJogo.get(jogoId) ?? [];
      const evJogo  = evPorJogo.get(jogoId)  ?? [];
      const thisPartida = partidas.find(p => p.gameId === jogoId);
      if (!thisPartida) continue;
      const myStart = thisPartida.foiTitular ? 0 : (thisPartida.minEntrou ?? 0);
      const myEnd   = thisPartida.minSaiu ?? thisPartida.minutosJogados;
      const raFichas = ficJogo.filter(f => f.tipo === 'titular');
      for (const compFicha of raFichas) {
        if (nameMatch(compFicha.nome, playerName)) continue;
        const compName = compFicha.nome.trim();
        const compSub = evJogo.find((e:any) => e.tipo==='substituicao' && e.equipa==='ra' &&
          (nameMatch(e.jogador, compName) || nameMatch(e.jogador2, compName)));
        const compEnd = compSub ? mne(compSub) : 90;
        const overlap = Math.max(0, Math.min(myEnd, compEnd) - Math.max(myStart, 0));
        if (overlap > 0) {
          const prev = companheiroMap.get(compName) ?? {nome:compName, posicao:compFicha.posicao??'', min:0, jogos:0};
          companheiroMap.set(compName, {...prev, min: prev.min+overlap, jogos: prev.jogos+1});
        }
      }
      // Also check bench players who entered
      const bancoComeOn = ficJogo.filter(f => f.tipo === 'suplente').filter(f => {
        const subEv = evJogo.find((e:any) => e.tipo==='substituicao' && e.equipa==='ra' &&
          (nameMatch(e.jogador, f.nome) || nameMatch(e.jogador2, f.nome)));
        return !!subEv;
      });
      for (const compFicha of bancoComeOn) {
        if (nameMatch(compFicha.nome, playerName)) continue;
        const compName = compFicha.nome.trim();
        const compSub = evJogo.find((e:any) => e.tipo==='substituicao' && e.equipa==='ra' &&
          (nameMatch(e.jogador, compName) || nameMatch(e.jogador2, compName)));
        if (!compSub) continue;
        const compStart = mne(compSub);
        const overlap = Math.max(0, Math.min(myEnd, 90) - Math.max(myStart, compStart));
        if (overlap > 0) {
          const prev = companheiroMap.get(compName) ?? {nome:compName, posicao:compFicha.posicao??'', min:0, jogos:0};
          companheiroMap.set(compName, {...prev, min: prev.min+overlap, jogos: prev.jogos+1});
        }
      }
    }
    const top5 = Array.from(companheiroMap.values()).sort((a,b) => b.min-a.min).slice(0,5);

    // Ordenar por jornada decrescente
    partidas.sort((a: any, b: any) => {
      const na = parseInt((a.jornada||'').replace(/[^0-9]/g,'')) || 0;
      const nb = parseInt((b.jornada||'').replace(/[^0-9]/g,'')) || 0;
      return nb - na;
    });
    const jogosTotal=partidas.length;
    const minutosDisponiveis=(jogosTotal+jogosBanco)*90;
    return {
      nome:playerName,numero,posicao,isGR:posicao==='GR',
      jogosTotal,jogosTitular,jogosSuplente,jogosBanco,
      minutosJogados,minutosDisponiveis,
      golosMarcados,assistencias,contribuicoes:golosMarcados+assistencias,
      cartoesAmarelos,cartoesVermelhos,
      golosSofridosEmCampo,golsEquipaEmCampo,
      diferencaEmCampo:golsEquipaEmCampo-golosSofridosEmCampo,
      cleanSheets,vitorias,empates,derrotas,vitoriasTitular,partidas,top5,
    };
  }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F0F2F5',color:'#9CA3AF',fontSize:14}}>A carregar…</div>;
  if (!s) return <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,background:'#F0F2F5'}}>
    <div style={{fontSize:48}}>👤</div><div style={{fontSize:16,fontWeight:700,color:'#374151'}}>Jogador não encontrado</div>
    <Link href="/plantel" style={{fontSize:13,fontWeight:600,color:'#006B3C',textDecoration:'none'}}>← Voltar ao plantel</Link>
  </div>;

  const pctMin=s.minutosDisponiveis>0?Math.round(s.minutosJogados/s.minutosDisponiveis*100):0;
  const avgMin=s.jogosTotal>0?Math.round(s.minutosJogados/s.jogosTotal):0;
  const pctV=s.jogosTotal>0?Math.round(s.vitorias/s.jogosTotal*100):0;
  const pctVT=s.jogosTitular>0?Math.round(s.vitoriasTitular/s.jogosTitular*100):0;
  const pctCS=s.jogosTotal>0?Math.round(s.cleanSheets/s.jogosTotal*100):0;
  const minPG=s.golosMarcados>0?Math.round(s.minutosJogados/s.golosMarcados):null;
  const minPC=s.golosSofridosEmCampo>0?Math.round(s.minutosJogados/s.golosSofridosEmCampo):null;
  const minPA=s.cartoesAmarelos>0?Math.round(s.minutosJogados/s.cartoesAmarelos):null;
  const concP90=s.minutosJogados>0?(s.golosSofridosEmCampo/s.minutosJogados*90).toFixed(2):'0.00';
  const fmtDate=(d:string)=>new Date(d+'T00:00:00').toLocaleDateString('pt-PT',{day:'2-digit',month:'2-digit'});

  return (
    <div style={{minHeight:'100vh',background:'#F0F2F5'}}>
      <header style={{background:'#fff',borderBottom:'0.5px solid #E4E7EC',position:'sticky',top:0,zIndex:50}}>
        <div style={{maxWidth:860,margin:'0 auto',padding:'0 16px',height:48,display:'flex',alignItems:'center',gap:10}}>
          <Link href="/plantel" style={{display:'flex',alignItems:'center',gap:4,textDecoration:'none',color:'#6B7280',fontSize:12,fontWeight:600}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 2L4 7l5 5"/></svg>Plantel
          </Link>
          <span style={{color:'#E4E7EC',fontSize:12}}>·</span>
          <span style={{fontSize:13,fontWeight:700,color:'#111318'}}>{s.nome}</span>
          {s.posicao&&<span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:99,background:'#EEF7F2',color:'#006B3C'}}>{normPos(s.posicao)}</span>}
        </div>
      </header>
      <main style={{maxWidth:860,margin:'0 auto',padding:'16px',display:'flex',flexDirection:'column',gap:14}}>

        {/* HERO */}
        <div style={{background:'#111318',borderRadius:16,overflow:'hidden',position:'relative',padding:'28px 28px 24px'}}>
          <div style={{position:'absolute',right:20,top:'50%',transform:'translateY(-50%)',fontSize:140,fontWeight:900,color:'rgba(255,255,255,.04)',lineHeight:1,userSelect:'none',letterSpacing:-8}}>{s.numero}</div>
          <div style={{display:'flex',alignItems:'flex-start',gap:20,position:'relative'}}>
            <div style={{width:64,height:64,borderRadius:14,background:'#006B3C',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:900,color:'#fff',flexShrink:0}}>{s.numero}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.35)',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:4}}>{normPos(s.posicao)} · Rio Ave FC · 2025/26</div>
              <div style={{fontSize:30,fontWeight:900,color:'#fff',letterSpacing:-1,lineHeight:1,marginBottom:10}}>{s.nome}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>{s.jogosTotal} ficha{s.jogosTotal!==1?'s':''} · {s.minutosJogados}' jogados · {pctMin}% dos min. disponíveis</div>
            </div>
            <div style={{display:'flex',gap:16,flexShrink:0}}>
              {([['V',s.vitorias,'#5CFF9D'],['E',s.empates,'rgba(255,255,255,.5)'],['D',s.derrotas,'#FF6B6B']] as [string,number,string][]).map(([l,n,c])=>(
                <div key={l} style={{textAlign:'center'}}>
                  <div style={{fontSize:28,fontWeight:900,color:c,lineHeight:1}}>{n}</div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'.1em',marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PARTICIPAÇÃO */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Participação</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
            <KpiCard label="Fichas" value={s.jogosTotal} sub="na ficha de jogo" color="#006B3C"/>
            <KpiCard label="Titular" value={s.jogosTitular} sub={`${pctVT}% vitórias`}/>
            <KpiCard label="Suplente" value={s.jogosSuplente} sub="entrou em jogo"/>
            <KpiCard label="Banco" value={s.jogosBanco} sub="não entrou"/>
            <KpiCard label="Minutos" value={`${s.minutosJogados}'`} sub={`≈${avgMin}' por jogo`}/>
            <KpiCard label="% Min." value={`${pctMin}%`} sub="dos disponíveis" color={pctMin>=70?'#006B3C':pctMin>=40?'#EF9F27':'#DC2626'}/>
          </div>
        </div>

        {/* RENDIMENTO */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Rendimento colectivo</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{background:'#fff',border:'1.5px solid #E4E7EC',borderRadius:12,padding:'14px 16px'}}>
              <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>Resultados · {s.jogosTotal} jogos</div>
              <BarStat label="Vitórias" value={s.vitorias} max={s.jogosTotal} color="#006B3C"/>
              <BarStat label="Empates" value={s.empates} max={s.jogosTotal} color="#6B7280"/>
              <BarStat label="Derrotas" value={s.derrotas} max={s.jogosTotal} color="#DC2626"/>
              <div style={{marginTop:10,display:'flex',gap:10,flexWrap:'wrap'}}>
                <div style={{fontSize:11,color:'#6B7280'}}>% vitórias total: <strong style={{color:'#006B3C'}}>{pctV}%</strong></div>
                <div style={{fontSize:11,color:'#6B7280'}}>% vitórias titular: <strong style={{color:'#006B3C'}}>{pctVT}%</strong></div>
              </div>
            </div>
            <div style={{background:'#fff',border:'1.5px solid #E4E7EC',borderRadius:12,padding:'14px 16px'}}>
              <div style={{fontSize:11,fontWeight:600,color:'#9CA3AF',marginBottom:10}}>Golos em campo</div>
              <BarStat label="Marcados pela equipa" value={s.golsEquipaEmCampo} max={Math.max(s.golsEquipaEmCampo,s.golosSofridosEmCampo,1)} color="#006B3C"/>
              <BarStat label="Sofridos pela equipa" value={s.golosSofridosEmCampo} max={Math.max(s.golsEquipaEmCampo,s.golosSofridosEmCampo,1)} color="#DC2626"/>
              <div style={{marginTop:10,display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:11,color:'#6B7280'}}>Diferença:</span>
                <span style={{fontSize:16,fontWeight:800,color:s.diferencaEmCampo>=0?'#006B3C':'#DC2626'}}>{s.diferencaEmCampo>0?'+':''}{s.diferencaEmCampo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTRIBUIÇÃO */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>{s.isGR?'Estatísticas de guarda-redes':'Contribuição individual'}</div>
          {s.isGR ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              <KpiCard label="Golos sofridos" value={s.golosSofridosEmCampo} color="#DC2626"/>
              <KpiCard label="Clean sheets" value={s.cleanSheets} color="#006B3C" sub={`${pctCS}% dos jogos`}/>
              <KpiCard label="Sofridos/90'" value={concP90} sub="média"/>
              <KpiCard label="Min. p/ golo sofrido" value={minPC?`${minPC}'`:'—'} sub={minPC?'minutos':'sem golos'}/>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
              <KpiCard label="Golos" value={s.golosMarcados} color="#006B3C"/>
              <KpiCard label="Assistências" value={s.assistencias} color="#1A5FA8"/>
              <KpiCard label="Contribuições" value={s.contribuicoes} sub="golos + assist"/>
              <KpiCard label="Min. p/ golo" value={minPG?`${minPG}'`:'—'} sub={minPG?'minutos':'sem golos'}/>
              <KpiCard label="GS em campo" value={s.golosSofridosEmCampo} color={s.golosSofridosEmCampo>0?'#DC2626':'#006B3C'}/>
            </div>
          )}
        </div>

        {/* DISCIPLINA */}
        {(s.cartoesAmarelos>0||s.cartoesVermelhos>0)&&(
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Disciplina</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              <KpiCard label="Amarelos" value={s.cartoesAmarelos} color={s.cartoesAmarelos>0?'#EF9F27':'#9CA3AF'}/>
              <KpiCard label="Vermelhos" value={s.cartoesVermelhos} color={s.cartoesVermelhos>0?'#DC2626':'#9CA3AF'}/>
              <KpiCard label="Min. p/ amarelo" value={minPA?`${minPA}'`:'—'} sub={minPA?'média':'sem amarelos'}/>
            </div>
          </div>
        )}

        {/* TOP 5 COMPANHEIROS */}
        {s.partidas.length >= 2 && s.top5 && s.top5.length > 0 && (
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Top 5 · Companheiros com que partilha mais minutos dentro do campo</div>
            <div style={{background:'#fff',border:'1.5px solid #E4E7EC',borderRadius:12,padding:'18px 20px'}}>
              {s.top5.map((p:any,i:number) => (
                <div key={p.nome} style={{marginBottom: i < s.top5.length-1 ? 13 : 0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:11,fontWeight:600,color:'#D1D5DB',minWidth:14}}>{i+1}</span>
                      <span style={{fontSize:13,fontWeight:600,color:'#111318'}}>{p.nome}</span>
                      {p.posicao && <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:99,background:'#EEF7F2',color:'#006B3C'}}>{normPos(p.posicao)}</span>}
                    </div>
                    <div style={{display:'flex',alignItems:'baseline',gap:5}}>
                      <span style={{fontSize:13,fontWeight:700,color:'#006B3C'}}>{p.min}&apos;</span>
                      <span style={{fontSize:10,color:'#9CA3AF'}}>{p.jogos} jogo{p.jogos>1?'s':''}</span>
                    </div>
                  </div>
                  <div style={{height:5,background:'#F0F2F5',borderRadius:99,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.round(p.min/s.top5[0].min*100)}%`,background:'#006B3C',borderRadius:99}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DETALHE POR FICHA */}
        {s.partidas.length>0&&(
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Detalhe por jogo</div>
            <div style={{background:'#fff',border:'1.5px solid #E4E7EC',borderRadius:12,overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'52px 1fr 86px 60px 44px 32px 32px 32px 44px',gap:4,padding:'7px 14px',background:'#F9FAFB',borderBottom:'1px solid #E4E7EC',fontSize:9,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.07em'}}>
                <div>Data</div><div>Adversário</div><div>Result.</div><div>Particip.</div>
                <div style={{textAlign:'center'}}>Min</div><div style={{textAlign:'center'}}>⚽</div>
                <div style={{textAlign:'center'}}>🅰</div><div style={{textAlign:'center'}}>🟨</div>
                <div style={{textAlign:'center'}}>GS</div>
              </div>
              {s.partidas.map((p:any,i:number)=>(
                <div key={p.gameId} style={{display:'grid',gridTemplateColumns:'52px 1fr 86px 60px 44px 32px 32px 32px 44px',gap:4,padding:'10px 14px',borderBottom:i<s.partidas.length-1?'1px solid #F3F4F6':'none',alignItems:'center'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#F9FAFB'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
                >
                  <div style={{fontSize:11,color:'#9CA3AF'}}>{fmtDate(p.data)}</div>
                  <div><div style={{fontSize:13,fontWeight:600,color:'#111318'}}>{p.adversario}</div>
                    <div style={{fontSize:10,color:'#9CA3AF'}}>{p.local==='casa'?'Casa':'Fora'} · Jornada {p.jornada.replace(/[^0-9]/g,'')}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <span style={{fontSize:11,fontWeight:700,padding:'2px 7px',borderRadius:6,background:RES_BG[p.resultado as keyof typeof RES_BG],color:RES_COLOR[p.resultado as keyof typeof RES_COLOR]}}>{p.resultado}</span>
                    <span style={{fontSize:12,fontWeight:600,color:'#374151'}}>{p.golos_ra}-{p.golos_adv}</span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:1}}>
                    <span style={{fontSize:11,fontWeight:600,padding:'2px 7px',borderRadius:6,background:p.foiTitular?'#EEF7F2':'#F3F4F6',color:p.foiTitular?'#006B3C':'#6B7280'}}>{p.foiTitular?'Titular':'Saiu do banco'}</span>
                    {!p.foiTitular && p.minEntrou !== null && <span style={{fontSize:9,color:'#006B3C',paddingLeft:2,fontWeight:600}}>↑ {p.minEntrou}&apos;</span>}
                    {p.foiTitular && p.minSaiu !== null && <span style={{fontSize:9,color:'#DC2626',paddingLeft:2,fontWeight:600}}>↓ {p.minSaiu}&apos;</span>}
                  </div>
                  <div style={{textAlign:'center',fontSize:13,fontWeight:700,color:'#374151'}}>{p.minutosJogados}&apos;</div>
                  <div style={{textAlign:'center',fontSize:13,fontWeight:700,color:p.golosMarcados>0?'#006B3C':'#D1D5DB'}}>{p.golosMarcados||'—'}</div>
                  <div style={{textAlign:'center',fontSize:13,fontWeight:700,color:p.assistencias>0?'#1A5FA8':'#D1D5DB'}}>{p.assistencias||'—'}</div>
                  <div style={{textAlign:'center',fontSize:13,fontWeight:700,color:p.cartoesAmarelos>0?'#EF9F27':'#D1D5DB'}}>{p.cartoesAmarelos||'—'}</div>
                  <div style={{textAlign:'center',fontSize:13,fontWeight:700,color:p.golosSofridosEmCampo>0?'#DC2626':'#D1D5DB'}}>{s.isGR?p.golosSofridosEmCampo:(p.golosSofridosEmCampo>0?p.golosSofridosEmCampo:'—')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{textAlign:'center',padding:'4px 0 16px',fontSize:11,color:'#B0B5BE'}}>
          Dados coletados por Daniel Silva · Sócio 3883
        </div>
      </main>
    </div>
  );
}
