'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getPlayerStats } from '@/lib/mock-jogos-equipa';

function StatBox({ label, value, sub, color = '#111318' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:'14px 12px', textAlign:'center' }}>
      <div style={{ fontSize:24, fontWeight:800, color, letterSpacing:'-.5px', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>{sub}</div>}
      <div style={{ fontSize:10, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', marginTop:4 }}>{label}</div>
    </div>
  );
}

const RES_COLOR = { V:'#006B3C', E:'#6B7280', D:'#DC2626' };
const RES_BG    = { V:'#EEF7F2', E:'#F3F4F6', D:'#FCEBEB' };
const RES_LABEL = { V:'V', E:'E', D:'D' };

export default function JogadorPage() {
  const params = useParams();
  const nome   = decodeURIComponent(params.jogador as string ?? '');
  const stats  = getPlayerStats(nome, '25/26');

  if (!stats) return (
    <div style={{ minHeight:'100vh', background:'#F0F2F5', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div style={{ fontSize:40 }}>👤</div>
      <div style={{ fontSize:16, fontWeight:700, color:'#374151' }}>Jogador não encontrado</div>
      <div style={{ fontSize:13, color:'#9CA3AF' }}>Não existem dados para &ldquo;{nome}&rdquo;</div>
      <Link href="/plantel" style={{ fontSize:13, fontWeight:600, color:'#006B3C', textDecoration:'none', marginTop:8 }}>← Voltar ao plantel</Link>
    </div>
  );

  const { jogosTitular, jogosSuplente, jogosTotal, minutosJogados, vitorias, empates, derrotas, vitoriasTitular,
    golosMarcados, assistencias, cartoesAmarelos, cartoesVermelhos, golosSofridosEmCampo, isGR, posicao } = stats;

  const pctVitorias  = jogosTotal > 0 ? Math.round(vitorias / jogosTotal * 100) : 0;
  const pctVitTitular = jogosTitular > 0 ? Math.round(vitoriasTitular / jogosTitular * 100) : 0;
  const minPerGoal   = golosMarcados > 0 ? Math.round(minutosJogados / golosMarcados) : null;
  const goalsPer90   = minutosJogados > 0 ? (golosMarcados / minutosJogados * 90).toFixed(2) : '—';
  const concPerGame  = jogosTotal > 0 ? (golosSofridosEmCampo / jogosTotal).toFixed(2) : '—';
  const minPerConc   = golosSofridosEmCampo > 0 ? Math.round(minutosJogados / golosSofridosEmCampo) : null;
  const cleanSheets  = stats.partidas.filter(p => p.golosSofridosEmCampo === 0).length;

  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', { day:'2-digit', month:'short' });

  return (
    <div style={{ minHeight:'100vh', background:'#F0F2F5' }}>
      {/* Header */}
      <header style={{ background:'#fff', borderBottom:'0.5px solid #E4E7EC', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:760, margin:'0 auto', padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:10 }}>
          <Link href="/plantel" style={{ display:'flex', alignItems:'center', gap:5, textDecoration:'none', color:'#6B7280', fontSize:12, fontWeight:600 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 3L5 8l5 5"/></svg>
            Plantel
          </Link>
          <span style={{ color:'#E4E7EC' }}>·</span>
          <div style={{ fontSize:13, fontWeight:700, color:'#111318' }}>{stats.nome}</div>
          {posicao && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:6, background:'#EEF7F2', color:'#006B3C' }}>{posicao}</span>}
        </div>
      </header>

      <main style={{ maxWidth:760, margin:'0 auto', padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>

        {/* Hero */}
        <div style={{ background:'linear-gradient(135deg,#003D20,#005A30)', borderRadius:14, padding:'20px 22px', color:'#fff', display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ width:64, height:64, borderRadius:14, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:800, color:'rgba(255,255,255,.8)', flexShrink:0 }}>
            {stats.numero}
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:600, color:'rgba(255,255,255,.4)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:4 }}>
              {posicao} · Rio Ave FC · {stats.epoca}
            </div>
            <div style={{ fontSize:26, fontWeight:800, letterSpacing:'-.5px' }}>{stats.nome}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:3 }}>
              {jogosTotal} jogo{jogosTotal!==1?'s':''} · {minutosJogados}' jogados
            </div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
            <div style={{ display:'flex', gap:6 }}>
              {([['V',vitorias,'#5CFF9D'],['E',empates,'rgba(255,255,255,.6)'],['D',derrotas,'#FF8080']] as [string,number,string][]).map(([l,n,c]) => (
                <div key={l} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:c, lineHeight:1 }}>{n}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,.4)' }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:2 }}>{pctVitorias}% vitórias</div>
          </div>
        </div>

        {/* Notice if few games */}
        {jogosTotal < 3 && (
          <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'8px 14px', fontSize:11, color:'#92400E' }}>
            ⚠️ Apenas {jogosTotal} ficha{jogosTotal!==1?'s':''} disponível{jogosTotal!==1?'is':''}. As estatísticas serão mais representativas à medida que mais fichas forem inseridas.
          </div>
        )}

        {/* Participation stats */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Participação</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            <StatBox label="Jogos"    value={jogosTotal}    sub={`${jogosTitular}T + ${jogosSuplente}S`} color="#006B3C"/>
            <StatBox label="Titular"  value={jogosTitular}  sub={`${pctVitTitular}% vitórias titular`}/>
            <StatBox label="Suplente" value={jogosSuplente} sub="entrou em jogo"/>
            <StatBox label="Minutos"  value={`${minutosJogados}'`} sub={`≈${(minutosJogados/Math.max(jogosTotal,1)).toFixed(0)}' por jogo`}/>
          </div>
        </div>

        {/* GK vs Field player stats */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>
            {isGR ? 'Golos sofridos' : 'Contribuição ofensiva'}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {isGR ? (
              <>
                <StatBox label="Golos sofridos"   value={golosSofridosEmCampo} color="#DC2626"/>
                <StatBox label="Média p/ jogo"    value={concPerGame} sub="golos sofridos"/>
                <StatBox label="Min. p/ golo sofrido" value={minPerConc ? `${minPerConc}'` : '—'} sub={minPerConc ? 'minutos' : 'sem dados'} />
                <StatBox label="Jogos s/ sofrer"  value={cleanSheets} sub={`${jogosTotal > 0 ? Math.round(cleanSheets/jogosTotal*100) : 0}% dos jogos`} color="#006B3C"/>
              </>
            ) : (
              <>
                <StatBox label="Golos"         value={golosMarcados} color="#006B3C"/>
                <StatBox label="Assistências"  value={assistencias}  color="#1A5FA8"/>
                <StatBox label="Min. p/ golo"  value={minPerGoal ? `${minPerGoal}'` : '—'} sub={golosMarcados ? `${goalsPer90} por 90'` : 'sem golos'}/>
                <StatBox label="Gls sofridos"  value={golosSofridosEmCampo} sub="em campo" color="#DC2626"/>
              </>
            )}
          </div>
        </div>

        {/* Discipline */}
        {(cartoesAmarelos > 0 || cartoesVermelhos > 0) && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Disciplina</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
              <StatBox label="Cartões amarelos" value={cartoesAmarelos}  color="#EF9F27"/>
              <StatBox label="Cartões vermelhos" value={cartoesVermelhos} color="#DC2626"/>
            </div>
          </div>
        )}

        {/* Games list */}
        {stats.partidas.length > 0 && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Fichas disponíveis</div>
            <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, overflow:'hidden' }}>
              {/* Headers */}
              <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 80px 60px 50px 50px', gap:8, padding:'7px 14px', background:'#F9FAFB', borderBottom:'1px solid #E4E7EC', fontSize:9, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em' }}>
                <div>Data</div><div>Adversário</div><div>Resultado</div><div>Particip.</div>
                <div style={{ textAlign:'center' }}>Min.</div>
                <div style={{ textAlign:'center' }}>{isGR ? 'Sofreu' : 'Golos'}</div>
              </div>
              {stats.partidas.map((p, i) => (
                <div key={p.gameId} style={{ display:'grid', gridTemplateColumns:'60px 1fr 80px 60px 50px 50px', gap:8, padding:'10px 14px', borderBottom:i<stats.partidas.length-1?'1px solid #F3F4F6':'none', alignItems:'center' }}>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{fmtDate(p.data)}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#111318' }}>{p.adversario}</div>
                    <div style={{ fontSize:10, color:'#9CA3AF' }}>{p.local==='casa'?'Casa':'Fora'} · {p.jornada}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:6, background:RES_BG[p.resultado], color:RES_COLOR[p.resultado] }}>{RES_LABEL[p.resultado]}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{p.golos_ra}-{p.golos_adv}</span>
                  </div>
                  <div style={{ fontSize:11, fontWeight:600, color: p.foiTitular ? '#006B3C' : '#6B7280', background: p.foiTitular ? '#EEF7F2' : '#F3F4F6', padding:'2px 7px', borderRadius:6, display:'inline-block' }}>
                    {p.foiTitular ? 'Titular' : 'Sub'}
                  </div>
                  <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color:'#374151' }}>{p.minutosJogados}&apos;</div>
                  <div style={{ textAlign:'center', fontSize:13, fontWeight:700, color: isGR ? (p.golosSofridosEmCampo>0?'#DC2626':'#006B3C') : (p.golosMarcados>0?'#006B3C':'#9CA3AF') }}>
                    {isGR ? p.golosSofridosEmCampo : (p.golosMarcados > 0 ? `⚽×${p.golosMarcados}` : (p.assistencias > 0 ? `🅰×${p.assistencias}` : '—'))}
                  </div>
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
