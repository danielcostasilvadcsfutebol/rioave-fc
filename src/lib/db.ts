// src/lib/db.ts
// Camada de acesso ao Supabase — substitui as importações do mock-jogos-equipa
import { supabase } from './supabase-client';
import type { PartidaEquipa, EventoJogo, EstatisticasJogo, JogadorTitular } from './mock-jogos-equipa';

// ── Jogos ─────────────────────────────────────────────────────
export async function getJogosDB(epoca = '25/26'): Promise<PartidaEquipa[]> {
  const { data, error } = await supabase
    .from('jogos')
    .select('*')
    .eq('epoca', epoca)
    .eq('publicado', true)
    .order('data', { ascending: false });
  if (error || !data) return [];
  return data.map(row => ({
    id: row.id, epoca: row.epoca,
    competicao: row.competicao, competicao_label: row.competicao_label,
    jornada: row.jornada, data: row.data, hora: row.hora,
    local: row.local, adversario: row.adversario,
    golos_ra: row.golos_ra, golos_adv: row.golos_adv, resultado: row.resultado,
    espectadores: row.espectadores ?? undefined, estadio: row.estadio ?? undefined,
    formacao_ra: row.formacao_ra ?? undefined, formacao_adv: row.formacao_adv ?? undefined,
    arbitro: row.arbitro ?? undefined, hasDetail: row.has_detail, publicado: row.publicado,
  })) as PartidaEquipa[];
}

// ── Eventos ───────────────────────────────────────────────────
export async function getEventosDB(jogoId: string): Promise<EventoJogo[]> {
  const { data, error } = await supabase
    .from('eventos_jogo')
    .select('*')
    .eq('jogo_id', jogoId)
    .order('minuto')
    .order('minuto_extra', { ascending: true, nullsFirst: true })
    .order('ordem');
  if (error || !data) return [];
  return data.map(row => ({
    minuto: row.minuto,
    minuto_extra: row.minuto_extra ?? undefined,
    tipo: row.tipo,
    equipa: row.equipa,
    jogador: row.jogador,
    jogador2: row.jogador2 ?? undefined,
    score_ra: row.score_ra ?? undefined,
    score_adv: row.score_adv ?? undefined,
  })) as EventoJogo[];
}

// ── Estatísticas ──────────────────────────────────────────────
export async function getEstatisticasDB(jogoId: string): Promise<EstatisticasJogo | null> {
  const { data, error } = await supabase
    .from('estatisticas_jogo')
    .select('*')
    .eq('jogo_id', jogoId)
    .single();
  if (error || !data) return null;
  const d = data;
  return {
    posse_bola:            [d.posse_bola_ra,            d.posse_bola_adv],
    remates:               [d.remates_ra,               d.remates_adv],
    remates_baliza:        [d.remates_baliza_ra,        d.remates_baliza_adv],
    remates_poste:         [d.remates_poste_ra,         d.remates_poste_adv],
    grandes_oportunidades: [d.grandes_oportunidades_ra, d.grandes_oportunidades_adv],
    assistencias:          [d.assistencias_ra,          d.assistencias_adv],
    cruzamentos:           [d.cruzamentos_ra,           d.cruzamentos_adv],
    cantos:                [d.cantos_ra,                d.cantos_adv],
    livres:                [d.livres_ra,                d.livres_adv],
    ataques:               [d.ataques_ra,               d.ataques_adv],
    ataques_centro:        [d.ataques_centro_ra,        d.ataques_centro_adv],
    ataques_esquerda:      [d.ataques_esquerda_ra,      d.ataques_esquerda_adv],
    ataques_direita:       [d.ataques_direita_ra,       d.ataques_direita_adv],
    defesas:               [d.defesas_ra,               d.defesas_adv],
    penaltis:              [d.penaltis_ra,              d.penaltis_adv],
    penaltis_defendidos:   [d.penaltis_defendidos_ra,   d.penaltis_defendidos_adv],
    foras_jogo:            [d.foras_jogo_ra,            d.foras_jogo_adv],
    faltas:                [d.faltas_ra,                d.faltas_adv],
    amarelos:              [d.amarelos_ra,              d.amarelos_adv],
    vermelhos:             [d.vermelhos_ra,             d.vermelhos_adv],
  };
}

// ── Fichas (titulares + suplentes) ────────────────────────────
export interface FichasJogo {
  titulares_ra: JogadorTitular[]; suplentes_ra: JogadorTitular[];
  titulares_adv: JogadorTitular[]; suplentes_adv: JogadorTitular[];
}

export async function getFichasDB(jogoId: string): Promise<FichasJogo> {
  const { data, error } = await supabase
    .from('fichas_jogo')
    .select('*')
    .eq('jogo_id', jogoId)
    .order('ordem');
  const empty = { titulares_ra:[], suplentes_ra:[], titulares_adv:[], suplentes_adv:[] };
  if (error || !data) return empty;
  const mapP = (row: Record<string,unknown>): JogadorTitular => ({
    numero: row.numero as number, nome: row.nome as string,
    posicao: (row.posicao as string) ?? undefined,
    capitao: (row.capitao as boolean) ?? false,
  });
  return {
    titulares_ra:  data.filter(r => r.equipa==='ra'  && r.tipo==='titular').map(mapP),
    suplentes_ra:  data.filter(r => r.equipa==='ra'  && r.tipo==='suplente').map(mapP),
    titulares_adv: data.filter(r => r.equipa==='adv' && r.tipo==='titular').map(mapP),
    suplentes_adv: data.filter(r => r.equipa==='adv' && r.tipo==='suplente').map(mapP),
  };
}

// ── Plantel (todos os jogadores com fichas RA) ────────────────
export interface JogadorPlantelDB {
  nome: string; numero: number; posicao?: string;
  jogosTitular: number; jogosSuplente: number; jogosTotal: number;
}

export async function getRosterDB(epoca: string): Promise<JogadorPlantelDB[]> {
  // Buscar todas as fichas RA para a época
  const { data: jogosEpoca } = await supabase
    .from('jogos').select('id').eq('epoca', epoca).eq('has_detail', true);
  if (!jogosEpoca?.length) return [];
  const ids = jogosEpoca.map(j => j.id);

  const { data } = await supabase
    .from('fichas_jogo').select('*')
    .eq('equipa', 'ra').in('jogo_id', ids).order('ordem');
  if (!data) return [];

  // Jogadores que entraram como sub (via eventos)
  const { data: evts } = await supabase
    .from('eventos_jogo')
    .select('jogador2, jogo_id')
    .eq('equipa', 'ra')
    .eq('tipo', 'substituicao')
    .in('jogo_id', ids);
  const subEntrou = new Set((evts ?? []).map(e => `${e.jogo_id}::${e.jogador2}`));

  const map = new Map<string, JogadorPlantelDB>();
  for (const row of data) {
    const k = row.nome.trim();
    if (!map.has(k)) map.set(k, { nome:k, numero:row.numero, posicao:row.posicao??undefined, jogosTitular:0, jogosSuplente:0, jogosTotal:0 });
    const e = map.get(k)!;
    if (row.tipo === 'titular') { e.jogosTitular++; e.jogosTotal++; }
    else if (row.tipo === 'suplente' && subEntrou.has(`${row.jogo_id}::${row.nome.trim()}`)) {
      e.jogosSuplente++; e.jogosTotal++;
    }
  }
  const POS_ORDER: Record<string,number> = { GR:100, DC:80, DD:80, DE:80, MDC:60, MI:60, ME:60, MAD:40, MAM:40, MAE:40, MC:40, AV:20 };
  return Array.from(map.values()).sort((a,b) => {
    const pa = POS_ORDER[a.posicao??'']??0, pb = POS_ORDER[b.posicao??'']??0;
    return pb!==pa ? pb-pa : b.jogosTotal-a.jogosTotal;
  });
}

// ── Admin: CRUD ───────────────────────────────────────────────
export async function upsertJogo(jogo: Partial<Record<string,unknown>> & { id: string }) {
  return supabase.from('jogos').upsert(jogo);
}

export async function upsertEvento(ev: Record<string,unknown>) {
  return supabase.from('eventos_jogo').upsert(ev);
}

export async function deleteEvento(id: string) {
  return supabase.from('eventos_jogo').delete().eq('id', id);
}

export async function upsertFicha(ficha: Record<string,unknown>) {
  return supabase.from('fichas_jogo').upsert(ficha);
}

export async function deleteFicha(id: string) {
  return supabase.from('fichas_jogo').delete().eq('id', id);
}

export async function upsertEstatisticas(stats: Record<string,unknown> & { jogo_id: string }) {
  return supabase.from('estatisticas_jogo').upsert(stats);
}

// ── Fichas completas de uma época (para stats de jogadores) ──
export async function getFichasEpocaDB(epoca: string): Promise<import('./mock-jogos-equipa').FichaData[]> {
  const { data: jogos } = await supabase
    .from('jogos').select('*').eq('epoca', epoca);
  if (!jogos?.length) return [];

  const results = await Promise.all(jogos.map(async jogo => {
    const [{ data: fichas }, { data: evts }] = await Promise.all([
      supabase.from('fichas_jogo').select('*').eq('jogo_id', jogo.id).order('ordem'),
      supabase.from('eventos_jogo').select('*').eq('jogo_id', jogo.id).order('ordem'),
    ]);
    const mapP = (r: Record<string,unknown>) => ({
      numero: r.numero as number, nome: r.nome as string,
      posicao: r.posicao as string | undefined,
      capitao: Boolean(r.capitao),
    });
    return {
      gameId: jogo.id, jornada: jogo.jornada, data: jogo.data,
      adversario: jogo.adversario, local: jogo.local as 'casa'|'fora',
      resultado: jogo.resultado as 'V'|'E'|'D',
      golos_ra: jogo.golos_ra, golos_adv: jogo.golos_adv,
      titulares: (fichas??[]).filter(f=>f.equipa==='ra'&&f.tipo==='titular').map(mapP),
      suplentes: (fichas??[]).filter(f=>f.equipa==='ra'&&f.tipo==='suplente').map(mapP),
      eventos: (evts??[]).map(e => ({
        minuto: e.minuto, minuto_extra: e.minuto_extra??undefined,
        tipo: e.tipo, equipa: e.equipa, jogador: e.jogador,
        jogador2: e.jogador2??undefined,
        score_ra: e.score_ra??undefined, score_adv: e.score_adv??undefined,
      })),
    };
  }));
  return results;
}

// ── Jogadores ─────────────────────────────────────────────────
export interface JogadorDB {
  id: string;
  nome_display: string;
  posicao: string;
  numero?: number;
  ativo?: boolean;
}

export async function getJogadoresEpoca(epoca: string): Promise<JogadorDB[]> {
  const { data, error } = await supabase
    .from('jogadores_epoca')
    .select('epoca, numero, ativo, jogadores(id, nome_display, posicao)')
    .eq('epoca', epoca)
    .order('numero');
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.jogadores.id,
    nome_display: row.jogadores.nome_display,
    posicao: row.jogadores.posicao,
    numero: row.numero,
    ativo: row.ativo,
  }));
}

export async function getAllJogadores(): Promise<JogadorDB[]> {
  const { data } = await supabase
    .from('jogadores')
    .select('*')
    .order('nome_display');
  return (data ?? []) as JogadorDB[];
}

export async function upsertJogador(j: { nome_display: string; posicao: string }) {
  return supabase.from('jogadores').upsert(j, { onConflict: 'nome_display' }).select().single();
}

export async function upsertJogadorEpoca(jogador_id: string, epoca: string, numero: number, ativo = true) {
  return supabase.from('jogadores_epoca').upsert(
    { jogador_id, epoca, numero, ativo },
    { onConflict: 'jogador_id,epoca' }
  );
}

export async function deleteJogadorEpoca(jogador_id: string, epoca: string) {
  return supabase.from('jogadores_epoca').delete().eq('jogador_id', jogador_id).eq('epoca', epoca);
}
