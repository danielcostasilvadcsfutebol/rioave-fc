import type { JogoComRelacoes, ResumoEpoca } from '@/types';

export const MOCK_ESTADIO_ARCOS = {
  id: 'est-arcos', nome: 'Estádio dos Arcos', cidade: 'Vila do Conde',
  capacidade: 5300, is_principal: true,
  notas: 'Bancada nascente demolida em 2019. Capacidade atual: 5300 espectadores.',
};
export const MOCK_COMPETICAO_LIGA = {
  id: 'comp-liga', nome: 'Liga Portugal Betclic', tipo: 'liga' as const, pais: 'Portugal',
};
export const MOCK_EPOCA_2526 = {
  id: 'ep-2526', nome: '2025/26', ano_inicio: 2025, ano_fim: 2026, ativa: true,
  divisao: 'Liga Portugal Betclic',
};

const CAP = 5300;
function pct(n: number) { return Math.round((n / CAP) * 10000) / 100; }

const raw = [
  { id: '1',  jornada: 1,  adversario: 'Nacional',    assistencia: 2452, data_jogo: '2025-08-10', hora_jogo: '18:00' },
  { id: '2',  jornada: 2,  adversario: 'S.C. Braga',  assistencia: 3250, data_jogo: '2025-08-24', hora_jogo: '20:30' },
  { id: '3',  jornada: 3,  adversario: 'F.C. Porto',  assistencia: 4624, data_jogo: '2025-09-14', hora_jogo: '20:15' },
  { id: '4',  jornada: 4,  adversario: 'Tondela',      assistencia: 2066, data_jogo: '2025-09-28', hora_jogo: '15:30' },
  { id: '5',  jornada: 5,  adversario: 'Estoril',      assistencia: 2039, data_jogo: '2025-10-05', hora_jogo: '15:30' },
  { id: '6',  jornada: 6,  adversario: 'Santa Clara',  assistencia: 2098, data_jogo: '2025-10-19', hora_jogo: '15:30' },
  { id: '7',  jornada: 7,  adversario: 'Vitória SC',   assistencia: 2521, data_jogo: '2025-11-02', hora_jogo: '18:00' },
  { id: '8',  jornada: 8,  adversario: 'Casa Pia',     assistencia: 2067, data_jogo: '2025-11-09', hora_jogo: '15:30' },
  { id: '9',  jornada: 9,  adversario: 'S.L. Benfica', assistencia: 4435, data_jogo: '2025-11-30', hora_jogo: '18:00' },
  { id: '10', jornada: 10, adversario: 'Arouca',       assistencia: 1842, data_jogo: '2025-12-07', hora_jogo: '15:30' },
  { id: '11', jornada: 11, adversario: 'Moreirense',   assistencia: 2041, data_jogo: '2025-12-21', hora_jogo: '15:30' },
  { id: '12', jornada: 12, adversario: 'Famalicão',    assistencia: 2595, data_jogo: '2026-01-11', hora_jogo: '15:30' },
  { id: '13', jornada: 13, adversario: 'Estrela',      assistencia: 2885, data_jogo: '2026-01-25', hora_jogo: '15:30' },
  { id: '14', jornada: 14, adversario: 'Alverca',      assistencia: 2284, data_jogo: '2026-02-08', hora_jogo: '15:30' },
  { id: '15', jornada: 15, adversario: 'AFS',          assistencia: 2158, data_jogo: '2026-02-22', hora_jogo: '15:30' },
  { id: '16', jornada: 16, adversario: 'Gil Vicente',  assistencia: 2801, data_jogo: '2026-03-08', hora_jogo: '15:30' },
];

export const MOCK_JOGOS_2526: JogoComRelacoes[] = raw.map(j => ({
  ...j,
  local: 'casa' as const,
  notas: null,
  capacidade_jogo: CAP,
  pct_ocupacao: pct(j.assistencia),
  golos_ra: null,
  golos_adversario: null,
  jogo_porta_fechada: false,
  estadio_alternativo: false,
  publicado: true,
  publicado_em: null,
  epoca_id: MOCK_EPOCA_2526.id,
  competicao_id: MOCK_COMPETICAO_LIGA.id,
  estadio_id: MOCK_ESTADIO_ARCOS.id,
  epoca: MOCK_EPOCA_2526,
  competicao: MOCK_COMPETICAO_LIGA,
  estadio: MOCK_ESTADIO_ARCOS,
}));

export const MOCK_RESUMO_EPOCAS: ResumoEpoca[] = [
  { epoca: '2025/26', ano_inicio: 2025, ativa: true,  total_jogos: 16, total_assistencia: 42158, media_assistencia: 2635, max_assistencia: 4624, min_assistencia: 1842 },
  { epoca: '2024/25', ano_inicio: 2024, ativa: false, total_jogos: 16, total_assistencia: 44243, media_assistencia: 2603, max_assistencia: 4756, min_assistencia:  689 },
  { epoca: '2023/24', ano_inicio: 2023, ativa: false, total_jogos: 17, total_assistencia: 53509, media_assistencia: 3148, max_assistencia: 4809, min_assistencia: 1865 },
  { epoca: '2022/23', ano_inicio: 2022, ativa: false, total_jogos: 17, total_assistencia: 49395, media_assistencia: 2906, max_assistencia: 4134, min_assistencia: 1492 },
  { epoca: '2021/22', ano_inicio: 2021, ativa: false, total_jogos: 17, total_assistencia: 23494, media_assistencia: 1382, max_assistencia: 3668, min_assistencia:  635 },
  { epoca: '2019/20', ano_inicio: 2019, ativa: false, total_jogos:  9, total_assistencia: 31247, media_assistencia: 1838, max_assistencia: 4434, min_assistencia:    0 },
  { epoca: '2018/19', ano_inicio: 2018, ativa: false, total_jogos: 17, total_assistencia: 61712, media_assistencia: 3630, max_assistencia: 8836, min_assistencia: 1159 },
  { epoca: '2017/18', ano_inicio: 2017, ativa: false, total_jogos: 17, total_assistencia: 66116, media_assistencia: 3889, max_assistencia: 8614, min_assistencia: 2011 },
  { epoca: '2016/17', ano_inicio: 2016, ativa: false, total_jogos: 17, total_assistencia: 67215, media_assistencia: 3954, max_assistencia: 8767, min_assistencia: 1508 },
  { epoca: '2015/16', ano_inicio: 2015, ativa: false, total_jogos: 17, total_assistencia: 56125, media_assistencia: 3301, max_assistencia: 9023, min_assistencia: 1615 },
];

export function calcularKpis(jogos: JogoComRelacoes[]) {
  const v = jogos.filter(j => j.assistencia != null && !j.jogo_porta_fechada);
  const total  = v.reduce((s, j) => s + (j.assistencia ?? 0), 0);
  const media  = v.length ? Math.round(total / v.length) : 0;
  const maximo = Math.max(...v.map(j => j.assistencia ?? 0));
  const minimo = Math.min(...v.map(j => j.assistencia ?? 0));
  return {
    total, media, maximo, minimo,
    totalJogos: jogos.length,
    jogoMaximo: v.find(j => j.assistencia === maximo),
    jogoMinimo: v.find(j => j.assistencia === minimo),
    pctMedia: CAP > 0 ? ((media / CAP) * 100).toFixed(1) : '—',
  };
}
