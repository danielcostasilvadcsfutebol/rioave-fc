'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getFichasEpocaDB } from '@/lib/db';
import type { FichaData, EventoJogo } from '@/lib/mock-jogos-equipa';

function normPos(pos?: string): string {
  if (!pos) return '';
  if (['DD','DC','DE'].includes(pos)) return 'DEF';
  if (['MDC','MI','ME','MAD','MAM','MAE','MC'].includes(pos)) return 'MED';
  return pos;
}

function mn(e: EventoJogo) { return e.minuto + (e.minuto_extra ?? 0); }

function isDoubleYellow(red: EventoJogo, evts: EventoJogo[]): boolean {
  return evts.some(e =>
    e.tipo === 'cartao_amarelo' && e.equipa === red.equipa &&
    e.jogador === red.jogador && e.minuto < red.minuto
  );
}

function computeStats(nome: string, fichas: FichaData[]) {
  const k = nome.trim();
  let numero = 0; let posicao: string | undefined;
  for (const f of fichas) {
    const p = [...f.titulares, ...f.suplentes].find(p => p.nome.trim() === k);
    if (p) { numero = p.numero; posicao = p.posicao; break; }
  }
  if (!numero && !posicao) return null;

  const partidas: any[] = [];
  let jogosTitular=0, jogosSuplente=0, jogosBancoReal=0, minutosJogados=0;
  let golosMarcados=0, assistencias=0, cartoesAmarelos=0, cartoesVermelhos=0;
  let golosSofridosEmCampo=0, golsEquipaEmCampo=0;
  let vitorias=0, empates=0, derrotas=0, vitoriasTitular=0, cleanSheets=0;

  for (const f of fichas) {
    const isTitular = f.titulares.some(p => p.nome.trim() === k);
    const isSuplente = f.suplentes.some(p => p.nome.trim() === k);
    if (!isTitular && !isSuplente) continue;

    const redCard = f.eventos.find(e =>
      e.tipo === 'cartao_vermelho' && e.equipa === 'ra' && e.jogador.trim() === k
    );
    const minExpulsao = redCard ? mn(redCard) : Infinity;

    function calcMins(): number {
      if (isTitular) {
        const saiu = f.eventos.find(e => e.tipo === 'substituicao' && e.equipa === 'ra' && e.jogador.trim() === k);
        return Math.min(saiu ? mn(saiu) : 90, minExpulsao);
      }
      const entrou = f.eventos.find(e => e.tipo === 'substituicao' && e.equipa === 'ra' && e.jogador2?.trim() === k);
      if (!entrou) return 0;
      return Math.min(90, minExpulsao) - mn(entrou);
    }

    // Is player on field at given minute? (arrow fn to avoid hoisting issues)
    const saiuEvt   = isTitular ? f.eventos.find(e => e.tipo === 'substituicao' && e.equipa === 'ra' && e.jogador.trim() === k) : null;
    const entrouEvt = !isTitular ? f.eventos.find(e => e.tipo === 'substituicao' && e.equipa === 'ra' && e.jogador2?.trim() === k) : null;
    const minSaiu   = saiuEvt   ? mn(saiuEvt)   : Infinity;
    const minEntrou = entrouEvt ? mn(entrouEvt)  : null;

    const emCampo = (min: number): boolean => {
      const minFim = Math.min(minSaiu, minExpulsao, 90);
      if (isTitular) return min <= minFim;
      if (minEntrou === null) return false;
      return min >= minEntrou && min <= Math.min(minExpulsao, 90);
    };

    const mins = calcMins();
    if (mins === 0) { jogosBancoReal++; continue; }

    const gm = f.eventos.filter(e => ['golo','golo_penalidade'].includes(e.tipo) && e.equipa === 'ra' && e.jogador.trim() === k).length;
    const ast = f.eventos.filter(e => ['golo','golo_penalidade'].includes(e.tipo) && e.equipa === 'ra' && e.jogador2?.trim() === k).length;
    const yellows = f.eventos.filter(e => e.tipo === 'cartao_amarelo' && e.equipa === 'ra' && e.jogador.trim() === k).length;
    const reds = f.eventos.filter(e => e.tipo === 'cartao_vermelho' && e.equipa === 'ra' && e.jogador.trim() === k);
    const extraYellows = reds.filter(r => isDoubleYellow(r, f.eventos)).length;
    const totalYellows = yellows + extraYellows;
    const gc = f.eventos.filter(e => {
      const isAdvGoal = (e.tipo==='golo'||e.tipo==='golo_penalidade') && e.equipa==='adv';
      const isOwn = e.tipo==='auto_golo' && e.equipa==='ra';
      return (isAdvGoal||isOwn) && emCampo(mn(e));
    }).length;
    const gea = f.eventos.filter(e => ['golo','golo_penalidade'].includes(e.tipo) && e.equipa==='ra' && emCampo(mn(e))).length;

    minutosJogados += mins;
    if (isTitular) { jogosTitular++; if (f.resultado==='V') vitoriasTitular++; } else jogosSuplente++;
    if (f.resultado==='V') vitorias++; else if (f.resultado==='E') empates++; else derrotas++;
    golosMarcados+=gm; assistencias+=ast; cartoesAmarelos+=totalYellows; cartoesVermelhos+=reds.length;
    golosSofridosEmCampo+=gc; golsEquipaEmCampo+=gea;
    if (gc===0) cleanSheets++;

    partidas.push({
      gameId:f.gameId, jornada:f.jornada, data:f.data, adversario:f.adversario,
      local:f.local, resultado:f.resultado, golos_ra:f.golos_ra, golos_adv:f.golos_adv,
      foiTitular:isTitular, minutosJogados:mins,
      golosMarcados:gm, assistencias:ast, cartoesAmarelos:totalYellows, cartoesVermelhos:reds.length,
      golosSofridosEmCampo:gc,
    });
  }

  const jogosTotal = partidas.length;
  const minutosDisponiveis = (jogosTotal + jogosBancoReal) * 90;
  return {
    nome:k, numero, posicao, isGR: posicao==='GR',
    jogosTotal, jogosTitular, jogosSuplente, jogosBanco:jogosBancoReal,
    minutosJogados, minutosDisponiveis,
    golosMarcados, assistencias, contribuicoes:golosMarcados+assistencias,
    cartoesAmarelos, cartoesVermelhos,
    golosSofridosEmCampo, golsEquipaEmCampo,
    diferencaEmCampo:golsEquipaEmCampo-golosSofridosEmCampo,
    cleanSheets, vitorias, empates, derrotas, vitoriasTitular, partidas,
  };
}

function KpiCard({ label, value, sub, color='#111318' }: { label:string; value:string|number; sub?:string; color?:string }) {
  return (
    <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:'14px 10px', textAlign:'center' }}>
      <div style={{ fontSize:24, fontWeight:800, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>{sub}</div>}
      <div style={{ fontSize:9, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', marginTop:4 }}>{label}</div>
    </div>
  );
}

function BarStat({ label, value, max, color='#006B3C' }: { label:string; value:number; max:number; color?:string }) {
  const pct = max>0 ? Math.min(value/max*100,100) : 0;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center', padding:'5px 0', borderBottom:'1px solid #F3F4F6' }}>
      <div>
        <div style={{ fontSize:11, color:'#374151', marginBottom:3 }}>{label}</div>
        <div style={{ height:5, background:'#F0F2F5', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99 }}/>
        </div>
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:'#374151', minWidth:28, textAlign:'right' }}>{value}</div>
    </div>
  );
}

const RES_BG={V:'#EEF7F2',E:'#F3F4F6',D:'#FCEBEB'};
const RES_COLOR={V:'#006B3C',E:'#6B7280',D:'#DC2626'};

export default function JogadorPage() {
  const params = useParams();
  const nome = decodeURIComponent(params.jogador as string ?? '');
  const [fichas, setFichas] = useState<FichaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFichasEpocaDB('25/26').then(data => { setFichas(data); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F0F2F5', color:'#9CA3AF', fontSize:14 }}>
      A carregar…
    </div>
  );

  const s = computeStats(nome, fichas);

  if (!s) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, background:'#F0F2F5' }}>
      <div style={{ fontSize:48 }}>👤</div>
      <div style={{ fontSize:16, fontWeight:700, color:'#374151' }}>Jogador não encontrado</div>
      <Link href="/plantel" style={{ fontSize:13, fontWeight:600, color:'#006B3C', textDecoration:'none' }}>← Voltar ao plantel</Link>
    </div>
  );

  const pctMin = s.minutosDisponiveis>0 ? Math.round(s.minutosJogados/s.minutosDisponiveis*100) : 0;
  const avgMin = s.jogosTotal>0 ? Math.round(s.minutosJogados/s.jogosTotal) : 0;
  const pctV   = s.jogosTotal>0 ? Math.round(s.vitorias/s.jogosTotal*100) : 0;
  const pctVT  = s.jogosTitular>0 ? Math.round(s.vitoriasTitular/s.jogosTitular*100) : 0;
  const pctCS  = s.jogosTotal>0 ? Math.round(s.cleanSheets/s.jogosTotal*100) : 0;
  const minPG  = s.golosMarcados>0 ? Math.round(s.minutosJogados/s.golosMarcados) : null;
  const minPC  = s.golosSofridosEmCampo>0 ? Math.round(s.minutosJogados/s.golosSofridosEmCampo) : null;
  const minPA  = s.cartoesAmarelos>0 ? Math.round(s.minutosJogados/s.cartoesAmarelos) : null;
  const concP90 = s.minutosJogados>0 ? (s.golosSofridosEmCampo/s.minutosJogados*90).toFixed(2) : '0.00';
  const fmtDate = (d:string) => new Date(d+'T00:00:00').toLocaleDateString('pt-PT',{day:'2-digit',month:'2-digit'});

  return (
    <div style={{ minHeight:'100vh', background:'#F0F2F5' }}>
      <header style={{ background:'#fff', borderBottom:'0.5px solid #E4E7EC', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:860, margin:'0 auto', padding:'0 16px', height:48, display:'flex', alignItems:'center', gap:10 }}>
          <Link href="/plantel" style={{ display:'flex', alignItems:'center', gap:4, textDecoration:'none', color:'#6B7280', fontSize:12, fontWeight:600 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 2L4 7l5 5"/></svg>Plantel
          </Link>
          <span style={{ color:'#E4E7EC', fontSize:12 }}>·</span>
          <span style={{ fontSize:13, fontWeight:700, color:'#111318' }}>{s.nome}</span>
          {s.posicao && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, background:'#EEF7F2', color:'#006B3C' }}>{normPos(s.posicao)}</span>}
        </div>
      </header>

      <main style={{ maxWidth:860, margin:'0 auto', padding:'16px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* ── HERO ── */}
        <div style={{ background:'#111318', borderRadius:16, overflow:'hidden', position:'relative', padding:'28px 28px 24px' }}>
          <div style={{ position:'absolute', right:20, top:'50%', transform:'translateY(-50%)', fontSize:140, fontWeight:900, color:'rgba(255,255,255,.04)', lineHeight:1, userSelect:'none', letterSpacing:-8 }}>{s.numero}</div>
          <div style={{ display:'flex', alignItems:'flex-start', gap:20, position:'relative' }}>
            <div style={{ width:64, height:64, borderRadius:14, background:'#006B3C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#fff', flexShrink:0 }}>{s.numero}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,.35)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:4 }}>{normPos(s.posicao)} · Rio Ave FC · 2025/26</div>
              <div style={{ fontSize:30, fontWeight:900, color:'#fff', letterSpacing:-1, lineHeight:1, marginBottom:10 }}>{s.nome}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>{s.jogosTotal} ficha{s.jogosTotal!==1?'s':''} · {s.minutosJogados}' jogados · {pctMin}% dos min. disponíveis</div>
            </div>
            <div style={{ display:'flex', gap:16, flexShrink:0 }}>
              {([['V',s.vitorias,'#5CFF9D'],['E',s.empates,'rgba(255,255,255,.5)'],['D',s.derrotas,'#FF6B6B']] as [string,number,string][]).map(([l,n,c])=>(
                <div key={l} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:28, fontWeight:900, color:c, lineHeight:1 }}>{n}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.1em', marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── PARTICIPAÇÃO ── */}
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Participação</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8 }}>
            <KpiCard label="Fichas" value={s.jogosTotal} sub="na ficha de jogo" color="#006B3C"/>
            <KpiCard label="Titular" value={s.jogosTitular} sub={`${pctVT}% vitórias`}/>
            <KpiCard label="Suplente" value={s.jogosSuplente} sub="entrou em jogo"/>
            <KpiCard label="Banco" value={s.jogosBanco} sub="não entrou"/>
            <KpiCard label="Minutos" value={`${s.minutosJogados}'`} sub={`≈${avgMin}' por jogo`}/>
            <KpiCard label="% Min." value={`${pctMin}%`} sub="dos disponíveis" color={pctMin>=70?'#006B3C':pctMin>=40?'#EF9F27':'#DC2626'}/>
          </div>
        </div>

        {/* ── RENDIMENTO COLECTIVO ── */}
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Rendimento colectivo</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', marginBottom:10 }}>Resultados · {s.jogosTotal} jogos</div>
              <BarStat label="Vitórias" value={s.vitorias} max={s.jogosTotal} color="#006B3C"/>
              <BarStat label="Empates" value={s.empates} max={s.jogosTotal} color="#6B7280"/>
              <BarStat label="Derrotas" value={s.derrotas} max={s.jogosTotal} color="#DC2626"/>
              <div style={{ marginTop:10, display:'flex', gap:10, flexWrap:'wrap' }}>
                <div style={{ fontSize:11, color:'#6B7280' }}>% vitórias total: <strong style={{ color:'#006B3C' }}>{pctV}%</strong></div>
                <div style={{ fontSize:11, color:'#6B7280' }}>% vitórias titular: <strong style={{ color:'#006B3C' }}>{pctVT}%</strong></div>
              </div>
            </div>
            <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', marginBottom:10 }}>Golos em campo</div>
              <BarStat label="Marcados pela equipa" value={s.golsEquipaEmCampo} max={Math.max(s.golsEquipaEmCampo,s.golosSofridosEmCampo,1)} color="#006B3C"/>
              <BarStat label="Sofridos pela equipa" value={s.golosSofridosEmCampo} max={Math.max(s.golsEquipaEmCampo,s.golosSofridosEmCampo,1)} color="#DC2626"/>
              <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:11, color:'#6B7280' }}>Diferença:</span>
                <span style={{ fontSize:16, fontWeight:800, color:s.diferencaEmCampo>=0?'#006B3C':'#DC2626' }}>{s.diferencaEmCampo>0?'+':''}{s.diferencaEmCampo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTRIBUIÇÃO INDIVIDUAL ── */}
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>{s.isGR?'Estatísticas de guarda-redes':'Contribuição individual'}</div>
          {s.isGR ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              <KpiCard label="Golos sofridos" value={s.golosSofridosEmCampo} color="#DC2626"/>
              <KpiCard label="Clean sheets" value={s.cleanSheets} color="#006B3C" sub={`${pctCS}% dos jogos`}/>
              <KpiCard label="Sofridos/90'" value={concP90} sub="média"/>
              <KpiCard label="Min. p/ golo sofrido" value={minPC?`${minPC}'`:'—'} sub={minPC?'minutos':'sem golos'}/>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
              <KpiCard label="Golos" value={s.golosMarcados} color="#006B3C"/>
              <KpiCard label="Assistências" value={s.assistencias} color="#1A5FA8"/>
              <KpiCard label="Contribuições" value={s.contribuicoes} sub="golos + assist"/>
              <KpiCard label="Min. p/ golo" value={minPG?`${minPG}'`:'—'} sub={minPG?'minutos':'sem golos'}/>
              <KpiCard label="GS em campo" value={s.golosSofridosEmCampo} color={s.golosSofridosEmCampo>0?'#DC2626':'#006B3C'}/>
            </div>
          )}
        </div>

        {/* ── DISCIPLINA ── */}
        {(s.cartoesAmarelos>0||s.cartoesVermelhos>0) && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Disciplina</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              <KpiCard label="Amarelos" value={s.cartoesAmarelos} color={s.cartoesAmarelos>0?'#EF9F27':'#9CA3AF'}/>
              <KpiCard label="Vermelhos" value={s.cartoesVermelhos} color={s.cartoesVermelhos>0?'#DC2626':'#9CA3AF'}/>
              <KpiCard label="Min. p/ amarelo" value={minPA?`${minPA}'`:'—'} sub={minPA?'média':'sem amarelos'}/>
            </div>
          </div>
        )}

        {/* ── DETALHE POR FICHA ── */}
        {s.partidas.length>0 && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Detalhe por ficha</div>
            <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'52px 1fr 86px 60px 44px 32px 32px 32px 44px', gap:4, padding:'7px 14px', background:'#F9FAFB', borderBottom:'1px solid #E4E7EC', fontSize:9, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em' }}>
                <div>Data</div><div>Adversário</div><div>Result.</div><div>Particip.</div>
                <div style={{ textAlign:'center' }}>Min</div><div style={{ textAlign:'center' }}>⚽</div>
                <div style={{ textAlign:'center' }}>🅰</div><div style={{ textAlign:'center' }}>🟨</div>
                <div style={{ textAlign:'center' }}>GS</div>
              </div>
              {s.partidas.map((p:any, i:number) => (
                <div key={p.gameId} style={{ display:'grid', gridTemplateColumns:'52px 1fr 86px 60px 44px 32px 32px 32px 44px', gap:4, padding:'10px 14px', borderBottom:i<s.partidas.length-1?'1px solid #F3F4F6':'none', alignItems:'center' }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#F9FAFB'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
                >
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{fmtDate(p.data)}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#111318' }}>{p.adversario}</div>
                    <div style={{ fontSize:10, color:'#9CA3AF' }}>{p.local==='casa'?'Casa':'Fora'} · {p.jornada}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:6, background:RES_BG[p.resultado as keyof typeof RES_BG], color:RES_COLOR[p.resultado as keyof typeof RES_COLOR] }}>{p.resultado}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{p.golos_ra}-{p.golos_adv}</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:6, background:p.foiTitular?'#EEF7F2':'#F3F4F6', color:p.foiTitular?'#006B3C':'#6B7280' }}>{p.foiTitular?'Titular':'Sub'}</span>
                  <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color:'#374151' }}>{p.minutosJogados}&apos;</div>
                  <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color:p.golosMarcados>0?'#006B3C':'#D1D5DB' }}>{p.golosMarcados||'—'}</div>
                  <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color:p.assistencias>0?'#1A5FA8':'#D1D5DB' }}>{p.assistencias||'—'}</div>
                  <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color:p.cartoesAmarelos>0?'#EF9F27':'#D1D5DB' }}>{p.cartoesAmarelos||'—'}</div>
                  <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color:p.golosSofridosEmCampo>0?'#DC2626':'#D1D5DB' }}>{s.isGR?p.golosSofridosEmCampo:(p.golosSofridosEmCampo>0?p.golosSofridosEmCampo:'—')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign:'center', padding:'4px 0 16px', fontSize:11, color:'#B0B5BE' }}>
          Dados coletados por Daniel Silva · Sócio 3883
        </div>
      </main>
    </div>
  );
}
