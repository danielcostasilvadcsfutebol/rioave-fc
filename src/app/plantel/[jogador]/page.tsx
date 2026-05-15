'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getPlayerStats } from '@/lib/mock-jogos-equipa';

// ── Mini components ───────────────────────────────────────────
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>{title}</div>
      {children}
    </div>
  );
}

function KpiCard({ label, value, sub, color='#111318', size=24 }: { label:string; value:string|number; sub?:string; color?:string; size?:number }) {
  return (
    <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:'14px 10px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
      <div style={{ fontSize:size, fontWeight:800, color, letterSpacing:'-.5px', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:'#9CA3AF', lineHeight:1.2, marginTop:1 }}>{sub}</div>}
      <div style={{ fontSize:9, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', marginTop:3 }}>{label}</div>
    </div>
  );
}

function BarStat({ label, value, max, color='#006B3C', fmt=(v:number)=>String(v) }: { label:string; value:number; max:number; color?:string; fmt?:(v:number)=>string }) {
  const pct = max > 0 ? Math.min(value/max*100, 100) : 0;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center', padding:'5px 0', borderBottom:'1px solid #F3F4F6' }}>
      <div>
        <div style={{ fontSize:11, color:'#374151', marginBottom:3 }}>{label}</div>
        <div style={{ height:5, background:'#F0F2F5', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99, transition:'width .3s' }}/>
        </div>
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:'#374151', textAlign:'right', minWidth:32 }}>{fmt(value)}</div>
    </div>
  );
}

const RES_BG    = { V:'#EEF7F2', E:'#F3F4F6', D:'#FCEBEB' };
const RES_COLOR = { V:'#006B3C', E:'#6B7280', D:'#DC2626' };

export default function JogadorPage() {
  const params = useParams();
  const nome   = decodeURIComponent(params.jogador as string ?? '');
  const s      = getPlayerStats(nome, '25/26');

  if (!s) return (
    <div style={{ minHeight:'100vh', background:'#F0F2F5', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div style={{ fontSize:40 }}>👤</div>
      <div style={{ fontSize:16, fontWeight:700, color:'#374151' }}>Jogador não encontrado</div>
      <div style={{ fontSize:13, color:'#9CA3AF', marginBottom:8 }}>Não existem dados para &ldquo;{nome}&rdquo;</div>
      <Link href="/plantel" style={{ fontSize:13, fontWeight:600, color:'#006B3C', textDecoration:'none' }}>← Voltar ao plantel</Link>
    </div>
  );

  // Derived metrics
  const pctMin        = s.minutosDisponiveis > 0 ? Math.round(s.minutosJogados/s.minutosDisponiveis*100) : 0;
  const avgMin        = s.jogosTotal > 0 ? Math.round(s.minutosJogados/s.jogosTotal) : 0;
  const pctVitorias   = s.jogosTotal > 0 ? Math.round(s.vitorias/s.jogosTotal*100) : 0;
  const pctVitTitular = s.jogosTitular > 0 ? Math.round(s.vitoriasTitular/s.jogosTitular*100) : 0;
  const pctClean      = s.jogosTotal > 0 ? Math.round(s.cleanSheets/s.jogosTotal*100) : 0;
  const golosPer90    = s.minutosJogados > 0 ? (s.golosMarcados/s.minutosJogados*90).toFixed(2) : '0.00';
  const concPer90     = s.minutosJogados > 0 ? (s.golosSofridosEmCampo/s.minutosJogados*90).toFixed(2) : '0.00';
  const minPerGolo    = s.golosMarcados > 0 ? Math.round(s.minutosJogados/s.golosMarcados) : null;
  const minPerConc    = s.golosSofridosEmCampo > 0 ? Math.round(s.minutosJogados/s.golosSofridosEmCampo) : null;
  const minPerAmarelo = s.cartoesAmarelos > 0 ? Math.round(s.minutosJogados/s.cartoesAmarelos) : null;
  const fmtDate = (d: string) => new Date(d+'T00:00:00').toLocaleDateString('pt-PT',{day:'2-digit',month:'short'});

  return (
    <div style={{ minHeight:'100vh', background:'#F0F2F5' }}>
      {/* Header */}
      <header style={{ background:'#fff', borderBottom:'0.5px solid #E4E7EC', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:820, margin:'0 auto', padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:10 }}>
          <Link href="/plantel" style={{ display:'flex', alignItems:'center', gap:5, textDecoration:'none', color:'#6B7280', fontSize:12, fontWeight:600 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
            Plantel
          </Link>
          <span style={{ color:'#E4E7EC' }}>·</span>
          <div style={{ fontSize:13, fontWeight:700, color:'#111318' }}>{s.nome}</div>
          {s.posicao && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:6, background:'#EEF7F2', color:'#006B3C' }}>{s.posicao}</span>}
        </div>
      </header>

      <main style={{ maxWidth:820, margin:'0 auto', padding:'16px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* ── Hero ─────────────────────────────────────────── */}
        <div style={{ background:'linear-gradient(135deg,#003D20,#005A30)', borderRadius:14, padding:'20px 22px', color:'#fff' }}>
          <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
            <div style={{ width:68, height:68, borderRadius:14, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'rgba(255,255,255,.8)', flexShrink:0 }}>
              {s.numero}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:9, fontWeight:600, color:'rgba(255,255,255,.4)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:3 }}>{s.posicao} · Rio Ave FC · {s.epoca}</div>
              <div style={{ fontSize:28, fontWeight:800, letterSpacing:'-.5px', lineHeight:1 }}>{s.nome}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:4 }}>
                {s.jogosTotal} ficha{s.jogosTotal!==1?'s':''} · {s.minutosJogados}&apos; jogados · {pctMin}% dos min. disponíveis
              </div>
            </div>
            {/* V/E/D */}
            <div style={{ display:'flex', gap:12 }}>
              {([['V',s.vitorias,'#5CFF9D'],['E',s.empates,'rgba(255,255,255,.7)'],['D',s.derrotas,'#FF8080']] as [string,number,string][]).map(([l,n,c])=>(
                <div key={l} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:26, fontWeight:800, color:c, lineHeight:1 }}>{n}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Low data warning */}
        {s.jogosTotal < 4 && (
          <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'8px 14px', fontSize:11, color:'#92400E' }}>
            ⚠️ Apenas {s.jogosTotal} ficha{s.jogosTotal!==1?'s':''} disponível{s.jogosTotal!==1?'is':''}. As estatísticas serão mais representativas à medida que mais fichas forem inseridas.
          </div>
        )}

        {/* ── Participação ────────────────────────────────── */}
        <Block title="Participação">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8 }}>
            <KpiCard label="Fichas" value={s.jogosTotal} sub="na ficha de jogo" color="#006B3C"/>
            <KpiCard label="Titular" value={s.jogosTitular} sub={`${pctVitTitular}% vitórias`}/>
            <KpiCard label="Suplente" value={s.jogosSuplente} sub="entrou em jogo"/>
            <KpiCard label="Banco" value={s.jogosBanco} sub="não entrou"/>
            <KpiCard label="Minutos" value={`${s.minutosJogados}'`} sub={`≈${avgMin}' por jogo`}/>
            <KpiCard label="% Min." value={`${pctMin}%`} sub="dos disponíveis" color={pctMin>=70?'#006B3C':pctMin>=40?'#EF9F27':'#DC2626'}/>
          </div>
        </Block>

        {/* ── Rendimento Colectivo ─────────────────────────── */}
        <Block title="Rendimento colectivo com o jogador em campo">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {/* V/E/D breakdown */}
            <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', marginBottom:10 }}>Resultados · {s.jogosTotal} jogos</div>
              {([['Vitórias',s.vitorias,'#006B3C'],['Empates',s.empates,'#6B7280'],['Derrotas',s.derrotas,'#DC2626']] as [string,number,string][]).map(([l,n,c])=>(
                <BarStat key={l} label={l} value={n} max={s.jogosTotal} color={c}/>
              ))}
              <div style={{ marginTop:10, display:'flex', gap:10, flexWrap:'wrap' }}>
                <div style={{ fontSize:11, color:'#6B7280' }}>% vitórias total: <strong style={{ color:'#006B3C' }}>{pctVitorias}%</strong></div>
                <div style={{ fontSize:11, color:'#6B7280' }}>% vitórias titular: <strong style={{ color:'#006B3C' }}>{pctVitTitular}%</strong></div>
              </div>
            </div>
            {/* Goals in/out */}
            <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', marginBottom:10 }}>Golos em campo</div>
              <BarStat label="Marcados pela equipa" value={s.golsEquipaEmCampo} max={Math.max(s.golsEquipaEmCampo,s.golosSofridosEmCampo,1)} color="#006B3C"/>
              <BarStat label="Sofridos pela equipa"  value={s.golosSofridosEmCampo} max={Math.max(s.golsEquipaEmCampo,s.golosSofridosEmCampo,1)} color="#DC2626"/>
              <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:11, color:'#6B7280' }}>Diferença:</span>
                <span style={{ fontSize:16, fontWeight:800, color: s.diferencaEmCampo>=0?'#006B3C':'#DC2626' }}>
                  {s.diferencaEmCampo>0?'+':''}{s.diferencaEmCampo}
                </span>
                <span style={{ fontSize:10, color:'#9CA3AF' }}>golos</span>
              </div>
            </div>
          </div>
        </Block>

        {/* ── Contribuição Individual ──────────────────────── */}
        <Block title={s.isGR ? 'Estatísticas de guarda-redes' : 'Contribuição individual'}>
          {s.isGR ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              <KpiCard label="Golos sofridos"     value={s.golosSofridosEmCampo} color="#DC2626"/>
              <KpiCard label="Clean sheets"        value={s.cleanSheets}          color="#006B3C" sub={`${pctClean}% dos jogos`}/>
              <KpiCard label="Sofridos / 90 min"  value={concPer90}              sub="média por jogo"/>
              <KpiCard label="Min. p/ golo sofrido" value={minPerConc?`${minPerConc}'`:'—'} sub={minPerConc?'minutos':'sem golos sofridos'}/>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
              <KpiCard label="Golos"        value={s.golosMarcados}  color="#006B3C"/>
              <KpiCard label="Assistências" value={s.assistencias}   color="#1A5FA8"/>
              <KpiCard label="Contribuições" value={s.contribuicoes} sub="golos + assist" color={s.contribuicoes>0?'#5B34C0':'#9CA3AF'}/>
              <KpiCard label="Min. p/ golo" value={minPerGolo?`${minPerGolo}'`:'—'} sub={minPerGolo?`${golosPer90}/90'`:'sem golos'}/>
              <KpiCard label="GS em campo"  value={s.golosSofridosEmCampo} color={s.golosSofridosEmCampo>0?'#DC2626':'#006B3C'} sub="sofridos enquanto jogava"/>
            </div>
          )}
        </Block>

        {/* ── Disciplina ───────────────────────────────────── */}
        <Block title="Disciplina">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            <KpiCard label="Amarelos"          value={s.cartoesAmarelos}  color={s.cartoesAmarelos>0?'#EF9F27':'#9CA3AF'}/>
            <KpiCard label="Vermelhos"         value={s.cartoesVermelhos} color={s.cartoesVermelhos>0?'#DC2626':'#9CA3AF'}/>
            <KpiCard label="Min. p/ amarelo"   value={minPerAmarelo?`${minPerAmarelo}'`:'—'} sub={minPerAmarelo?'média entre cartões':'sem amarelos'}/>
          </div>
        </Block>

        {/* ── Ficha por jogo ───────────────────────────────── */}
        {s.partidas.length > 0 && (
          <Block title={`Detalhe por ficha de jogo · ${s.partidas.length} jogo${s.partidas.length!==1?'s':''}`}>
            <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, overflow:'hidden' }}>
              {/* Header */}
              <div style={{ display:'grid', gridTemplateColumns:'52px 1fr 86px 60px 44px 32px 32px 32px 44px', gap:6, padding:'7px 14px', background:'#F9FAFB', borderBottom:'1px solid #E4E7EC', fontSize:9, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em' }}>
                <div>Data</div><div>Adversário</div><div>Resultado</div><div>Participou</div>
                <div style={{ textAlign:'center' }}>Min</div>
                <div style={{ textAlign:'center' }}>⚽</div>
                <div style={{ textAlign:'center' }}>🅰</div>
                <div style={{ textAlign:'center' }}>🟨</div>
                <div style={{ textAlign:'center' }}>GS</div>
              </div>
              {s.partidas.map((p, i) => (
                <div key={p.gameId} style={{ display:'grid', gridTemplateColumns:'52px 1fr 86px 60px 44px 32px 32px 32px 44px', gap:6, padding:'10px 14px', borderBottom:i<s.partidas.length-1?'1px solid #F3F4F6':'none', alignItems:'center' }}>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{fmtDate(p.data)}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#111318' }}>{p.adversario}</div>
                    <div style={{ fontSize:10, color:'#9CA3AF' }}>{p.local==='casa'?'Casa':'Fora'} · {p.jornada}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:6, background:RES_BG[p.resultado], color:RES_COLOR[p.resultado] }}>
                      {p.resultado}
                    </span>
                    <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{p.golos_ra}–{p.golos_adv}</span>
                  </div>
                  <div>
                    <span style={{ fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:6, background:p.foiTitular?'#EEF7F2':'#F3F4F6', color:p.foiTitular?'#006B3C':'#6B7280' }}>
                      {p.foiTitular?'Titular':'Suplente'}
                    </span>
                  </div>
                  <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color:'#374151' }}>{p.minutosJogados}&apos;</div>
                  <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color:p.golosMarcados>0?'#006B3C':'#D1D5DB' }}>
                    {p.golosMarcados||'—'}
                  </div>
                  <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color:p.assistencias>0?'#1A5FA8':'#D1D5DB' }}>
                    {p.assistencias||'—'}
                  </div>
                  <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color:p.cartoesAmarelos>0?'#EF9F27':(p.cartoesVermelhos>0?'#DC2626':'#D1D5DB') }}>
                    {p.cartoesAmarelos>0?p.cartoesAmarelos:(p.cartoesVermelhos>0?'🟥':'—')}
                  </div>
                  <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color:p.golosSofridosEmCampo>0?'#DC2626':'#006B3C' }}>
                    {s.isGR ? p.golosSofridosEmCampo : (p.golosSofridosEmCampo>0?p.golosSofridosEmCampo:'—')}
                  </div>
                </div>
              ))}
              {/* Footer totals */}
              <div style={{ display:'grid', gridTemplateColumns:'52px 1fr 86px 60px 44px 32px 32px 32px 44px', gap:6, padding:'8px 14px', background:'#F9FAFB', borderTop:'1.5px solid #E4E7EC', fontSize:11, fontWeight:700, color:'#374151' }}>
                <div/>
                <div style={{ color:'#9CA3AF' }}>Totais</div>
                <div style={{ display:'flex', gap:5 }}>
                  <span style={{ fontSize:10, color:'#006B3C' }}>{s.vitorias}V</span>
                  <span style={{ fontSize:10, color:'#6B7280' }}>{s.empates}E</span>
                  <span style={{ fontSize:10, color:'#DC2626' }}>{s.derrotas}D</span>
                </div>
                <div/>
                <div style={{ textAlign:'center', color:'#374151' }}>{s.minutosJogados}&apos;</div>
                <div style={{ textAlign:'center', color:'#006B3C' }}>{s.golosMarcados||'—'}</div>
                <div style={{ textAlign:'center', color:'#1A5FA8' }}>{s.assistencias||'—'}</div>
                <div style={{ textAlign:'center', color:'#EF9F27' }}>{s.cartoesAmarelos||'—'}</div>
                <div style={{ textAlign:'center', color:s.golosSofridosEmCampo>0?'#DC2626':'#006B3C' }}>{s.golosSofridosEmCampo}</div>
              </div>
            </div>
          </Block>
        )}

        <div style={{ textAlign:'center', padding:'4px 0 16px', fontSize:11, color:'#B0B5BE' }}>
          Dados coletados por Daniel Silva · Sócio 3883
        </div>
      </main>
    </div>
  );
}
