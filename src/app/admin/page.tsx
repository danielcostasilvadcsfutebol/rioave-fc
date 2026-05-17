'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';

const ADMIN_PASSWORD = 'rioave2025';
const TIPOS_EVENTO = ['golo','golo_penalidade','auto_golo','cartao_amarelo','cartao_vermelho','segundo_amarelo','substituicao'];
const POSICOES_RA = ['GR','DEF','MED','AV'];
const STATS_COLS = [
  ['posse_bola','% Posse de bola'],['remates','Remates'],['remates_baliza','Remates à baliza'],
  ['remates_poste','Remates ao poste'],['grandes_oportunidades','Grandes oportunidades'],
  ['assistencias','Assistências'],['cruzamentos','Cruzamentos'],['cantos','Cantos'],
  ['livres','Livres'],['ataques','Ataques'],['ataques_centro','Ataques pelo centro'],
  ['ataques_esquerda','Ataques pela esquerda'],['ataques_direita','Ataques pela direita'],
  ['defesas','Defesas'],['penaltis','Penáltis'],['penaltis_defendidos','Penáltis defendidos'],
  ['foras_jogo','Foras de jogo'],['faltas','Faltas'],['amarelos','Amarelos'],['vermelhos','Vermelhos'],
];

type MainTab = 'jogos' | 'plantel';
type GameTab = 'info' | 'eventos' | 'fichas' | 'stats';

function toast(msg: string, ok = true) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `position:fixed;bottom:20px;right:20px;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;color:#fff;background:${ok?'#006B3C':'#DC2626'};z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.2)`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── Autocomplete component ────────────────────────────────────
function PlayerAC({ value, onChange, players, placeholder = 'Jogador', width = '100%' }: {
  value: string; onChange: (v: string) => void; players: string[]; placeholder?: string; width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = value.length > 0
    ? players.filter(p => p.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : players.slice(0, 8);

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width }}>
      <input value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '6px 8px', border: '1px solid #E4E7EC', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' as const }}
      />
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E4E7EC', borderRadius: 6, zIndex: 200, boxShadow: '0 4px 12px rgba(0,0,0,.1)', maxHeight: 200, overflowY: 'auto' }}>
          {filtered.map(p => (
            <div key={p} onMouseDown={() => { onChange(p); setOpen(false); }}
              style={{ padding: '7px 10px', cursor: 'pointer', fontSize: 12, color: '#111318' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#EEF7F2'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >{p}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [mainTab, setMainTab] = useState<MainTab>('jogos');

  // Jogadores state
  const [jogadoresRA, setJogadoresRA] = useState<Record<string,unknown>[]>([]);  // RA players for selected epoch
  const [allJogadores, setAllJogadores] = useState<Record<string,unknown>[]>([]); // all players for plantel tab
  const [epocaPlantel, setEpocaPlantel] = useState('25/26');
  const [newJogador, setNewJogador] = useState({ nome: '', posicao: 'DEF', numero: '', epoca: '25/26' });

  // Jogos state
  const [jogos, setJogos] = useState<Record<string,unknown>[]>([]);
  const [sel, setSel] = useState('');
  const [gameTab, setGameTab] = useState<GameTab>('eventos');
  const [eventos, setEventos] = useState<Record<string,unknown>[]>([]);
  const [fichas, setFichas] = useState<Record<string,unknown>[]>([]);
  const [stats, setStats] = useState<Record<string,unknown>>({});
  const [jogoEdit, setJogoEdit] = useState<Record<string,unknown>>({});
  const [loading, setLoading] = useState(false);

  // Épocas disponíveis (dinâmico)
  const [epocas, setEpocas] = useState(['25/26','24/25','23/24','22/23']);
  const [novaEpoca, setNovaEpoca] = useState('');

  // Plantel edit state
  const [editingJogador, setEditingJogador] = useState<string|null>(null); // jogador_id being edited
  const [editForm, setEditForm] = useState({ nome: '', posicao: 'DEF', numero: '', ativo: true, emprestado: false, data_nascimento: '', contrato_ate: '', nacionalidade: '', mes_chegada: '', epoca_chegada: '', data_saida: '' });
  const [addEpocaFor, setAddEpocaFor] = useState<string|null>(null); // jogador_id to add epoch
  const [addEpocaForm, setAddEpocaForm] = useState({ epoca: '25/26', numero: '' });

  // New game form
  const [showNewJogo, setShowNewJogo] = useState(false);
  const [newJogo, setNewJogo] = useState({
    epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic',
    jornada:'', data:'', hora:'20:30', local:'casa', adversario:'',
    golos_ra:'0', golos_adv:'0', resultado:'E',
    espectadores:'', estadio:'', formacao_ra:'', formacao_adv:'', arbitro:''
  });

  // Form state
  const [newEv, setNewEv] = useState({ minuto: '', minuto_extra: '', tipo: 'golo', equipa: 'ra', jogador: '', jogador2: '', score_ra: '', score_adv: '' });
  const [newFicha, setNewFicha] = useState({ tipo: 'titular', equipa: 'ra', numero: '', nome: '', posicao: '', capitao: false });

  const selJogo = jogos.find(j => j.id === sel);
  const jogoEpoca = (selJogo?.epoca as string) ?? '25/26';

  // Load on auth
  // Extrai número da jornada: "J3" → 3, "J33" → 33
  function jornadaNum(j: string): number {
    const m = j?.match(/\d+/);
    return m ? parseInt(m[0]) : 0;
  }

  useEffect(() => {
    if (!auth) return;
    supabase.from('jogos').select('id,jornada,data,adversario,local,golos_ra,golos_adv,resultado,has_detail,espectadores,formacao_ra,formacao_adv,arbitro,hora,estadio,epoca').order('data', { ascending: false })
      .then(({ data }) => {
        // Ordena por número da jornada decrescente
        const sorted = (data ?? []).sort((a: any, b: any) => jornadaNum(b.jornada) - jornadaNum(a.jornada));
        setJogos(sorted);
      });
    supabase.from('jogadores').select('id,nome_display,posicao,data_nascimento,contrato_ate,nacionalidade').order('nome_display')
      .then(({ data }) => setAllJogadores(data ?? []));
  }, [auth]);

  // Reload RA players whenever selected game changes (epoch may differ)
  useEffect(() => {
    if (!auth) return;
    const epoca = (jogos.find(j => j.id === sel)?.epoca as string) ?? '25/26';
    supabase.from('jogadores_epoca')
      .select('numero, ativo, jogadores(id, nome_display, posicao)')
      .eq('epoca', epoca)
      .eq('ativo', true)
      .order('numero')
      .then(({ data }) => setJogadoresRA((data ?? []).map((r: any) => ({ ...r.jogadores, numero: r.numero, ativo: r.ativo }))));
  }, [auth, sel, jogos]);

  // Load game detail
  useEffect(() => {
    if (!sel || !auth) return;
    const jogo = jogos.find(j => j.id === sel);
    setJogoEdit(jogo ? { ...jogo } : {});
    setLoading(true);
    Promise.all([
      supabase.from('eventos_jogo').select('*').eq('jogo_id', sel).order('minuto').order('minuto_extra', { ascending: true, nullsFirst: true }),
      supabase.from('fichas_jogo').select('*').eq('jogo_id', sel).order('ordem'),
      supabase.from('estatisticas_jogo').select('*').eq('jogo_id', sel).single(),
    ]).then(([evRes, fcRes, stRes]) => {
      setEventos(evRes.data ?? []);
      setFichas(fcRes.data ?? []);
      setStats(stRes.data ?? {});
      setLoading(false);
    });
  }, [sel]);

  // Plantel tab: load players for selected epoch
  const [jogadoresEpoca, setJogadoresEpoca] = useState<Record<string,unknown>[]>([]);
  useEffect(() => {
    if (!auth) return;
    supabase.from('jogadores_epoca').select('numero, ativo, emprestado, data_saida, mes_chegada, epoca_chegada, jogadores(id, nome_display, posicao, data_nascimento, contrato_ate, nacionalidade)').eq('epoca', epocaPlantel).order('numero')
      .then(({ data }) => setJogadoresEpoca((data ?? []).map((r: any) => ({ ...r.jogadores, numero: r.numero, ativo: r.ativo }))));
  }, [auth, epocaPlantel]);

  const raNames = jogadoresRA.map(j => j.nome_display as string);
  // For ADV events, suggest from current game's ADV fichas
  const advNames = fichas.filter(f => f.equipa === 'adv').map(f => f.nome as string);

  if (!auth) return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 16, padding: 40, width: 320, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔐</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#111318', marginBottom: 4 }}>Admin</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Rio Ave FC · Estatísticas</div>
        <input type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && pw === ADMIN_PASSWORD) setAuth(true); }}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E4E7EC', borderRadius: 8, fontSize: 14, marginBottom: 10, boxSizing: 'border-box' as const }} />
        <button onClick={() => { if (pw === ADMIN_PASSWORD) setAuth(true); else toast('Password errada', false); }}
          style={{ width: '100%', padding: 10, background: '#006B3C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Entrar
        </button>
      </div>
    </div>
  );

  // ── CRUD helpers ─────────────────────────────────────────────
  async function updateJogador() {
    if (!editingJogador || !editForm.nome) return;

    // Update jogadores table
    const { error: e1 } = await supabase.from('jogadores').update({
      nome_display: editForm.nome,
      posicao: editForm.posicao,
      data_nascimento: editForm.data_nascimento || null,
      contrato_ate: editForm.contrato_ate || null,
      nacionalidade: editForm.nacionalidade || null,
    }).eq('id', editingJogador);
    if (e1) { toast('Erro ao guardar jogador: ' + e1.message, false); return; }

    // Update jogadores_epoca — one single call with all fields
    const { error: e2 } = await supabase.from('jogadores_epoca').update({
      numero: Number(editForm.numero),
      ativo: editForm.ativo,
      emprestado: editForm.emprestado || false,
      mes_chegada: editForm.mes_chegada || null,
      epoca_chegada: editForm.epoca_chegada || null,
      data_saida: editForm.data_saida || null,
    }).eq('jogador_id', editingJogador).eq('epoca', epocaPlantel);
    if (e2) { toast('Erro ao guardar época: ' + e2.message, false); return; }

    toast('Jogador actualizado');
    setEditingJogador(null);

    // Reload both lists — include all columns in the mapping
    const { data } = await supabase.from('jogadores_epoca')
      .select('numero, ativo, data_saida, mercado, epoca_chegada, jogadores(id, nome_display, posicao, data_nascimento, contrato_ate, nacionalidade)')
      .eq('epoca', epocaPlantel).order('numero');
    setJogadoresEpoca((data ?? []).map((r: any) => ({
      ...(r.jogadores ?? {}),
      numero: r.numero,
      ativo: r.ativo,
      emprestado: r.emprestado || false,
      mes_chegada: r.mes_chegada,
      epoca_chegada: r.epoca_chegada,
      data_saida: r.data_saida,
    })));
    const { data: all } = await supabase.from('jogadores')
      .select('id,nome_display,posicao,data_nascimento,contrato_ate,nacionalidade').order('nome_display');
    setAllJogadores(all ?? []);
  }

  async function deleteJogadorFromEpoca(jogadorId: string, epoca: string) {
    if (!confirm('Remover jogador desta época?')) return;
    await supabase.from('jogadores_epoca').delete().eq('jogador_id', jogadorId).eq('epoca', epoca);
    setJogadoresEpoca(prev => prev.filter(j => j.id !== jogadorId));
    toast('Jogador removido da época');
  }

  async function deleteJogadorCompletely(jogadorId: string, nome: string) {
    if (!confirm(`Apagar ${nome} de TODAS as épocas? Esta acção é irreversível.`)) return;
    await supabase.from('jogadores_epoca').delete().eq('jogador_id', jogadorId);
    await supabase.from('jogadores').delete().eq('id', jogadorId);
    setJogadoresEpoca(prev => prev.filter(j => j.id !== jogadorId));
    setAllJogadores(prev => prev.filter(j => j.id !== jogadorId));
    toast('Jogador apagado completamente');
  }

  async function addEpocaToJogador() {
    if (!addEpocaFor || !addEpocaForm.numero) return;
    const { error } = await supabase.from('jogadores_epoca').upsert(
      { jogador_id: addEpocaFor, epoca: addEpocaForm.epoca, numero: Number(addEpocaForm.numero), ativo: true },
      { onConflict: 'jogador_id,epoca' }
    );
    if (error) { toast('Erro: ' + error.message, false); return; }
    toast(`Época ${addEpocaForm.epoca} adicionada`);
    setAddEpocaFor(null);
    setAddEpocaForm({ epoca: '25/26', numero: '' });
    if (addEpocaForm.epoca === epocaPlantel) {
      const { data } = await supabase.from('jogadores_epoca').select('numero, ativo, emprestado, data_saida, mes_chegada, epoca_chegada, jogadores(id, nome_display, posicao, data_nascimento, contrato_ate, nacionalidade)').eq('epoca', epocaPlantel).order('numero');
      setJogadoresEpoca((data ?? []).map((r: any) => ({ ...(r.jogadores ?? {}), numero: r.numero, ativo: r.ativo, mercado: r.mercado, epoca_chegada: r.epoca_chegada, data_saida: r.data_saida })));
    }
  }

  async function deleteJogo() {
    if (!sel || !selJogo) return;
    if (!confirm(`Apagar "${selJogo.jornada} · ${selJogo.adversario}"? Esta acção apaga também todos os eventos, fichas e estatísticas.`)) return;
    await supabase.from('eventos_jogo').delete().eq('jogo_id', sel);
    await supabase.from('fichas_jogo').delete().eq('jogo_id', sel);
    await supabase.from('estatisticas_jogo').delete().eq('jogo_id', sel);
    const { error } = await supabase.from('jogos').delete().eq('id', sel);
    if (error) { toast('Erro ao apagar: ' + error.message, false); return; }
    toast('Jogo apagado');
    setSel('');
    const { data } = await supabase.from('jogos').select('id,jornada,data,adversario,local,golos_ra,golos_adv,resultado,has_detail,espectadores,formacao_ra,formacao_adv,arbitro,hora,estadio,epoca').order('data', { ascending: false });
    const sorted = (data ?? []).sort((a: any, b: any) => jornadaNum(b.jornada) - jornadaNum(a.jornada));
    setJogos(sorted);
  }

  async function createJogo() {
    if (!newJogo.jornada || !newJogo.adversario || !newJogo.data) {
      toast('Preenche jornada, adversário e data', false); return;
    }
    const epoca_id = newJogo.epoca.replace('/','-');
    const jornada_id = newJogo.jornada.replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
    const id = `${epoca_id}-${jornada_id}-${Date.now().toString(36)}`;
    const { error } = await supabase.from('jogos').insert({
      id, epoca: newJogo.epoca,
      competicao: newJogo.competicao, competicao_label: newJogo.competicao_label,
      jornada: newJogo.jornada, data: newJogo.data, hora: newJogo.hora,
      local: newJogo.local, adversario: newJogo.adversario,
      golos_ra: Number(newJogo.golos_ra), golos_adv: Number(newJogo.golos_adv),
      resultado: newJogo.resultado,
      espectadores: newJogo.espectadores ? Number(newJogo.espectadores) : null,
      estadio: newJogo.estadio || null, formacao_ra: newJogo.formacao_ra || null,
      formacao_adv: newJogo.formacao_adv || null, arbitro: newJogo.arbitro || null,
      has_detail: false, publicado: true,
    });
    if (error) { toast('Erro: ' + error.message, false); return; }
    toast('Jogo criado');
    setShowNewJogo(false);
    setNewJogo({ epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'', data:'', hora:'20:30', local:'casa', adversario:'', golos_ra:'0', golos_adv:'0', resultado:'E', espectadores:'', estadio:'', formacao_ra:'', formacao_adv:'', arbitro:'' });
    const { data } = await supabase.from('jogos').select('id,jornada,data,adversario,local,golos_ra,golos_adv,resultado,has_detail,espectadores,formacao_ra,formacao_adv,arbitro,hora,estadio,epoca').order('data', { ascending: false });
    setJogos(data ?? []);
  }

  async function copyFichaAnterior() {
    if (!sel || !selJogo) return;
    const numAtual = jornadaNum(selJogo.jornada as string);
    if (numAtual <= 1) { toast('Não existe jornada anterior', false); return; }

    // Procura o jogo da jornada imediatamente anterior (por número), mesma época
    const jogosOrdenados = [...jogos]
      .filter(j => j.id !== sel && jornadaNum(j.jornada as string) < numAtual)
      .sort((a: any, b: any) => jornadaNum(b.jornada) - jornadaNum(a.jornada));

    if (!jogosOrdenados.length) { toast('Nenhuma jornada anterior encontrada', false); return; }

    // Encontra o primeiro com ficha RA
    let fichasAnt: Record<string,unknown>[] = [];
    let jogoAnt: Record<string,unknown> | null = null;
    for (const j of jogosOrdenados) {
      const { data } = await supabase.from('fichas_jogo').select('*')
        .eq('jogo_id', j.id).eq('equipa', 'ra').order('ordem');
      if (data?.length) { fichasAnt = data; jogoAnt = j; break; }
    }

    if (!fichasAnt.length || !jogoAnt) { toast('Nenhuma jornada anterior com ficha RA', false); return; }

    // Confirma se já há fichas RA
    if (fichas.filter(f => f.equipa === 'ra').length > 0) {
      if (!confirm(`Substituir fichas RA actuais pela ficha de ${jogoAnt.jornada}?`)) return;
      const raIds = fichas.filter(f => f.equipa === 'ra').map(f => f.id as string);
      for (const id of raIds) await supabase.from('fichas_jogo').delete().eq('id', id);
    }

    // Copia apenas jogadores RA (equipa='ra' já garantido pelo filtro acima)
    const toInsert = fichasAnt.map(({ id: _id, jogo_id: _jid, ...rest }) => ({ ...rest, jogo_id: sel }));
    const { error } = await supabase.from('fichas_jogo').insert(toInsert);
    if (error) { toast('Erro ao copiar: ' + error.message, false); return; }

    await supabase.from('jogos').update({ has_detail: true }).eq('id', sel);
    setJogos(prev => prev.map(j => j.id === sel ? { ...j, has_detail: true } : j));
    const { data: updated } = await supabase.from('fichas_jogo').select('*').eq('jogo_id', sel).order('ordem');
    setFichas(updated ?? []);
    toast(`✓ Ficha RA de ${jogoAnt.jornada} copiada — remove quem não jogou`);
  }

  async function saveEvento() {
    if (!newEv.jogador || !sel) return;
    const tipoFinal = newEv.tipo === 'segundo_amarelo' ? 'cartao_vermelho' : newEv.tipo;
    const { error } = await supabase.from('eventos_jogo').insert({
      jogo_id: sel, minuto: Number(newEv.minuto), minuto_extra: newEv.minuto_extra ? Number(newEv.minuto_extra) : null,
      tipo: tipoFinal, equipa: newEv.equipa, jogador: newEv.jogador,
      jogador2: newEv.jogador2 || null,
      score_ra: newEv.score_ra ? Number(newEv.score_ra) : null,
      score_adv: newEv.score_adv ? Number(newEv.score_adv) : null,
      ordem: eventos.length + 1,
    });
    if (error) { toast('Erro: ' + error.message, false); return; }
    await supabase.from('jogos').update({ has_detail: true }).eq('id', sel);
    setJogos(prev => prev.map(j => j.id === sel ? { ...j, has_detail: true } : j));
    setNewEv({ minuto: '', minuto_extra: '', tipo: 'golo', equipa: 'ra', jogador: '', jogador2: '', score_ra: '', score_adv: '' });
    const { data } = await supabase.from('eventos_jogo').select('*').eq('jogo_id', sel).order('minuto').order('minuto_extra', { ascending: true, nullsFirst: true });
    setEventos(data ?? []);
    toast('Evento adicionado');
  }

  async function deleteEvento(id: string) {
    await supabase.from('eventos_jogo').delete().eq('id', id);
    setEventos(ev => ev.filter(e => e.id !== id));
    toast('Evento eliminado');
  }

  async function saveFicha() {
    if (!newFicha.nome || !sel) return;
    const maxOrdem = Math.max(0, ...fichas.filter(f => f.equipa === newFicha.equipa && f.tipo === newFicha.tipo).map(f => Number(f.ordem) || 0));
    // Auto-fill number from jogadores if RA
    let numero = Number(newFicha.numero);
    if (!numero && newFicha.equipa === 'ra') {
      const found = jogadoresRA.find(j => j.nome_display === newFicha.nome);
      if (found) numero = found.numero as number;
    }
    const { error } = await supabase.from('fichas_jogo').insert({
      jogo_id: sel, equipa: newFicha.equipa, tipo: newFicha.tipo,
      numero: numero, nome: newFicha.nome,
      posicao: newFicha.posicao || null, capitao: newFicha.capitao, ordem: maxOrdem + 1,
    });
    if (error) { toast('Erro: ' + error.message, false); return; }
    await supabase.from('jogos').update({ has_detail: true }).eq('id', sel);
    setJogos(prev => prev.map(j => j.id === sel ? { ...j, has_detail: true } : j));
    setNewFicha({ tipo: 'titular', equipa: 'ra', numero: '', nome: '', posicao: '', capitao: false });
    const { data } = await supabase.from('fichas_jogo').select('*').eq('jogo_id', sel).order('ordem');
    setFichas(data ?? []);
    toast('Jogador adicionado');
  }

  async function deleteFicha(id: string) {
    await supabase.from('fichas_jogo').delete().eq('id', id);
    setFichas(fc => fc.filter(f => f.id !== id));
    toast('Jogador eliminado');
  }

  async function saveStats() {
    const { error } = await supabase.from('estatisticas_jogo').upsert({ ...stats, jogo_id: sel });
    if (error) toast('Erro: ' + error.message, false);
    else toast('Estatísticas guardadas');
  }

  async function saveJogo() {
    const { error } = await supabase.from('jogos').update({
      data: jogoEdit.data, hora: jogoEdit.hora, adversario: jogoEdit.adversario,
      golos_ra: Number(jogoEdit.golos_ra), golos_adv: Number(jogoEdit.golos_adv),
      resultado: jogoEdit.resultado, espectadores: jogoEdit.espectadores ? Number(jogoEdit.espectadores) : null,
      estadio: jogoEdit.estadio || null, formacao_ra: jogoEdit.formacao_ra || null,
      formacao_adv: jogoEdit.formacao_adv || null, arbitro: jogoEdit.arbitro || null,
      has_detail: jogoEdit.has_detail,
    }).eq('id', sel);
    if (error) toast('Erro: ' + error.message, false);
    else { toast('Jogo guardado'); const { data } = await supabase.from('jogos').select('*').order('data', { ascending: false }); setJogos(data ?? []); }
  }

  async function saveNewJogador() {
    if (!newJogador.nome || !newJogador.numero) return;
    const { data: existing } = await supabase.from('jogadores').select('id').eq('nome_display', newJogador.nome).single();
    let jogadorId = existing?.id;
    if (!jogadorId) {
      const { data: created } = await supabase.from('jogadores').insert({ nome_display: newJogador.nome, posicao: newJogador.posicao }).select().single();
      jogadorId = created?.id;
    } else {
      // Sempre actualiza a posição com o valor seleccionado
      await supabase.from('jogadores').update({ posicao: newJogador.posicao }).eq('id', jogadorId);
    }
    if (!jogadorId) { toast('Erro ao criar jogador', false); return; }
    await supabase.from('jogadores_epoca').upsert({ jogador_id: jogadorId, epoca: newJogador.epoca, numero: Number(newJogador.numero), ativo: true }, { onConflict: 'jogador_id,epoca' });
    toast('Jogador adicionado ao plantel');
    setNewJogador({ nome: '', posicao: 'DEF', numero: '', epoca: newJogador.epoca });
    // Refresh
    const { data } = await supabase.from('jogadores_epoca').select('numero, ativo, emprestado, data_saida, mes_chegada, epoca_chegada, jogadores(id, nome_display, posicao, data_nascimento, contrato_ate, nacionalidade)').eq('epoca', epocaPlantel).order('numero');
    setJogadoresEpoca((data ?? []).map((r: any) => ({ ...(r.jogadores ?? {}), numero: r.numero, ativo: r.ativo, mercado: r.mercado, epoca_chegada: r.epoca_chegada, data_saida: r.data_saida })));
    const { data: all } = await supabase.from('jogadores').select('id,nome_display,posicao,data_nascimento,contrato_ate,nacionalidade').order('nome_display');
    setAllJogadores(all ?? []);
  }

  async function toggleAtivo(jogadorId: string, ativo: boolean, epoca: string) {
    await supabase.from('jogadores_epoca').update({ ativo: !ativo }).eq('jogador_id', jogadorId).eq('epoca', epoca);
    setJogadoresEpoca(prev => prev.map(j => j.id === jogadorId ? { ...j, ativo: !ativo } : j));
  }

  // ── Styles ───────────────────────────────────────────────────
  const tabBtn = (t: string, cur: string, onClick: () => void) => (
    <button onClick={onClick} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1.5px solid', cursor: 'pointer', borderColor: cur === t ? '#006B3C' : '#E4E7EC', background: cur === t ? '#006B3C' : '#fff', color: cur === t ? '#fff' : '#6B7280' }}>
      {t === 'jogos' ? '⚽ Jogos' : t === 'plantel' ? '👥 Plantel' : t === 'info' ? 'Info' : t === 'eventos' ? 'Eventos' : t === 'fichas' ? 'Fichas' : 'Stats'}
    </button>
  );

  const inp = (val: string, onChange: (v: string) => void, placeholder = '', w = '100%') => (
    <input value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: w, padding: '6px 8px', border: '1px solid #E4E7EC', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' as const }} />
  );
  const sel2 = (val: string, opts: string[], onChange: (v: string) => void) => (
    <select value={val} onChange={e => onChange(e.target.value)} style={{ padding: '6px 8px', border: '1px solid #E4E7EC', borderRadius: 6, fontSize: 12 }}>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const POS_ORDER: Record<string, number> = { GR: 4, DEF: 3, MED: 2, AV: 1 };
  const jogsGrouped = [...jogadoresEpoca].sort((a, b) => (POS_ORDER[a.posicao as string] ?? 0) - (POS_ORDER[b.posicao as string] ?? 0) || (a.numero as number) - (b.numero as number));

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <header style={{ background: '#fff', borderBottom: '0.5px solid #E4E7EC', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none' }}>← Site</Link>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111318' }}>⚙️ Admin · Rio Ave FC</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {tabBtn('jogos', mainTab, () => setMainTab('jogos'))}
            {tabBtn('plantel', mainTab, () => setMainTab('plantel'))}
          </div>
        </div>
        <button onClick={() => setAuth(false)} style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Sair</button>
      </header>

      {/* ══ PLANTEL TAB ══════════════════════════════════════════ */}
      {mainTab === 'plantel' && (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Selector de época */}
          <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginRight: 4 }}>ÉPOCA:</span>
            {['25/26','24/25','23/24','22/23','21/22','20/21'].map(ep => (
              <button key={ep} onClick={() => setEpocaPlantel(ep)}
                style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', transition: 'all .12s',
                  borderColor: epocaPlantel === ep ? '#006B3C' : '#E4E7EC',
                  background: epocaPlantel === ep ? '#006B3C' : '#fff',
                  color: epocaPlantel === ep ? '#fff' : '#6B7280' }}>
                {ep}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF' }}>{jogadoresEpoca.length} jogadores</span>
          </div>
          <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111318' }}>Plantel por época</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <select value={epocaPlantel} onChange={e => setEpocaPlantel(e.target.value)}
                    style={{ padding: '6px 10px', border: '1.5px solid #E4E7EC', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#111318' }}>
                    {epocas.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              {/* Criar nova época */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 10px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E4E7EC' }}>
                <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>Nova época:</span>
                <input value={novaEpoca} onChange={e => setNovaEpoca(e.target.value)} placeholder="ex: 26/27"
                  style={{ flex: 1, padding: '4px 8px', border: '1px solid #E4E7EC', borderRadius: 6, fontSize: 12 }} />
                <button onClick={() => {
                  const e = novaEpoca.trim();
                  if (!e) return;
                  if (!epocas.includes(e)) setEpocas(prev => [e, ...prev]);
                  setEpocaPlantel(e);
                  setNovaEpoca('');
                }} style={{ padding: '4px 12px', background: '#006B3C', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  Criar
                </button>
              </div>
            </div>
            {/* Add player form — no topo */}
            <div style={{ background: '#F0F7F3', border: '1.5px solid #006B3C', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#006B3C', marginBottom: 10 }}>+ Adicionar jogador à época</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 80px auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>Nome</div>
                  <PlayerAC value={newJogador.nome} onChange={v => setNewJogador(p => ({ ...p, nome: v }))}
                    players={allJogadores.map(j => j.nome_display as string)} placeholder="Nome do jogador" />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>Posição</div>
                  {sel2(newJogador.posicao, POSICOES_RA, v => setNewJogador(p => ({ ...p, posicao: v })))}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>Nº</div>
                  {inp(newJogador.numero, v => setNewJogador(p => ({ ...p, numero: v })), '#')}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>Época</div>
                  <select value={newJogador.epoca} onChange={e => setNewJogador(p => ({ ...p, epoca: e.target.value }))}
                    style={{ padding: '6px 8px', border: '1px solid #E4E7EC', borderRadius: 6, fontSize: 12 }}>
                    {epocas.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <button onClick={saveNewJogador} style={{ padding: '7px 14px', background: '#006B3C', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Adicionar
                </button>
              </div>
            </div>
            {/* Player list */}
            {['GR', 'DEF', 'MED', 'AV'].map(pos => {
              const players = jogsGrouped.filter(j => j.posicao === pos);
              if (!players.length) return null;
              const labels: Record<string, string> = { GR: 'Guarda-Redes', DEF: 'Defesas', MED: 'Médios', AV: 'Avançados' };
              return (
                <div key={pos} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{labels[pos]}</div>
                  {players.map(j => (
                    <div key={j.id as string}>
                      {editingJogador === j.id ? (
                        /* ── Edit mode ── */
                        <div style={{ background: '#F0F7F3', border: '1px solid #006B3C', borderRadius: 8, padding: 10, marginBottom: 6 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px', gap: 6, marginBottom: 8 }}>
                            <div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Nome</div>
                              <input value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))}
                                style={{ width: '100%', padding: '5px 7px', border: '1px solid #E4E7EC', borderRadius: 5, fontSize: 12, boxSizing: 'border-box' as const }} />
                            </div>
                            <div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Posição</div>
                              <select value={editForm.posicao} onChange={e => setEditForm(p => ({ ...p, posicao: e.target.value }))}
                                style={{ width: '100%', padding: '5px 6px', border: '1px solid #E4E7EC', borderRadius: 5, fontSize: 12 }}>
                                {['GR','DEF','MED','AV'].map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </div>
                            <div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Nº</div>
                              <input type="number" value={editForm.numero} onChange={e => setEditForm(p => ({ ...p, numero: e.target.value }))}
                                style={{ width: '100%', padding: '5px 7px', border: '1px solid #E4E7EC', borderRadius: 5, fontSize: 12, boxSizing: 'border-box' as const }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer' }}>
                              <input type="checkbox" checked={editForm.ativo} onChange={e => setEditForm(p => ({ ...p, ativo: e.target.checked }))} />
                              Activo nesta época
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer' }}>
                              <input type="checkbox" checked={editForm.emprestado||false} onChange={e => setEditForm(p => ({ ...p, emprestado: e.target.checked }))} />
                              <span>Emprestado ao Rio Ave <span style={{ fontSize: 9, color: '#1A5FA8', fontWeight: 700 }}>(EMP.)</span></span>
                            </label>
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 6 }}>Dados pessoais</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                            <div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Data de nascimento</div>
                              <input type="date" value={editForm.data_nascimento||''} onChange={e => setEditForm(p => ({ ...p, data_nascimento: e.target.value }))}
                                style={{ width: '100%', padding: '5px 7px', border: '1px solid #E4E7EC', borderRadius: 5, fontSize: 11, boxSizing: 'border-box' as const }} />
                            </div>
                            <div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Contrato válido até</div>
                              <input type="date" value={editForm.contrato_ate||''} onChange={e => setEditForm(p => ({ ...p, contrato_ate: e.target.value }))}
                                style={{ width: '100%', padding: '5px 7px', border: '1px solid #E4E7EC', borderRadius: 5, fontSize: 11, boxSizing: 'border-box' as const }} />
                            </div>
                          </div>
                          <div style={{ marginBottom: 10 }}>
                              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Nacionalidade</div>
                              <input value={editForm.nacionalidade||''} onChange={e => setEditForm(p => ({ ...p, nacionalidade: e.target.value }))} placeholder="ex: Português, Alemão…"
                                style={{ width: '100%', padding: '5px 7px', border: '1px solid #E4E7EC', borderRadius: 5, fontSize: 11, boxSizing: 'border-box' as const }} />
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 6 }}>Chegada / Saída</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                            <div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Mês de chegada</div>
                              <select value={editForm.mes_chegada||''} onChange={e => setEditForm(p => ({ ...p, mes_chegada: e.target.value }))}
                                style={{ width: '100%', padding: '5px 6px', border: '1px solid #E4E7EC', borderRadius: 5, fontSize: 11 }}>
                                <option value="">— mês —</option>
                                {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>
                            <div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Temporada de chegada</div>
                              <select value={editForm.epoca_chegada||''} onChange={e => setEditForm(p => ({ ...p, epoca_chegada: e.target.value }))}
                                style={{ width: '100%', padding: '5px 6px', border: '1px solid #E4E7EC', borderRadius: 5, fontSize: 11 }}>
                                <option value="">— época —</option>
                                {['25/26','24/25','23/24','22/23','21/22','20/21'].map(e => <option key={e} value={e}>{e}</option>)}
                              </select>
                            </div>
                            <div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Data de saída (vazio = no plantel)</div>
                              <input type="date" value={editForm.data_saida||''} onChange={e => setEditForm(p => ({ ...p, data_saida: e.target.value }))}
                                style={{ width: '100%', padding: '5px 7px', border: '1px solid #E4E7EC', borderRadius: 5, fontSize: 11, boxSizing: 'border-box' as const }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={updateJogador} style={{ padding: '5px 12px', background: '#006B3C', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
                            <button onClick={() => setEditingJogador(null)} style={{ padding: '5px 10px', background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={() => deleteJogadorCompletely(j.id as string, j.nome_display as string)}
                              style={{ marginLeft: 'auto', padding: '5px 10px', background: '#FCEBEB', color: '#DC2626', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                              🗑 Apagar de tudo
                            </button>
                          </div>
                        </div>
                      ) : addEpocaFor === j.id ? (
                        /* ── Add epoch mode ── */
                        <div style={{ background: '#EBF4FF', border: '1px solid #1A5FA8', borderRadius: 8, padding: 10, marginBottom: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#1A5FA8', marginBottom: 8 }}>Adicionar época a {j.nome_display as string}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px auto', gap: 6, alignItems: 'end' }}>
                            <div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Época</div>
                              <select value={addEpocaForm.epoca} onChange={e => setAddEpocaForm(p => ({ ...p, epoca: e.target.value }))}
                                style={{ width: '100%', padding: '5px 6px', border: '1px solid #E4E7EC', borderRadius: 5, fontSize: 12 }}>
                                {epocas.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </div>
                            <div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Nº camisola</div>
                              <input type="number" value={addEpocaForm.numero} onChange={e => setAddEpocaForm(p => ({ ...p, numero: e.target.value }))}
                                placeholder="Nº" style={{ width: '100%', padding: '5px 6px', border: '1px solid #E4E7EC', borderRadius: 5, fontSize: 12, boxSizing: 'border-box' as const }} />
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={addEpocaToJogador} style={{ padding: '5px 10px', background: '#1A5FA8', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Adicionar</button>
                              <button onClick={() => setAddEpocaFor(null)} style={{ padding: '5px 8px', background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>✕</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* ── Normal row ── */
                        <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 50px auto', gap: 6, alignItems: 'center', padding: '6px 4px', borderBottom: '1px solid #F3F4F6', opacity: j.ativo ? 1 : 0.45 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textAlign: 'center' }}>#{j.numero as number}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#111318' }}>{j.nome_display as string}</span>
                          <span style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: '#EEF7F2', color: '#006B3C', fontWeight: 600 }}>{j.posicao as string}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => { setEditingJogador(j.id as string); setEditForm({ nome: j.nome_display as string, posicao: j.posicao as string, numero: String(j.numero), ativo: j.ativo as boolean, data_nascimento: (j as any).data_nascimento||'', contrato_ate: (j as any).contrato_ate||'', nacionalidade: (j as any).nacionalidade||'', emprestado: (j as any).emprestado||false, mes_chegada: (j as any).mes_chegada||'', epoca_chegada: (j as any).epoca_chegada||'', data_saida: (j as any).data_saida||'' }); setAddEpocaFor(null); }}
                              style={{ padding: '3px 7px', fontSize: 10, fontWeight: 600, background: '#F0F2F5', color: '#374151', border: '1px solid #E4E7EC', borderRadius: 5, cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => { setAddEpocaFor(j.id as string); setEditingJogador(null); setAddEpocaForm({ epoca: '25/26', numero: String(j.numero) }); }}
                              style={{ padding: '3px 7px', fontSize: 10, fontWeight: 600, background: '#EBF4FF', color: '#1A5FA8', border: '1px solid #BFDBFE', borderRadius: 5, cursor: 'pointer' }}>+época</button>
                            <button onClick={() => deleteJogadorFromEpoca(j.id as string, epocaPlantel)}
                              style={{ padding: '3px 7px', fontSize: 10, fontWeight: 600, background: '#FCEBEB', color: '#DC2626', border: 'none', borderRadius: 5, cursor: 'pointer' }}>✕</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ══ JOGOS TAB ════════════════════════════════════════════ */}
      {mainTab === 'jogos' && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
          {/* Sidebar */}
          <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, padding: 12, height: 'fit-content' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em' }}>Jogos</div>
              <button onClick={() => setShowNewJogo(v => !v)} style={{ fontSize:11, fontWeight:600, padding:'3px 8px', background:'#006B3C', color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }}>+ Novo</button>
            </div>
            {showNewJogo && (
              <div style={{ background:'#F9FAFB', border:'1px solid #E4E7EC', borderRadius:10, padding:12, marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:8 }}>Novo Jogo</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    <div><div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>Época</div>
                      <select value={newJogo.epoca} onChange={e => setNewJogo(p=>({...p,epoca:e.target.value}))} style={{ width:'100%', padding:'5px 6px', border:'1px solid #E4E7EC', borderRadius:5, fontSize:11 }}>
                        {['25/26','24/25','23/24'].map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div><div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>Competição</div>
                      <select value={newJogo.competicao} onChange={e => {
                        const labels: Record<string,string> = { liga:'Liga Portugal Betclic', 'taca-pt':'Taça de Portugal', 'taca-liga':'Taça da Liga', amigavel:'Amigável' };
                        setNewJogo(p=>({...p, competicao:e.target.value, competicao_label:labels[e.target.value]??e.target.value}));
                      }} style={{ width:'100%', padding:'5px 6px', border:'1px solid #E4E7EC', borderRadius:5, fontSize:11 }}>
                        <option value="liga">Liga</option>
                        <option value="taca-pt">Taça Portugal</option>
                        <option value="taca-liga">Taça Liga</option>
                        <option value="amigavel">Amigável</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    <div><div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>Jornada</div>
                      <input value={newJogo.jornada} onChange={e=>setNewJogo(p=>({...p,jornada:e.target.value}))} placeholder="J30" style={{ width:'100%', padding:'5px 6px', border:'1px solid #E4E7EC', borderRadius:5, fontSize:11, boxSizing:'border-box' as const }} />
                    </div>
                    <div><div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>Local</div>
                      <select value={newJogo.local} onChange={e=>setNewJogo(p=>({...p,local:e.target.value}))} style={{ width:'100%', padding:'5px 6px', border:'1px solid #E4E7EC', borderRadius:5, fontSize:11 }}>
                        <option value="casa">Casa</option>
                        <option value="fora">Fora</option>
                      </select>
                    </div>
                  </div>
                  <div><div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>Adversário</div>
                    <input value={newJogo.adversario} onChange={e=>setNewJogo(p=>({...p,adversario:e.target.value}))} placeholder="ex: Sporting CP" style={{ width:'100%', padding:'5px 6px', border:'1px solid #E4E7EC', borderRadius:5, fontSize:11, boxSizing:'border-box' as const }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    <div><div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>Data</div>
                      <input type="date" value={newJogo.data} onChange={e=>setNewJogo(p=>({...p,data:e.target.value}))} style={{ width:'100%', padding:'5px 6px', border:'1px solid #E4E7EC', borderRadius:5, fontSize:11, boxSizing:'border-box' as const }} />
                    </div>
                    <div><div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>Hora</div>
                      <input value={newJogo.hora} onChange={e=>setNewJogo(p=>({...p,hora:e.target.value}))} placeholder="20:30" style={{ width:'100%', padding:'5px 6px', border:'1px solid #E4E7EC', borderRadius:5, fontSize:11, boxSizing:'border-box' as const }} />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                    <div><div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>Golos RA</div>
                      <input type="number" value={newJogo.golos_ra} onChange={e=>setNewJogo(p=>({...p,golos_ra:e.target.value}))} style={{ width:'100%', padding:'5px 6px', border:'1px solid #E4E7EC', borderRadius:5, fontSize:11, boxSizing:'border-box' as const }} />
                    </div>
                    <div><div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>Golos ADV</div>
                      <input type="number" value={newJogo.golos_adv} onChange={e=>setNewJogo(p=>({...p,golos_adv:e.target.value}))} style={{ width:'100%', padding:'5px 6px', border:'1px solid #E4E7EC', borderRadius:5, fontSize:11, boxSizing:'border-box' as const }} />
                    </div>
                    <div><div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>Result.</div>
                      <select value={newJogo.resultado} onChange={e=>setNewJogo(p=>({...p,resultado:e.target.value}))} style={{ width:'100%', padding:'5px 6px', border:'1px solid #E4E7EC', borderRadius:5, fontSize:11 }}>
                        <option value="V">V</option><option value="E">E</option><option value="D">D</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    <div><div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>Espectadores</div>
                      <input type="number" value={newJogo.espectadores} onChange={e=>setNewJogo(p=>({...p,espectadores:e.target.value}))} placeholder="opcional" style={{ width:'100%', padding:'5px 6px', border:'1px solid #E4E7EC', borderRadius:5, fontSize:11, boxSizing:'border-box' as const }} />
                    </div>
                    <div><div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>Árbitro</div>
                      <input value={newJogo.arbitro} onChange={e=>setNewJogo(p=>({...p,arbitro:e.target.value}))} placeholder="opcional" style={{ width:'100%', padding:'5px 6px', border:'1px solid #E4E7EC', borderRadius:5, fontSize:11, boxSizing:'border-box' as const }} />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:4 }}>
                    <button onClick={createJogo} style={{ flex:1, padding:'7px', background:'#006B3C', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>Criar jogo</button>
                    <button onClick={() => setShowNewJogo(false)} style={{ padding:'7px 12px', background:'#F3F4F6', color:'#6B7280', border:'none', borderRadius:6, fontSize:12, cursor:'pointer' }}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}
            {jogos.map(j => (
              <div key={j.id as string} onClick={() => setSel(j.id as string)}
                style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: sel === j.id ? '#006B3C' : 'transparent', color: sel === j.id ? '#fff' : '#374151' }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{j.jornada as string} · {j.adversario as string}</div>
                <div style={{ fontSize: 10, opacity: .7 }}>{j.data as string} · {j.golos_ra as number}-{j.golos_adv as number} {j.resultado as string}</div>
              </div>
            ))}
          </div>

          {/* Editor */}
          <div>
            {!sel ? (
              <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>←</div>
                <div style={{ fontSize: 14 }}>Seleciona um jogo para editar</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Game header */}
                <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111318' }}>{selJogo?.jornada as string} · {selJogo?.adversario as string}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{selJogo?.data as string} · {selJogo?.local as string} · {selJogo?.golos_ra as number}-{selJogo?.golos_adv as number} · época {jogoEpoca}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {(['info', 'eventos', 'fichas', 'stats'] as GameTab[]).map(t => tabBtn(t, gameTab, () => setGameTab(t)))}
                    <button onClick={deleteJogo} title="Apagar jogo" style={{ padding: '6px 10px', background: '#FCEBEB', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🗑</button>
                  </div>
                </div>

                {loading && <div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>A carregar…</div>}

                {/* ── Info ── */}
                {!loading && gameTab === 'info' && (
                  <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                      {[['adversario', 'Adversário'], ['data', 'Data (AAAA-MM-DD)'], ['hora', 'Hora'], ['estadio', 'Estádio'], ['formacao_ra', 'Formação RA'], ['formacao_adv', 'Formação ADV'], ['arbitro', 'Árbitro']].map(([k, l]) => (
                        <div key={k}>
                          <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>{l}</div>
                          {inp(String(jogoEdit[k] ?? ''), v => setJogoEdit(p => ({ ...p, [k]: v })))}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
                      {[['golos_ra', 'Golos RA'], ['golos_adv', 'Golos ADV'], ['espectadores', 'Espect.']].map(([k, l]) => (
                        <div key={k}><div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>{l}</div>{inp(String(jogoEdit[k] ?? ''), v => setJogoEdit(p => ({ ...p, [k]: v })))}</div>
                      ))}
                      <div><div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>Resultado</div>{sel2(String(jogoEdit.resultado ?? 'E'), ['V', 'E', 'D'], v => setJogoEdit(p => ({ ...p, resultado: v })))}</div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={Boolean(jogoEdit.has_detail)} onChange={e => setJogoEdit(p => ({ ...p, has_detail: e.target.checked }))} />
                      Tem dados detalhados
                    </label>
                    <button onClick={saveJogo} style={{ padding: '8px 16px', background: '#006B3C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
                  </div>
                )}

                {/* ── Eventos ── */}
                {!loading && gameTab === 'eventos' && (
                  <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Eventos · {eventos.length}</div>
                    {eventos.map(ev => (
                      <div key={ev.id as string} style={{ display: 'grid', gridTemplateColumns: '44px 100px 50px 1fr 1fr auto', gap: 6, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                        <span style={{ fontWeight: 700, color: '#6B7280' }}>{ev.minuto as number}{ev.minuto_extra ? `+${ev.minuto_extra}` : ''}&apos;</span>
                        <span style={{ background: ev.tipo === 'auto_golo' ? '#FCEBEB' : ev.equipa === 'ra' ? '#EEF7F2' : '#FCEBEB', color: ev.tipo === 'auto_golo' ? '#DC2626' : ev.equipa === 'ra' ? '#006B3C' : '#DC2626', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{ev.tipo as string}</span>
                        <span style={{ fontSize: 10, color: '#9CA3AF' }}>{ev.equipa as string}</span>
                        <span style={{ fontWeight: 600 }}>{ev.jogador as string}</span>
                        <span style={{ color: '#9CA3AF' }}>{(ev.jogador2 as string) ?? ''}{ev.score_ra != null ? ` ${ev.score_ra}-${ev.score_adv}` : ''}</span>
                        <button onClick={() => deleteEvento(ev.id as string)} style={{ padding: '3px 8px', background: '#FCEBEB', color: '#DC2626', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>✕</button>
                      </div>
                    ))}
                    {/* Add event */}
                    <div style={{ marginTop: 14, padding: 12, background: '#F9FAFB', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>+ Adicionar evento</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '60px 60px 140px 60px 1fr 1fr 50px 50px', gap: 6, alignItems: 'end' }}>
                        <div>{inp(newEv.minuto, v => setNewEv(p => ({ ...p, minuto: v })), 'Min')}</div>
                        <div>{inp(newEv.minuto_extra, v => setNewEv(p => ({ ...p, minuto_extra: v })), 'Extra')}</div>
                        <div>{sel2(newEv.tipo, TIPOS_EVENTO, v => setNewEv(p => ({ ...p, tipo: v })))}</div>
                        <div>{sel2(newEv.equipa, ['ra', 'adv'], v => setNewEv(p => ({ ...p, equipa: v, jogador: '', jogador2: '' })))}</div>
                        <div>
                          <div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>
                            {newEv.tipo==='substituicao' ? '↓ Sai (quem saiu)' : 'Jogador'}
                          </div>
                          <PlayerAC
                            value={newEv.jogador}
                            onChange={v => setNewEv(p => ({ ...p, jogador: v }))}
                            players={newEv.equipa === 'ra' ? raNames : advNames}
                            placeholder={newEv.tipo==='substituicao' ? 'Quem saiu do campo' : (newEv.equipa === 'ra' ? 'Jogador RA' : 'Jogador ADV')}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize:9, color:'#9CA3AF', marginBottom:2 }}>
                            {newEv.tipo==='substituicao' ? '↑ Entra (quem entrou)' : 'Assist./Info'}
                          </div>
                          <PlayerAC
                            value={newEv.jogador2}
                            onChange={v => setNewEv(p => ({ ...p, jogador2: v }))}
                            players={newEv.equipa === 'ra' ? raNames : advNames}
                            placeholder={newEv.tipo === 'substituicao' ? 'Quem entrou em campo' : 'Assist.'}
                          />
                        </div>
                        <div>{inp(newEv.score_ra, v => setNewEv(p => ({ ...p, score_ra: v })), 'RA')}</div>
                        <div>{inp(newEv.score_adv, v => setNewEv(p => ({ ...p, score_adv: v })), 'ADV')}</div>
                      </div>
                      <button onClick={saveEvento} style={{ marginTop: 8, padding: '7px 14px', background: '#006B3C', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Adicionar
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Fichas ── */}
                {!loading && gameTab === 'fichas' && (
                  <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Fichas · {fichas.length} jogadores</div>
                    <button onClick={copyFichaAnterior}
                      style={{ padding: '6px 12px', background: '#EBF4FF', color: '#1A5FA8', border: '1.5px solid #BFDBFE', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      📋 Copiar ficha do jogo anterior
                    </button>
                  </div>
                    {(['titular', 'suplente'] as const).flatMap(tipo =>
                      (['ra', 'adv'] as const).map(equipa => {
                        const list = fichas.filter(f => f.tipo === tipo && f.equipa === equipa);
                        if (!list.length && tipo === 'suplente') return null;
                        return (
                          <div key={`${equipa}-${tipo}`} style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>
                              {equipa === 'ra' ? 'Rio Ave' : 'Adversário'} · {tipo}
                            </div>
                            {list.map(f => (
                              <div key={f.id as string} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 60px auto', gap: 6, alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #F9FAFB', fontSize: 12 }}>
                                <span style={{ fontWeight: 700, color: '#9CA3AF' }}>#{f.numero as number}</span>
                                <span>{f.nome as string}{f.capitao ? ' (C)' : ''}</span>
                                <span style={{ color: '#9CA3AF', fontSize: 10 }}>{f.posicao as string ?? ''}</span>
                                <button onClick={() => deleteFicha(f.id as string)} style={{ padding: '2px 7px', background: '#FCEBEB', color: '#DC2626', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>✕</button>
                              </div>
                            ))}
                          </div>
                        );
                      })
                    )}
                    {/* Add ficha */}
                    <div style={{ marginTop: 12, padding: 12, background: '#F9FAFB', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>+ Adicionar jogador</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '70px 70px 50px 1fr 80px auto', gap: 6, alignItems: 'end' }}>
                        <div>{sel2(newFicha.equipa, ['ra', 'adv'], v => setNewFicha(p => ({ ...p, equipa: v, nome: '' })))}</div>
                        <div>{sel2(newFicha.tipo, ['titular', 'suplente'], v => setNewFicha(p => ({ ...p, tipo: v })))}</div>
                        <div>{inp(newFicha.numero, v => setNewFicha(p => ({ ...p, numero: v })), '#')}</div>
                        <div>
                          <PlayerAC
                            value={newFicha.nome}
                            onChange={v => {
                              setNewFicha(p => ({ ...p, nome: v }));
                              // Auto-fill position and number for RA players
                              if (newFicha.equipa === 'ra') {
                                const found = jogadoresRA.find(j => j.nome_display === v);
                                if (found) setNewFicha(p => ({ ...p, nome: v, posicao: found.posicao as string, numero: String(found.numero) }));
                              }
                            }}
                            players={newFicha.equipa === 'ra' ? raNames : []}
                            placeholder="Nome"
                          />
                        </div>
                        <div>{sel2(newFicha.posicao, ['', ...POSICOES_RA], v => setNewFicha(p => ({ ...p, posicao: v })))}</div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                          <input type="checkbox" checked={newFicha.capitao} onChange={e => setNewFicha(p => ({ ...p, capitao: e.target.checked }))} />C
                        </label>
                      </div>
                      <button onClick={saveFicha} style={{ marginTop: 8, padding: '7px 14px', background: '#006B3C', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Adicionar
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Stats ── */}
                {!loading && gameTab === 'stats' && (
                  <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, padding: 16 }}>
                    {(() => {
                    const isHome = selJogo?.local === 'casa';
                    const labelEsq = isHome ? 'RA (casa)' : (selJogo?.adversario as string ?? 'ADV') + ' (casa)';
                    const labelDir = isHome ? (selJogo?.adversario as string ?? 'ADV') + ' (fora)' : 'RA (fora)';
                    const keyEsq = isHome ? 'ra' : 'adv';
                    const keyDir = isHome ? 'adv' : 'ra';
                    return (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
                          Estatísticas · <span style={{ color: '#006B3C' }}>{labelEsq}</span> vs <span style={{ color: '#6B7280' }}>{labelDir}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 1, marginBottom: 4, fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>
                          <span>Estatística</span>
                          <span style={{ textAlign: 'center', color: '#006B3C' }}>{isHome ? 'RA' : selJogo?.adversario as string}</span>
                          <span style={{ textAlign: 'center' }}>{isHome ? selJogo?.adversario as string : 'RA'}</span>
                        </div>
                        {STATS_COLS.map(([key, label]) => (
                          <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 4, alignItems: 'center', padding: '3px 0', borderBottom: '1px solid #F9FAFB' }}>
                            <span style={{ fontSize: 12, color: '#374151' }}>{label}</span>
                            <input type="number" value={String(stats[`${key}_${keyEsq}`] ?? '')} onChange={e => setStats(p => ({ ...p, [`${key}_${keyEsq}`]: Number(e.target.value) }))}
                              style={{ padding: '4px 6px', border: '1px solid #E4E7EC', borderRadius: 4, fontSize: 12, textAlign: 'center', background: '#F0F7F3' }} />
                            <input type="number" value={String(stats[`${key}_${keyDir}`] ?? '')} onChange={e => setStats(p => ({ ...p, [`${key}_${keyDir}`]: Number(e.target.value) }))}
                              style={{ padding: '4px 6px', border: '1px solid #E4E7EC', borderRadius: 4, fontSize: 12, textAlign: 'center' }} />
                          </div>
                        ))}
                      </>
                    );
                  })()}
                    <button onClick={saveStats} style={{ marginTop: 14, padding: '8px 18px', background: '#006B3C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Guardar estatísticas
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
