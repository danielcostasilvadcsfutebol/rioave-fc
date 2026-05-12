// src/lib/mock-data.ts
// ─────────────────────────────────────────────────────────────
//  ATENÇÃO: Este ficheiro NÃO contém dados hardcoded.
//  Todos os dados são derivados de mock-jogos-equipa.ts,
//  que é a ÚNICA fonte de verdade para jogos do Rio Ave FC.
//
//  Quando a BD Supabase estiver ativa, este ficheiro é
//  substituído pelas funções de supabase-client.ts.
// ─────────────────────────────────────────────────────────────

import { JOGOS_2526, type PartidaEquipa } from './mock-jogos-equipa';
import type { JogoComRelacoes, ResumoEpoca } from '@/types';

// ── Constantes ────────────────────────────────────────────────
const CAP_ARCOS = 5300;

const ESTADIO_ARCOS = {
  id: 'est-arcos', nome: 'Estádio dos Arcos',
  cidade: 'Vila do Conde', capacidade: CAP_ARCOS, is_principal: true,
};
const COMP_LIGA = {
  id: 'comp-liga', nome: 'Liga Portugal Betclic', tipo: 'liga' as const, pais: 'Portugal',
};
const COMP_TACA = {
  id: 'comp-taca', nome: 'Taça de Portugal', tipo: 'taca' as const, pais: 'Portugal',
};
const EPOCA_2526 = {
  id: 'ep-25-26', nome: '25/26',
  ano_inicio: 2025, ano_fim: 2026,
  ativa: true, divisao: 'Liga Portugal Betclic',
};

// ── Converter PartidaEquipa → JogoComRelacoes ─────────────────
function toJogo(p: PartidaEquipa): JogoComRelacoes {
  const jornadaNum = p.jornada.startsWith('J') ? parseInt(p.jornada.slice(1)) : null;
  const comp = p.competicao === 'liga' ? COMP_LIGA : COMP_TACA;
  const estadio = p.local === 'casa'
    ? ESTADIO_ARCOS
    : { id: 'est-adv', nome: p.estadio ?? 'Estádio do adversário', cidade: '', capacidade: null, is_principal: false };

  return {
    id: p.id,
    jornada: jornadaNum,
    adversario: p.adversario,
    assistencia: p.espectadores ?? null,
    capacidade_jogo: p.local === 'casa' ? CAP_ARCOS : null,
    pct_ocupacao: (p.espectadores && p.local === 'casa')
      ? Math.round((p.espectadores / CAP_ARCOS) * 10000) / 100
      : null,
    jogo_porta_fechada: false,
    estadio_alternativo: false,
    local: p.local,
    notas: null,
    data_jogo: p.data,
    hora_jogo: p.hora,
    golos_ra: p.golos_ra,
    golos_adversario: p.golos_adv,
    publicado: p.publicado,
    publicado_em: null,
    epoca_id: EPOCA_2526.id,
    competicao_id: comp.id,
    estadio_id: estadio.id,
    epoca: EPOCA_2526,
    competicao: comp,
    estadio,
  };
}

// ── Épocas disponíveis ────────────────────────────────────────
// Crescerá à medida que forem inseridos dados de outras épocas
export const EPOCAS_ORDENADAS = ['25/26'];

// ── Assistências nos Arcos ────────────────────────────────────
// Apenas jogos em casa na Liga (com espectadores registados)
export function getJogosByEpoca(epoca: string): JogoComRelacoes[] {
  if (epoca !== '25/26') return [];
  return JOGOS_2526
    .filter(j => j.local === 'casa' && j.competicao === 'liga')
    .sort((a, b) => {
      const ja = a.jornada.startsWith('J') ? parseInt(a.jornada.slice(1)) : 0;
      const jb = b.jornada.startsWith('J') ? parseInt(b.jornada.slice(1)) : 0;
      return ja - jb;
    })
    .map(toJogo);
}

// ── Resumo histórico por época ────────────────────────────────
export const MOCK_RESUMO_EPOCAS: ResumoEpoca[] = (() => {
  const homeJogos = JOGOS_2526.filter(j => j.local === 'casa' && j.competicao === 'liga');
  const comEsp = homeJogos.filter(j => (j.espectadores ?? 0) > 0);
  const total = comEsp.reduce((s, j) => s + (j.espectadores ?? 0), 0);
  const media = homeJogos.length > 0 ? Math.round(total / homeJogos.length) : 0;
  return [{
    epoca: '25/26',
    ano_inicio: 2025,
    ativa: true,
    total_jogos: homeJogos.length,
    total_assistencia: total,
    media_assistencia: media,
    max_assistencia: comEsp.length ? Math.max(...comEsp.map(j => j.espectadores ?? 0)) : 0,
    min_assistencia: comEsp.length ? Math.min(...comEsp.map(j => j.espectadores ?? 0)) : 0,
  }];
})();

// ── KPIs ──────────────────────────────────────────────────────
export function calcularKpis(jogos: JogoComRelacoes[]) {
  const validos = jogos.filter(j => !j.jogo_porta_fechada && (j.assistencia ?? 0) > 0);
  const total   = jogos.reduce((s, j) => s + (j.assistencia ?? 0), 0);
  const media   = jogos.length ? Math.round(total / jogos.length) : 0;
  const maximo  = validos.length ? Math.max(...validos.map(j => j.assistencia ?? 0)) : 0;
  const minimo  = validos.length ? Math.min(...validos.map(j => j.assistencia ?? 0)) : 0;
  return {
    total, media, maximo, minimo,
    totalJogos: jogos.length,
    jogoMaximo: validos.find(j => j.assistencia === maximo),
    jogoMinimo: validos.find(j => j.assistencia === minimo),
    pctMedia: CAP_ARCOS > 0 ? ((media / CAP_ARCOS) * 100).toFixed(1) : '—',
  };
}

// ── Adversários ───────────────────────────────────────────────
export interface EstatAdversario {
  adversario: string;
  visitas: number;       // total de jogos esta época (casa + fora)
  jogos_arcos: number;   // jogos realizados nos Arcos
  media: number;         // média de espectadores nos Arcos
  maximo: number;        // recorde de espectadores nos Arcos
  total: number;         // total de espectadores nos Arcos
  epocas: number;        // nº de épocas distintas (para já: 1)
}

export function getEstatisticasAdversarios(): EstatAdversario[] {
  const map = new Map<string, {
    totalVisitas: number;
    arcosVisitas: number;
    arcosTotal: number;
    arcosMaximo: number;
  }>();

  for (const j of JOGOS_2526) {
    const key = j.adversario.trim();
    if (!map.has(key)) map.set(key, { totalVisitas: 0, arcosVisitas: 0, arcosTotal: 0, arcosMaximo: 0 });
    const e = map.get(key)!;
    e.totalVisitas++;
    if (j.local === 'casa' && j.espectadores) {
      e.arcosVisitas++;
      e.arcosTotal  += j.espectadores;
      e.arcosMaximo  = Math.max(e.arcosMaximo, j.espectadores);
    }
  }

  return Array.from(map.entries())
    .map(([adversario, e]) => ({
      adversario,
      visitas:    e.totalVisitas,
      jogos_arcos: e.arcosVisitas,
      media:  e.arcosVisitas > 0 ? Math.round(e.arcosTotal / e.arcosVisitas) : 0,
      maximo: e.arcosMaximo,
      total:  e.arcosTotal,
      epocas: 1,
    }))
    .sort((a, b) => b.maximo - a.maximo);
}

// ── Histórico de confrontos (jogos nos Arcos) ─────────────────
export interface HistoricoJogo {
  epoca: string;
  jornada: number;
  assistencia: number;
  estadio_alternativo: boolean;
  porta_fechada: boolean;
  ano_inicio: number;
}

export function getHistoricoAdversario(nome: string): HistoricoJogo[] {
  return JOGOS_2526
    .filter(j => j.adversario.trim() === nome.trim() && j.local === 'casa')
    .map(j => ({
      epoca:               j.epoca,
      jornada:             j.jornada.startsWith('J') ? parseInt(j.jornada.slice(1)) : 0,
      assistencia:         j.espectadores ?? 0,
      estadio_alternativo: false,
      porta_fechada:       (j.espectadores ?? 0) === 0,
      ano_inicio:          2025,
    }))
    .sort((a, b) => b.ano_inicio - a.ano_inicio || b.jornada - a.jornada);
}
