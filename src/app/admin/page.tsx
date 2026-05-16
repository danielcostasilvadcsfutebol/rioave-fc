'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';

const ADMIN_PASSWORD = 'rioave2025';
const TIPOS_EVENTO = ['golo','golo_penalidade','auto_golo','cartao_amarelo','cartao_vermelho','segundo_amarelo','substituicao'];
const POSICOES = ['GR','DEF','MED','AV'];
const STATS_COLS = [
  ['posse_bola','% Posse de bola'],['remates','Remates'],['remates_baliza','Remates à baliza'],
  ['remates_poste','Remates ao poste'],['grandes_oportunidades','Grandes oportunidades'],
  ['assistencias','Assistências'],['cruzamentos','Cruzamentos'],['cantos','Cantos'],
  ['livres','Livres'],['ataques','Ataques'],['ataques_centro','Ataques pelo centro'],
  ['ataques_esquerda','Ataques pela esquerda'],['ataques_direita','Ataques pela direita'],
  ['defesas','Defesas'],['penaltis','Penáltis'],['penaltis_defendidos','Penáltis defendidos'],
  ['foras_jogo','Foras de jogo'],['faltas','Faltas'],['amarelos','Amarelos'],['vermelhos','Vermelhos'],
];

type Tab = 'jogos'|'eventos'|'fichas'|'stats';

function toast(msg: string, ok = true) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `position:fixed;bottom:20px;right:20px;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;color:#fff;background:${ok?'#006B3C':'#DC2626'};z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.2)`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

export default function AdminPage() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [jogos, setJogos] = useState<Record<string,unknown>[]>([]);
  const [sel, setSel] = useState<string>('');
  const [tab, setTab] = useState<Tab>('eventos');
  const [eventos, setEventos] = useState<Record<string,unknown>[]>([]);
  const [fichas, setFichas] = useState<Record<string,unknown>[]>([]);
  const [stats, setStats] = useState<Record<string,unknown>>({});
  const [loading, setLoading] = useState(false);

  // New event form
  const [newEv, setNewEv] = useState({ minuto:'', minuto_extra:'', tipo:'golo', equipa:'ra', jogador:'', jogador2:'', score_ra:'', score_adv:'' });
  // New ficha form
  const [newFicha, setNewFicha] = useState({ tipo:'titular', equipa:'ra', numero:'', nome:'', posicao:'', capitao:false });
  // Edit jogo form
  const [jogoEdit, setJogoEdit] = useState<Record<string,unknown>>({});

  useEffect(() => {
    if (!auth) return;
    supabase.from('jogos')
      .select('id,jornada,data,adversario,local,golos_ra,golos_adv,resultado,has_detail,espectadores,formacao_ra,formacao_adv,arbitro,hora,estadio')
      .order('data',{ascending:false})
      .then(({data, error}) => {
        if (error) { alert('Erro Supabase: ' + error.message); return; }
        setJogos(data ?? []);
        if (!data?.length) alert('Sem dados. URL: ' + process.env.NEXT_PUBLIC_SUPABASE_URL);
      });
  }, [auth]);

  useEffect(() => {
    if (!sel || !auth) return;
    setLoading(true);
    const jogo = jogos.find(j => j.id === sel);
    setJogoEdit(jogo ? {...jogo} : {});
    Promise.all([
      supabase.from('eventos_jogo').select('*').eq('jogo_id',sel).order('ordem'),
      supabase.from('fichas_jogo').select('*').eq('jogo_id',sel).order('ordem'),
      supabase.from('estatisticas_jogo').select('*').eq('jogo_id',sel).single(),
    ]).then(([evRes, fcRes, stRes]) => {
      setEventos(evRes.data??[]);
      setFichas(fcRes.data??[]);
      setStats(stRes.data??{});
      setLoading(false);
    });
  }, [sel]);

  if (!auth) return (
    <div style={{ minHeight:'100vh', background:'#F0F2F5', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:16, padding:40, width:320, textAlign:'center' }}>
        <div style={{ fontSize:28, marginBottom:8 }}>🔐</div>
        <div style={{ fontSize:18, fontWeight:700, color:'#111318', marginBottom:4 }}>Admin</div>
        <div style={{ fontSize:12, color:'#9CA3AF', marginBottom:20 }}>Rio Ave FC · Estatísticas</div>
        <input type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter' && pw===ADMIN_PASSWORD) setAuth(true); }}
          style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E4E7EC', borderRadius:8, fontSize:14, marginBottom:10, boxSizing:'border-box' as const }}/>
        <button onClick={() => { if (pw===ADMIN_PASSWORD) setAuth(true); else toast('Password errada',false); }}
          style={{ width:'100%', padding:'10px', background:'#006B3C', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
          Entrar
        </button>
      </div>
    </div>
  );

  const selJogo = jogos.find(j => j.id === sel);
  const inp = (val: string, onChange: (v:string)=>void, placeholder='', w='100%'): React.ReactNode => (
    <input value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width:w, padding:'6px 8px', border:'1px solid #E4E7EC', borderRadius:6, fontSize:12, boxSizing:'border-box' as const }}/>
  );
  const sel2 = (val: string, opts: string[], onChange: (v:string)=>void): React.ReactNode => (
    <select value={val} onChange={e => onChange(e.target.value)}
      style={{ padding:'6px 8px', border:'1px solid #E4E7EC', borderRadius:6, fontSize:12 }}>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  async function saveEvento() {
    if (!newEv.jogador || !sel) return;
    const maxOrdem = Math.max(0, ...eventos.map(e => Number(e.ordem)||0));
    // 2º amarelo é inserido como cartao_vermelho (a UI detecta automaticamente)
    const tipoFinal = newEv.tipo === 'segundo_amarelo' ? 'cartao_vermelho' : newEv.tipo;
    const { error } = await supabase.from('eventos_jogo').insert({
      jogo_id: sel, minuto: Number(newEv.minuto), minuto_extra: newEv.minuto_extra?Number(newEv.minuto_extra):null,
      tipo: tipoFinal, equipa: newEv.equipa, jogador: newEv.jogador,
      jogador2: newEv.jogador2||null,
      score_ra: newEv.score_ra?Number(newEv.score_ra):null,
      score_adv: newEv.score_adv?Number(newEv.score_adv):null,
      ordem: maxOrdem + 1,
    });
    if (error) { toast('Erro: '+error.message, false); return; }
    // Auto-marca o jogo como tendo dados detalhados
    await supabase.from('jogos').update({ has_detail: true }).eq('id', sel);
    setJogos(prev => prev.map(j => j.id===sel ? {...j, has_detail:true} : j));
    toast('Evento adicionado');
    setNewEv({ minuto:'', minuto_extra:'', tipo:'golo', equipa:'ra', jogador:'', jogador2:'', score_ra:'', score_adv:'' });
    const { data } = await supabase.from('eventos_jogo').select('*').eq('jogo_id',sel).order('ordem');
    setEventos(data??[]);
  }

  async function deleteEvento(id: string) {
    await supabase.from('eventos_jogo').delete().eq('id',id);
    setEventos(ev => ev.filter(e => e.id !== id));
    toast('Evento eliminado');
  }

  async function saveFicha() {
    if (!newFicha.nome || !sel) return;
    const maxOrdem = Math.max(0, ...fichas.filter(f => f.equipa===newFicha.equipa && f.tipo===newFicha.tipo).map(f => Number(f.ordem)||0));
    const { error } = await supabase.from('fichas_jogo').insert({
      jogo_id: sel, equipa: newFicha.equipa, tipo: newFicha.tipo,
      numero: Number(newFicha.numero), nome: newFicha.nome,
      posicao: newFicha.posicao||null, capitao: newFicha.capitao,
      ordem: maxOrdem + 1,
    });
    if (error) { toast('Erro: '+error.message, false); return; }
    await supabase.from('jogos').update({ has_detail: true }).eq('id', sel);
    setJogos(prev => prev.map(j => j.id===sel ? {...j, has_detail:true} : j));
    toast('Jogador adicionado');
    setNewFicha({ tipo:'titular', equipa:'ra', numero:'', nome:'', posicao:'', capitao:false });
    const { data } = await supabase.from('fichas_jogo').select('*').eq('jogo_id',sel).order('ordem');
    setFichas(data??[]);
  }

  async function deleteFicha(id: string) {
    await supabase.from('fichas_jogo').delete().eq('id',id);
    setFichas(fc => fc.filter(f => f.id !== id));
    toast('Jogador eliminado');
  }

  async function saveStats() {
    const { error } = await supabase.from('estatisticas_jogo').upsert({ ...stats, jogo_id: sel });
    if (error) toast('Erro: '+error.message, false);
    else toast('Estatísticas guardadas');
  }

  async function saveJogo() {
    const { error } = await supabase.from('jogos').update({
      hora: jogoEdit.hora, adversario: jogoEdit.adversario,
      golos_ra: Number(jogoEdit.golos_ra), golos_adv: Number(jogoEdit.golos_adv),
      resultado: jogoEdit.resultado, espectadores: jogoEdit.espectadores?Number(jogoEdit.espectadores):null,
      estadio: jogoEdit.estadio||null, formacao_ra: jogoEdit.formacao_ra||null,
      formacao_adv: jogoEdit.formacao_adv||null, arbitro: jogoEdit.arbitro||null,
      has_detail: jogoEdit.has_detail,
    }).eq('id', sel);
    if (error) toast('Erro: '+error.message, false);
    else { toast('Jogo guardado'); const { data } = await supabase.from('jogos').select('*').order('data',{ascending:false}); setJogos(data??[]); }
  }

  const tabBtn = (t: Tab, label: string) => (
    <button onClick={() => setTab(t)} style={{ padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:600, border:'1.5px solid', cursor:'pointer',
      borderColor: tab===t?'#006B3C':'#E4E7EC', background: tab===t?'#006B3C':'#fff', color: tab===t?'#fff':'#6B7280' }}>
      {label}
    </button>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#F0F2F5' }}>
      <header style={{ background:'#fff', borderBottom:'0.5px solid #E4E7EC', padding:'0 20px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/" style={{ fontSize:12, color:'#6B7280', textDecoration:'none' }}>← Site</Link>
          <span style={{ fontSize:14, fontWeight:700, color:'#111318' }}>⚙️ Admin · Rio Ave FC</span>
        </div>
        <button onClick={() => setAuth(false)} style={{ fontSize:12, color:'#DC2626', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Sair</button>
      </header>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'16px', display:'grid', gridTemplateColumns:'280px 1fr', gap:16 }}>

        {/* Sidebar: lista de jogos */}
        <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:12, height:'fit-content' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10 }}>Jogos</div>
          {jogos.map(j => (
            <div key={j.id as string} onClick={() => setSel(j.id as string)}
              style={{ padding:'8px 10px', borderRadius:8, cursor:'pointer', marginBottom:4,
                background: sel===j.id?'#006B3C':'transparent',
                color: sel===j.id?'#fff':'#374151' }}>
              <div style={{ fontSize:12, fontWeight:600 }}>{j.jornada as string} · {j.adversario as string}</div>
              <div style={{ fontSize:10, opacity:.7 }}>{j.data as string} · {j.golos_ra as number}-{j.golos_adv as number} {j.resultado as string}</div>
            </div>
          ))}
        </div>

        {/* Main: editor */}
        <div>
          {!sel ? (
            <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:40, textAlign:'center', color:'#9CA3AF' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>←</div>
              <div style={{ fontSize:14 }}>Seleciona um jogo para editar</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {/* Jogo header */}
              <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:'#111318' }}>{selJogo?.jornada as string} · {selJogo?.adversario as string}</div>
                  <div style={{ fontSize:12, color:'#9CA3AF' }}>{selJogo?.data as string} · {selJogo?.local as string} · {selJogo?.golos_ra as number}-{selJogo?.golos_adv as number}</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <>{tabBtn('jogos','Info')}{tabBtn('eventos','Eventos')}{tabBtn('fichas','Fichas')}{tabBtn('stats','Stats')}</>
                </div>
              </div>

              {loading && <div style={{ textAlign:'center', padding:20, color:'#9CA3AF' }}>A carregar…</div>}

              {/* ── Info do jogo ── */}
              {!loading && tab==='jogos' && (
                <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:12 }}>Editar dados do jogo</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
                    {[['adversario','Adversário'],['hora','Hora'],['estadio','Estádio'],['formacao_ra','Formação RA'],['formacao_adv','Formação ADV'],['arbitro','Árbitro']].map(([k,l]) => (
                      <div key={k}>
                        <div style={{ fontSize:10, color:'#9CA3AF', marginBottom:3 }}>{l}</div>
                        {inp(String(jogoEdit[k]??''), v => setJogoEdit(p=>({...p,[k]:v})))}
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
                    {[['golos_ra','Golos RA'],['golos_adv','Golos ADV'],['espectadores','Espect.']].map(([k,l]) => (
                      <div key={k}>
                        <div style={{ fontSize:10, color:'#9CA3AF', marginBottom:3 }}>{l}</div>
                        {inp(String(jogoEdit[k]??''), v => setJogoEdit(p=>({...p,[k]:v})), '', '100%')}
                      </div>
                    ))}
                    <div>
                      <div style={{ fontSize:10, color:'#9CA3AF', marginBottom:3 }}>Resultado</div>
                      {sel2(String(jogoEdit.resultado??'E'), ['V','E','D'], v => setJogoEdit(p=>({...p,resultado:v})))}
                    </div>
                  </div>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#374151', marginBottom:12, cursor:'pointer' }}>
                    <input type="checkbox" checked={Boolean(jogoEdit.has_detail)} onChange={e => setJogoEdit(p=>({...p,has_detail:e.target.checked}))}/>
                    Tem dados detalhados (events/fichas/stats)
                  </label>
                  <button onClick={saveJogo} style={{ padding:'8px 16px', background:'#006B3C', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    Guardar jogo
                  </button>
                </div>
              )}

              {/* ── Eventos ── */}
              {!loading && tab==='eventos' && (
                <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:10 }}>Eventos · {eventos.length}</div>
                  {/* Existing events */}
                  {eventos.map(ev => (
                    <div key={ev.id as string} style={{ display:'grid', gridTemplateColumns:'40px 90px 60px 1fr 1fr auto', gap:6, alignItems:'center', padding:'6px 0', borderBottom:'1px solid #F3F4F6', fontSize:12 }}>
                      <span style={{ fontWeight:700, color:'#6B7280' }}>{ev.minuto as number}{ev.minuto_extra?`+${ev.minuto_extra}`:''}&apos;</span>
                      <span style={{ background:ev.equipa==='ra'?'#EEF7F2':'#FCEBEB', color:ev.equipa==='ra'?'#006B3C':'#DC2626', padding:'2px 6px', borderRadius:4, fontSize:11, fontWeight:600 }}>{ev.tipo as string}</span>
                      <span style={{ fontSize:10, color:'#9CA3AF' }}>{ev.equipa as string}</span>
                      <span style={{ fontWeight:600 }}>{ev.jogador as string}</span>
                      <span style={{ color:'#9CA3AF' }}>{ev.jogador2 as string ?? ''}{ev.score_ra!=null?` ${ev.score_ra}-${ev.score_adv}`:''}</span>
                      <button onClick={() => deleteEvento(ev.id as string)} style={{ padding:'3px 8px', background:'#FCEBEB', color:'#DC2626', border:'none', borderRadius:4, cursor:'pointer', fontSize:11, fontWeight:600 }}>✕</button>
                    </div>
                  ))}
                  {/* Add event form */}
                  <div style={{ marginTop:14, padding:'12px', background:'#F9FAFB', borderRadius:8 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:8 }}>+ Adicionar evento</div>
                    <div style={{ display:'grid', gridTemplateColumns:'60px 60px 1fr 60px 1fr 1fr 55px 55px', gap:6, alignItems:'end' }}>
                      <div>{inp(newEv.minuto, v=>setNewEv(p=>({...p,minuto:v})), 'Min')}</div>
                      <div>{inp(newEv.minuto_extra, v=>setNewEv(p=>({...p,minuto_extra:v})), 'Extra')}</div>
                      <div>{sel2(newEv.tipo, TIPOS_EVENTO, v=>setNewEv(p=>({...p,tipo:v})))}</div>
                      <div>{sel2(newEv.equipa, ['ra','adv'], v=>setNewEv(p=>({...p,equipa:v})))}</div>
                      <div>{inp(newEv.jogador, v=>setNewEv(p=>({...p,jogador:v})), 'Jogador')}</div>
                      <div>{inp(newEv.jogador2, v=>setNewEv(p=>({...p,jogador2:v})), 'Jogador 2')}</div>
                      <div>{inp(newEv.score_ra, v=>setNewEv(p=>({...p,score_ra:v})), 'RA')}</div>
                      <div>{inp(newEv.score_adv, v=>setNewEv(p=>({...p,score_adv:v})), 'ADV')}</div>
                    </div>
                    <button onClick={saveEvento} style={{ marginTop:8, padding:'7px 14px', background:'#006B3C', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      Adicionar
                    </button>
                  </div>
                </div>
              )}

              {/* ── Fichas ── */}
              {!loading && tab==='fichas' && (
                <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:10 }}>Fichas de jogo · {fichas.length} jogadores</div>
                  {['titular','suplente'].map(tipo => (
                    ['ra','adv'].map(equipa => {
                      const list = fichas.filter(f => f.tipo===tipo && f.equipa===equipa);
                      if (!list.length && tipo==='suplente') return null;
                      return (
                        <div key={`${equipa}-${tipo}`} style={{ marginBottom:12 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>
                            {equipa==='ra'?'Rio Ave':'Adversário'} · {tipo}
                          </div>
                          {list.map(f => (
                            <div key={f.id as string} style={{ display:'grid', gridTemplateColumns:'36px 1fr 60px auto', gap:6, alignItems:'center', padding:'4px 0', borderBottom:'1px solid #F9FAFB', fontSize:12 }}>
                              <span style={{ fontWeight:700, color:'#9CA3AF' }}>#{f.numero as number}</span>
                              <span>{f.nome as string}{f.capitao?' (C)':''}</span>
                              <span style={{ color:'#9CA3AF', fontSize:10 }}>{f.posicao as string ?? ''}</span>
                              <button onClick={() => deleteFicha(f.id as string)} style={{ padding:'2px 7px', background:'#FCEBEB', color:'#DC2626', border:'none', borderRadius:4, cursor:'pointer', fontSize:11 }}>✕</button>
                            </div>
                          ))}
                        </div>
                      );
                    })
                  ))}
                  {/* Add ficha */}
                  <div style={{ marginTop:12, padding:12, background:'#F9FAFB', borderRadius:8 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:8 }}>+ Adicionar jogador</div>
                    <div style={{ display:'grid', gridTemplateColumns:'70px 70px 50px 1fr 80px auto', gap:6, alignItems:'end' }}>
                      <div>{sel2(newFicha.equipa, ['ra','adv'], v=>setNewFicha(p=>({...p,equipa:v})))}</div>
                      <div>{sel2(newFicha.tipo, ['titular','suplente'], v=>setNewFicha(p=>({...p,tipo:v})))}</div>
                      <div>{inp(newFicha.numero, v=>setNewFicha(p=>({...p,numero:v})), '#')}</div>
                      <div>{inp(newFicha.nome, v=>setNewFicha(p=>({...p,nome:v})), 'Nome')}</div>
                      <div>{sel2(newFicha.posicao, ['',...POSICOES], v=>setNewFicha(p=>({...p,posicao:v})))}</div>
                      <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, cursor:'pointer' }}>
                        <input type="checkbox" checked={newFicha.capitao} onChange={e=>setNewFicha(p=>({...p,capitao:e.target.checked}))}/>C
                      </label>
                    </div>
                    <button onClick={saveFicha} style={{ marginTop:8, padding:'7px 14px', background:'#006B3C', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      Adicionar
                    </button>
                  </div>
                </div>
              )}

              {/* ── Estatísticas ── */}
              {!loading && tab==='stats' && (
                <div style={{ background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:12 }}>Estatísticas · RA vs ADV</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px', gap:1, marginBottom:4, fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase' }}>
                    <span>Estatística</span><span style={{ textAlign:'center' }}>RA</span><span style={{ textAlign:'center' }}>ADV</span>
                  </div>
                  {STATS_COLS.map(([key,label]) => (
                    <div key={key} style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px', gap:4, alignItems:'center', padding:'3px 0', borderBottom:'1px solid #F9FAFB' }}>
                      <span style={{ fontSize:12, color:'#374151' }}>{label}</span>
                      <input type="number" value={String(stats[`${key}_ra`]??'')} onChange={e => setStats(p=>({...p,[`${key}_ra`]:Number(e.target.value)}))}
                        style={{ padding:'4px 6px', border:'1px solid #E4E7EC', borderRadius:4, fontSize:12, textAlign:'center' }}/>
                      <input type="number" value={String(stats[`${key}_adv`]??'')} onChange={e => setStats(p=>({...p,[`${key}_adv`]:Number(e.target.value)}))}
                        style={{ padding:'4px 6px', border:'1px solid #E4E7EC', borderRadius:4, fontSize:12, textAlign:'center' }}/>
                    </div>
                  ))}
                  <button onClick={saveStats} style={{ marginTop:14, padding:'8px 18px', background:'#006B3C', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    Guardar estatísticas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
