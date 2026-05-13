// src/lib/mock-jogos-equipa.ts
// Todos os jogos do Rio Ave FC · Época 2025/26
// Fonte: zerozero.pt / recolha manual por Daniel Silva · Sócio 3883
//
// NOTA ARQUITECTURAL:
// Este ficheiro é a FONTE ÚNICA DE DADOS para jogos da equipa.
// Os separadores de Assistências nos Arcos, Golos, etc.
// deverão no futuro ser derivados daqui (e não de mock-data.ts separado).
//
// CONVENÇÃO DE SCORE NA IMAGEM ZEROZERO:
//   (C) Casa  → score mostrado como RA-ADV
//   (F) Fora  → score mostrado como ADV-RA (home-away convencional)
// Aqui guardamos SEMPRE do ponto de vista do Rio Ave:
//   golos_ra  = golos marcados pelo Rio Ave
//   golos_adv = golos marcados pelo adversário

export type Competicao = 'liga' | 'taca-pt' | 'taca-liga' | 'europa' | 'amigavel';
export type Local = 'casa' | 'fora';
export type Resultado = 'V' | 'E' | 'D';

export interface PartidaEquipa {
  id: string;
  epoca: string;
  competicao: Competicao;
  competicao_label: string;
  jornada: string;
  data: string;
  hora: string;
  local: Local;
  adversario: string;
  golos_ra: number;
  golos_adv: number;
  resultado: Resultado;
  espectadores?: number;
  estadio?: string;
  formacao_ra?: string;
  formacao_adv?: string;
  arbitro?: string;
  hasDetail?: boolean;    // true quando há stats/eventos disponíveis
  publicado: boolean;
}

// ─── Helper ──────────────────────────────────────────────────
function resultado(ra: number, adv: number): Resultado {
  if (ra > adv) return 'V';
  if (ra === adv) return 'E';
  return 'D';
}

// ─── 2025/26 · Liga Portugal Betclic ─────────────────────────
// Nota: J1 (F) Benfica foi remarcado — realizado em 2025-09-23
// J20 (C) Arouca confirmado como jogo em casa (att: 1842)
// Taça: 3E = 3ª Eliminatória

const LIGA_2526: Omit<PartidaEquipa, 'id' | 'resultado' | 'publicado'>[] = [
  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J1',
    data:'2025-09-23', hora:'20:15', local:'fora', adversario:'S.L. Benfica',
    golos_ra:1, golos_adv:1, estadio:'Estádio da Luz' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J2',
    data:'2025-08-17', hora:'15:30', local:'casa', adversario:'Nacional',
    golos_ra:1, golos_adv:1, espectadores:2452 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J3',
    data:'2025-08-23', hora:'20:30', local:'fora', adversario:'FC Arouca',
    golos_ra:3, golos_adv:3, estadio:'Estádio Municipal de Arouca' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J4',
    data:'2025-08-31', hora:'20:30', local:'casa', adversario:'SC Braga',
    golos_ra:2, golos_adv:2, espectadores:3250 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J5',
    data:'2025-09-13', hora:'15:30', local:'fora', adversario:'Moreirense',
    golos_ra:1, golos_adv:3, estadio:'Estádio Comendador Joaquim de Almeida Freitas' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J6',
    data:'2025-09-19', hora:'20:15', local:'casa', adversario:'FC Porto',
    golos_ra:0, golos_adv:3, espectadores:4624 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J7',
    data:'2025-09-28', hora:'20:30', local:'fora', adversario:'FC Famalicão',
    golos_ra:0, golos_adv:0, estadio:'Estádio Municipal de Famalicão' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J8',
    data:'2025-10-05', hora:'17:30', local:'casa', adversario:'CD Tondela',
    golos_ra:3, golos_adv:0, espectadores:2066 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J9',
    data:'2025-10-25', hora:'20:30', local:'fora', adversario:'Est. Amadora',
    golos_ra:2, golos_adv:1, estadio:'Estádio José Gomes' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J10',
    data:'2025-11-01', hora:'18:00', local:'casa', adversario:'Estoril Praia',
    golos_ra:0, golos_adv:4, espectadores:2039 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J11',
    data:'2025-11-08', hora:'15:30', local:'fora', adversario:'FC Alverca',
    golos_ra:1, golos_adv:1, estadio:'Estádio Municipal de Alverca' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J12',
    data:'2025-11-30', hora:'15:30', local:'casa', adversario:'Santa Clara',
    golos_ra:1, golos_adv:1, espectadores:2098 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J13',
    data:'2025-12-06', hora:'18:00', local:'fora', adversario:'AFS',
    golos_ra:2, golos_adv:1, estadio:'Estádio do Fontelo' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J14',
    data:'2025-12-13', hora:'18:00', local:'casa', adversario:'Vitória SC',
    golos_ra:0, golos_adv:1, espectadores:2521 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J15',
    data:'2025-12-20', hora:'18:00', local:'fora', adversario:'Gil Vicente',
    golos_ra:2, golos_adv:2, estadio:'Estádio Cidade de Barcelos' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J16',
    data:'2025-12-28', hora:'20:30', local:'fora', adversario:'Sporting CP',
    golos_ra:0, golos_adv:4, estadio:'Estádio de Alvalade' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J17',
    data:'2026-01-04', hora:'15:30', local:'casa', adversario:'Casa Pia AC',
    golos_ra:3, golos_adv:1, espectadores:2067 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J18',
    data:'2026-01-17', hora:'20:30', local:'casa', adversario:'S.L. Benfica',
    golos_ra:0, golos_adv:2, espectadores:4435 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J19',
    data:'2026-01-25', hora:'15:30', local:'fora', adversario:'Nacional',
    golos_ra:0, golos_adv:4, estadio:'Estádio da Madeira' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J20',
    data:'2026-02-01', hora:'18:00', local:'casa', adversario:'FC Arouca',
    golos_ra:0, golos_adv:3, espectadores:1842 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J21',
    data:'2026-02-08', hora:'18:00', local:'fora', adversario:'SC Braga',
    golos_ra:0, golos_adv:3, estadio:'Estádio Municipal de Braga' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J22',
    data:'2026-02-16', hora:'20:15', local:'casa', adversario:'Moreirense',
    golos_ra:1, golos_adv:2, espectadores:2041 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J23',
    data:'2026-02-22', hora:'20:30', local:'fora', adversario:'FC Porto',
    golos_ra:0, golos_adv:1, estadio:'Estádio do Dragão' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J24',
    data:'2026-03-01', hora:'20:30', local:'casa', adversario:'FC Famalicão',
    golos_ra:0, golos_adv:0, espectadores:2595 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J25',
    data:'2026-03-09', hora:'20:15', local:'fora', adversario:'CD Tondela',
    golos_ra:1, golos_adv:0, estadio:'Estádio João Cardoso' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J26',
    data:'2026-03-15', hora:'18:00', local:'casa', adversario:'Est. Amadora',
    golos_ra:2, golos_adv:1, espectadores:2885 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J27',
    data:'2026-03-22', hora:'15:30', local:'fora', adversario:'Estoril Praia',
    golos_ra:2, golos_adv:1, estadio:'Estádio António Coimbra da Mota' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J28',
    data:'2026-04-04', hora:'18:00', local:'casa', adversario:'FC Alverca',
    golos_ra:1, golos_adv:2, espectadores:2284 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J29',
    data:'2026-04-11', hora:'18:00', local:'fora', adversario:'Santa Clara',
    golos_ra:2, golos_adv:0, estadio:'Estádio de São Miguel' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J30',
    data:'2026-04-17', hora:'20:45', local:'casa', adversario:'AFS',
    golos_ra:2, golos_adv:2, espectadores:2158 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J31',
    data:'2026-04-25', hora:'20:30', local:'fora', adversario:'Vitória SC',
    golos_ra:0, golos_adv:2, estadio:'Estádio D. Afonso Henriques' },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J32',
    data:'2026-05-03', hora:'20:30', local:'casa', adversario:'Gil Vicente',
    golos_ra:0, golos_adv:0, espectadores:2801,
    formacao_ra:'4-4-2', formacao_adv:'4-2-3-1',
    arbitro:'Fábio Veríssimo',
    hasDetail: true },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J33',
    data:'2026-05-11', hora:'20:15', local:'casa', adversario:'Sporting CP',
    golos_ra:1, golos_adv:4, espectadores:3742,
    formacao_ra:'4-4-2', formacao_adv:'4-2-3-1',
    arbitro:'João Gonçalves',
    hasDetail: true },
];

const TACA_2526: Omit<PartidaEquipa, 'id' | 'resultado' | 'publicado'>[] = [
  { epoca:'25/26', competicao:'taca-pt', competicao_label:'Taça de Portugal', jornada:'3ª Elim.',
    data:'2025-10-19', hora:'15:00', local:'fora', adversario:'Sintrense',
    golos_ra:2, golos_adv:3, estadio:'Estádio de Sintra' },
];

// ─── Exportação final ─────────────────────────────────────────
export const JOGOS_2526: PartidaEquipa[] = [
  ...LIGA_2526,
  ...TACA_2526,
].map((j, i) => ({
  ...j,
  id: `25-26-${String(i + 1).padStart(2, '0')}`,
  resultado: resultado(j.golos_ra, j.golos_adv),
  publicado: true,
})).sort((a, b) => b.data.localeCompare(a.data)); // mais recente primeiro

// ─── Stats da época ───────────────────────────────────────────
export function calcularStatsEpoca(jogos: PartidaEquipa[]) {
  const v = jogos.filter(j => j.resultado === 'V').length;
  const e = jogos.filter(j => j.resultado === 'E').length;
  const d = jogos.filter(j => j.resultado === 'D').length;
  const gm = jogos.reduce((s, j) => s + j.golos_ra,  0);
  const gs = jogos.reduce((s, j) => s + j.golos_adv, 0);
  const ligaJogos = jogos.filter(j => j.competicao === 'liga');
  const ligaPts = ligaJogos.reduce((s, j) => s + (j.resultado==='V'?3:j.resultado==='E'?1:0), 0);
  return { v, e, d, gm, gs, total: jogos.length, ligaPts };
}

export function filtrarJogos(
  jogos: PartidaEquipa[],
  comp: string,
  local: string
): PartidaEquipa[] {
  return jogos.filter(j => {
    if (comp !== 'todas' && j.competicao !== comp) return false;
    if (local !== 'todos' && j.local !== local) return false;
    return true;
  });
}


// ─── Tipos para dados detalhados de jogo ─────────────────────
export type EquipaEvento = 'ra' | 'adv';

export interface EstatisticasJogo {
  posse_bola:             [number, number];
  remates:                [number, number];
  remates_baliza:         [number, number];
  remates_poste:          [number, number];
  grandes_oportunidades:  [number, number];
  assistencias:           [number, number];
  cruzamentos:            [number, number];
  cantos:                 [number, number];
  livres:                 [number, number];
  ataques:                [number, number];
  ataques_centro:         [number, number];
  ataques_esquerda:       [number, number];
  ataques_direita:        [number, number];
  defesas:                [number, number];
  penaltis:               [number, number];
  penaltis_defendidos:    [number, number];
  foras_jogo:             [number, number];
  faltas:                 [number, number];
  amarelos:               [number, number];
  vermelhos:              [number, number];
}

export type TipoEvento =
  | 'golo' | 'golo_penalidade' | 'auto_golo'
  | 'cartao_amarelo' | 'cartao_vermelho'
  | 'substituicao';

export interface EventoJogo {
  minuto: number;
  minuto_extra?: number;
  tipo: TipoEvento;
  equipa: EquipaEvento;
  jogador: string;
  jogador2?: string;
  descricao?: string;
  score_ra?: number;
  score_adv?: number;
}

export interface JogadorTitular {
  numero: number;
  nome: string;
  posicao?: string;
  capitao?: boolean;
}

export const STATS_J33_SPORTING: EstatisticasJogo = {
  posse_bola:            [41, 59],
  remates:               [9,  15],
  remates_baliza:        [2,   5],
  remates_poste:         [0,   0],
  grandes_oportunidades: [5,   5],
  assistencias:          [1,   1],
  cruzamentos:           [10, 18],
  cantos:                [5,   6],
  livres:                [2,   2],
  ataques:               [25, 29],
  ataques_centro:        [3,   1],
  ataques_esquerda:      [9,  14],
  ataques_direita:       [13, 14],
  defesas:               [2,   1],
  penaltis:              [0,   1],
  penaltis_defendidos:   [0,   0],
  foras_jogo:            [0,   0],
  faltas:                [9,   7],
  amarelos:              [3,   2],
  vermelhos:             [0,   0],
};

export const EVENTOS_J33_SPORTING: EventoJogo[] = [
  { minuto: 12, tipo:'golo',           equipa:'ra',  jogador:'Bezerra',      jogador2:'Monteiro T.',  score_ra:1, score_adv:0 },
  { minuto: 13, tipo:'cartao_amarelo', equipa:'ra',  jogador:'Bezerra',      descricao:'Conduta anti-desportiva' },
  { minuto: 32, tipo:'cartao_amarelo', equipa:'adv', jogador:'O. Diamande',  descricao:'Conduta anti-desportiva' },
  { minuto: 32, tipo:'cartao_amarelo', equipa:'adv', jogador:'Suárez L.',    descricao:'Simulação' },
  { minuto: 33, tipo:'cartao_amarelo', equipa:'ra',  jogador:'Petrasso F.',  descricao:'Puxão' },
  { minuto: 35, tipo:'golo_penalidade',equipa:'adv', jogador:'Suárez L.',    score_ra:1, score_adv:1 },
  { minuto: 42, tipo:'auto_golo',      equipa:'ra',  jogador:'Gustavo M.',   score_ra:1, score_adv:2 },
  { minuto: 52, tipo:'cartao_vermelho',equipa:'ra',  jogador:'Petrasso F.',  descricao:'Má conduta (2º amarelo)' },
  { minuto: 55, tipo:'substituicao',   equipa:'ra',  jogador:'Tamble',       jogador2:'Brabec J.' },
  { minuto: 63, tipo:'substituicao',   equipa:'ra',  jogador:'Vrousai',      jogador2:'Tomé J.' },
  { minuto: 65, tipo:'substituicao',   equipa:'adv', jogador:'L. Guilherme', jogador2:'Geny Catamo' },
  { minuto: 65, tipo:'substituicao',   equipa:'adv', jogador:'Morita H.',    jogador2:'Quenda G.' },
  { minuto: 66, tipo:'golo',           equipa:'adv', jogador:'Trincão',      jogador2:'Diomande O.', score_ra:1, score_adv:3 },
  { minuto: 72, tipo:'substituicao',   equipa:'ra',  jogador:'Nelson',       jogador2:'Richards O.' },
  { minuto: 72, tipo:'substituicao',   equipa:'ra',  jogador:'Bezerra',      jogador2:'Papakanellos A.' },
  { minuto: 72, tipo:'substituicao',   equipa:'ra',  jogador:'Spikic',       jogador2:'Ntoi A.' },
  { minuto: 82, tipo:'substituicao',   equipa:'adv', jogador:'Pedro G.',     jogador2:'E. Felicíssimo' },
  { minuto: 82, tipo:'substituicao',   equipa:'adv', jogador:'D. Bragança',  jogador2:'Kochorashvili G.' },
  { minuto: 83, tipo:'cartao_amarelo', equipa:'ra',  jogador:'Ryan G.',      descricao:'Má conduta' },
  { minuto: 85, tipo:'cartao_vermelho',equipa:'ra',  jogador:'Ryan G.',      descricao:'Má conduta (2º amarelo)' },
  { minuto: 90, tipo:'golo',           equipa:'adv', jogador:'Quenda G.',    jogador2:'Araújo M.',   score_ra:1, score_adv:4 },
  { minuto:90, minuto_extra:1, tipo:'substituicao', equipa:'adv', jogador:'Suárez L.', jogador2:'Nel R.' },
];

export const TITULARES_RA_J33: JogadorTitular[] = [
  { numero:  1, nome:'Miszta',       posicao:'GR' },
  { numero: 17, nome:'Vrousai',      posicao:'DC', capitao:true },
  { numero: 21, nome:'Petrasso',     posicao:'DC' },
  { numero: 44, nome:'Nikitscher',   posicao:'DC' },
  { numero: 18, nome:'Spikic',       posicao:'DC' },
  { numero:  6, nome:'Nelson',       posicao:'ME' },
  { numero: 19, nome:'Gustavo M.',   posicao:'MI' },
  { numero:  8, nome:'Ryan G.',      posicao:'MI' },
  { numero: 11, nome:'Blesa',        posicao:'ME' },
  { numero:  7, nome:'Bezerra',      posicao:'AV' },
  { numero:  9, nome:'Tamble',       posicao:'AV' },
];

export const TITULARES_ADV_J33: JogadorTitular[] = [
  { numero:  1, nome:'Rui Silva',    posicao:'GR' },
  { numero: 72, nome:'E. Quaresma',  posicao:'DD' },
  { numero:  5, nome:'G. Inácio',    posicao:'DC', capitao:true },
  { numero: 23, nome:'D. Bragança',  posicao:'DC' },
  { numero: 20, nome:'M. Araújo',    posicao:'DE' },
  { numero:  8, nome:'Pedro G.',     posicao:'MDC' },
  { numero:  3, nome:'Morita H.',    posicao:'MDC' },
  { numero: 17, nome:'Trincão',      posicao:'MD' },
  { numero: 26, nome:'O. Diamande',  posicao:'MAM' },
  { numero: 31, nome:'L. Guilherme', posicao:'ME' },
  { numero: 87, nome:'Suárez L.',    posicao:'AV' },
];

export const SUPLENTES_RA_J33: JogadorTitular[] = [
  { numero: 30, nome:'Ennio Gouw' },
  { numero: 77, nome:'Andreas Ntoi' },
  { numero: 25, nome:'Antonios Papakanellos' },
  { numero: 14, nome:'João Tomé' },
  { numero: 55, nome:'Jakub Brabec' },
  { numero: 24, nome:'Georgios Liavas' },
  { numero: 40, nome:'Lomboto' },
  { numero: 77, nome:'Omar Richards' },
  { numero: 80, nome:'Olinho' },
];

export const SUPLENTES_ADV_J33: JogadorTitular[] = [
  { numero: 71, nome:'João Virginia' },
  { numero:  7, nome:'Geovany Quenda' },
  { numero: 77, nome:'Geny Catamo' },
  { numero: 18, nome:'Giorgi Kochorashvili' },
  { numero: 14, nome:'Souleymane Faye' },
  { numero: 70, nome:'Salvador Blopa' },
  { numero: 73, nome:'Eduardo Felicíssimo' },
  { numero: 90, nome:'Rafael Nel' },
  { numero: 91, nome:'Ricardo Mangas' },
];

// ─── Dados detalhados · J32 · Rio Ave 0-0 Gil Vicente ────────
export const STATS_J32_GIL: EstatisticasJogo = {
  posse_bola:            [50, 50],
  remates:               [15, 16],
  remates_baliza:        [ 2,  9],
  remates_poste:         [ 0,  0],
  grandes_oportunidades: [ 3,  6],
  assistencias:          [ 0,  0],
  cruzamentos:           [18, 25],
  cantos:                [ 9,  7],
  livres:                [ 3,  1],
  ataques:               [30, 32],
  ataques_centro:        [ 3,  2],
  ataques_esquerda:      [18, 17],
  ataques_direita:       [11, 13],
  defesas:               [ 3,  3],
  penaltis:              [ 0,  0],
  penaltis_defendidos:   [ 0,  0],
  foras_jogo:            [ 3,  1],
  faltas:                [ 9, 13],
  amarelos:              [ 1,  2],
  vermelhos:             [ 0,  0],
};

export const EVENTOS_J32_GIL: EventoJogo[] = [
  // ── 2ª Parte ──────────────────────────────────────
  { minuto: 46, tipo:'substituicao',   equipa:'adv', jogador:'Martín',    jogador2:'Agustín Morales', descricao:'intervalo' },
  { minuto: 58, tipo:'substituicao',   equipa:'adv', jogador:'Héctor',    jogador2:'G. Varela' },
  { minuto: 63, tipo:'substituicao',   equipa:'ra',  jogador:'Spikic',    jogador2:'Olinho' },
  { minuto: 63, tipo:'cartao_amarelo', equipa:'ra',  jogador:'Ryan G.' },
  { minuto: 69, tipo:'cartao_amarelo', equipa:'adv', jogador:'Zé Carlos' },
  { minuto: 79, tipo:'substituicao',   equipa:'adv', jogador:'Zé Carlos', jogador2:'Bermejo' },
  { minuto: 83, tipo:'substituicao',   equipa:'ra',  jogador:'Nelson',    jogador2:'Richards O.' },
  { minuto: 83, tipo:'substituicao',   equipa:'ra',  jogador:'Vrousai',   jogador2:'Tomé J.' },
  { minuto: 87, tipo:'substituicao',   equipa:'ra',  jogador:'Tamble',    jogador2:'Papakanellos A.' },
  { minuto: 87, tipo:'substituicao',   equipa:'adv', jogador:'Murilo',    jogador2:'Carlos Eduardo' },
  { minuto: 87, tipo:'substituicao',   equipa:'ra',  jogador:'Ryan G.',   jogador2:'Liavas G.' },
  { minuto: 88, tipo:'cartao_amarelo', equipa:'adv', jogador:'Elimbi' },
];

export const TITULARES_RA_J32: JogadorTitular[] = [
  { numero:  1, nome:'Miszta',       posicao:'GR' },
  { numero: 17, nome:'Vrousai',      posicao:'DC', capitao:true },
  { numero: 23, nome:'Petrasso',     posicao:'DC' },
  { numero: 44, nome:'Nikitscher',   posicao:'DC' },
  { numero: 18, nome:'Spikic',       posicao:'DC' },
  { numero:  6, nome:'Nelson',       posicao:'ME' },
  { numero: 39, nome:'Gustavo M.',   posicao:'MI' },
  { numero:  8, nome:'Ryan G.',      posicao:'MI' },
  { numero: 11, nome:'Blesa',        posicao:'ME' },
  { numero:  7, nome:'Bezerra',      posicao:'AV' },
  { numero:  9, nome:'Tamble',       posicao:'AV' },
];

export const SUPLENTES_RA_J32: JogadorTitular[] = [
  { numero: 30, nome:'Ennio Gouw' },
  { numero: 25, nome:'Rafael' },
  { numero: 19, nome:'Papakanellos A.' },
  { numero: 14, nome:'Tomé J.' },
  { numero: 32, nome:'Brabec J.' },
  { numero: 54, nome:'Liavas G.' },
  { numero: 53, nome:'Lomboto' },
  { numero: 77, nome:'Richards O.' },
  { numero: 80, nome:'Olinho' },
];

export const TITULARES_ADV_J32: JogadorTitular[] = [
  { numero: 99, nome:'D. Figueira',  posicao:'GR' },
  { numero:  2, nome:'Zé Carlos',    posicao:'DD', capitao:true },
  { numero: 39, nome:'Buatu M.',     posicao:'DC' },
  { numero: 32, nome:'Martín',       posicao:'DC' },
  { numero:  3, nome:'G. Konan',     posicao:'DE' },
  { numero: 10, nome:'L. Esteves',   posicao:'MDC' },
  { numero: 23, nome:'Héctor',       posicao:'MDC' },
  { numero: 95, nome:'Santi G.',     posicao:'MAD' },
  { numero: 77, nome:'Murilo',       posicao:'MAE' },
  { numero:  6, nome:'Zé Carlos',    posicao:'MAM' },
  { numero:  4, nome:'Elimbi',       posicao:'AV' },
];

export const SUPLENTES_ADV_J32: JogadorTitular[] = [
  { numero: 30, nome:'Lucas Azevedo' },
  { numero:  5, nome:'Facundo Cáseres' },
  { numero: 11, nome:'Joelson Fernandes' },
  { numero: 17, nome:'Sergio Lillo' },
  { numero: 20, nome:'Hevertton Santos' },
  { numero: 27, nome:'Agustín Morales' },
  { numero: 29, nome:'Carlos Eduardo' },
  { numero: 48, nome:'Antonio Espigares' },
  { numero: 39, nome:'Gustavo Varela' },
];

// ─── Ficha de jogo para cálculo de stats ─────────────────────
export interface FichaData {
  gameId: string; jornada: string; data: string;
  adversario: string; local: 'casa' | 'fora';
  resultado: 'V' | 'E' | 'D';
  golos_ra: number; golos_adv: number;
  titulares: JogadorTitular[];
  suplentes: JogadorTitular[];
  eventos: EventoJogo[];
}

// Todas as fichas disponíveis por época
export const FICHAS_RA: Record<string, FichaData[]> = {
  '25/26': [
    { gameId:'25-26-32', jornada:'J32', data:'2026-05-03',
      adversario:'Gil Vicente', local:'casa', resultado:'E', golos_ra:0, golos_adv:0,
      titulares:TITULARES_RA_J32, suplentes:SUPLENTES_RA_J32, eventos:EVENTOS_J32_GIL },
    { gameId:'25-26-33', jornada:'J33', data:'2026-05-11',
      adversario:'Sporting CP', local:'casa', resultado:'D', golos_ra:1, golos_adv:4,
      titulares:TITULARES_RA_J33, suplentes:SUPLENTES_RA_J33, eventos:EVENTOS_J33_SPORTING },
  ],
};

export const TOTAL_JOGOS_EPOCA: Record<string, number> = { '25/26': 34 };

// ─── Plantel derivado das fichas de jogo ─────────────────────
export interface JogadorPlantel {
  nome: string; numero: number; posicao?: string;
  jogosTitular: number; jogosSuplente: number; jogosTotal: number;
}

const POS_ORDER: Record<string, number> = {
  GR:100, DC:80, DD:80, DE:80, MDC:60, MI:60, ME:60, MAD:40, MAM:40, MAE:40, AV:20,
};

export function getRosterRA(epoca: string): JogadorPlantel[] {
  const fichas = FICHAS_RA[epoca] ?? [];
  const map = new Map<string, JogadorPlantel>();

  function getOrCreate(nome: string, numero: number, posicao?: string) {
    const k = nome.trim();
    if (!map.has(k)) map.set(k, { nome:k, numero, posicao, jogosTitular:0, jogosSuplente:0, jogosTotal:0 });
    return map.get(k)!;
  }

  for (const f of fichas) {
    // Titulares
    f.titulares.forEach(p => { const e = getOrCreate(p.nome, p.numero, p.posicao); e.jogosTitular++; e.jogosTotal++; });

    // Suplentes que efetivamente entraram (via evento substituicao)
    const entrou = new Set(
      f.eventos
        .filter(e => e.tipo === 'substituicao' && e.equipa === 'ra' && e.jogador2)
        .map(e => e.jogador2!.trim())
    );
    f.suplentes.forEach(p => {
      if (entrou.has(p.nome.trim())) {
        const e = getOrCreate(p.nome, p.numero, p.posicao);
        e.jogosSuplente++;
        e.jogosTotal++;
      }
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    const pa = POS_ORDER[a.posicao ?? ''] ?? 0;
    const pb = POS_ORDER[b.posicao ?? ''] ?? 0;
    if (pb !== pa) return pb - pa;
    return b.jogosTotal - a.jogosTotal;
  });
}

// ─── Stats por jogador ────────────────────────────────────────
export interface PartidaStat {
  gameId: string; jornada: string; data: string;
  adversario: string; local: 'casa' | 'fora';
  resultado: 'V' | 'E' | 'D'; golos_ra: number; golos_adv: number;
  foiTitular: boolean; entrou: boolean; minutosJogados: number;
  golosMarcados: number; assistencias: number;
  cartoesAmarelos: number; cartoesVermelhos: number;
  golosSofridosEmCampo: number;
}

export interface JogadorStats {
  nome: string; numero: number; posicao?: string; isGR: boolean;
  epoca: string;
  jogosTotal: number; jogosTitular: number; jogosSuplente: number;
  minutosJogados: number;
  golosMarcados: number; assistencias: number;
  cartoesAmarelos: number; cartoesVermelhos: number;
  golosSofridosEmCampo: number;
  vitorias: number; empates: number; derrotas: number;
  vitoriasTitular: number;
  partidas: PartidaStat[];
}

function minuto(e: EventoJogo) { return e.minuto + (e.minuto_extra ?? 0); }

function calcMinutos(nome: string, titulares: JogadorTitular[], eventos: EventoJogo[]): number {
  const k = nome.trim();
  const isTit = titulares.some(p => p.nome.trim() === k);
  if (isTit) {
    const saiu = eventos.find(e => e.tipo === 'substituicao' && e.equipa === 'ra' && e.jogador.trim() === k);
    return saiu ? minuto(saiu) : 90;
  }
  const entrou = eventos.find(e => e.tipo === 'substituicao' && e.equipa === 'ra' && e.jogador2?.trim() === k);
  return entrou ? Math.max(0, 90 - minuto(entrou)) : 0;
}

function estavaCampo(nome: string, min: number, titulares: JogadorTitular[], eventos: EventoJogo[]): boolean {
  const k = nome.trim();
  const isTit = titulares.some(p => p.nome.trim() === k);
  if (isTit) {
    const saiu = eventos.find(e => e.tipo === 'substituicao' && e.equipa === 'ra' && e.jogador.trim() === k);
    return !saiu || minuto(saiu) > min;
  }
  const entrou = eventos.find(e => e.tipo === 'substituicao' && e.equipa === 'ra' && e.jogador2?.trim() === k);
  return entrou ? minuto(entrou) <= min : false;
}

export function getPlayerStats(nome: string, epoca: string): JogadorStats | null {
  const fichas = FICHAS_RA[epoca] ?? [];
  const k = nome.trim();

  // Find player info
  let numero = 0; let posicao: string | undefined;
  for (const f of fichas) {
    const p = [...f.titulares, ...f.suplentes].find(p => p.nome.trim() === k);
    if (p) { numero = p.numero; posicao = p.posicao; break; }
  }
  if (!numero && !posicao) return null;

  const isGR = posicao === 'GR';
  const partidas: PartidaStat[] = [];

  for (const f of fichas) {
    const mins = calcMinutos(k, f.titulares, f.eventos);
    if (mins === 0) continue; // didn't play

    const foiTitular = f.titulares.some(p => p.nome.trim() === k);
    const entrou     = !foiTitular;

    // Goals + assists
    const goalTypes = ['golo','golo_penalidade'];
    const golosMarcados = f.eventos.filter(e => goalTypes.includes(e.tipo) && e.equipa === 'ra' && e.jogador.trim() === k).length;
    const assistencias  = f.eventos.filter(e => goalTypes.includes(e.tipo) && e.equipa === 'ra' && e.jogador2?.trim() === k).length;

    // Cards
    const cartoesAmarelos  = f.eventos.filter(e => e.tipo === 'cartao_amarelo'  && e.equipa === 'ra' && e.jogador.trim() === k).length;
    const cartoesVermelhos = f.eventos.filter(e => e.tipo === 'cartao_vermelho' && e.equipa === 'ra' && e.jogador.trim() === k).length;

    // Goals conceded while on field
    const goalsConceded = f.eventos.filter(e => {
      const isAdvGoal = (e.tipo === 'golo' || e.tipo === 'golo_penalidade') && e.equipa === 'adv';
      const isOwnGoal = e.tipo === 'auto_golo' && e.equipa === 'ra';
      if (!isAdvGoal && !isOwnGoal) return false;
      return estavaCampo(k, minuto(e), f.titulares, f.eventos);
    }).length;

    partidas.push({
      gameId: f.gameId, jornada: f.jornada, data: f.data,
      adversario: f.adversario, local: f.local, resultado: f.resultado,
      golos_ra: f.golos_ra, golos_adv: f.golos_adv,
      foiTitular, entrou, minutosJogados: mins,
      golosMarcados, assistencias, cartoesAmarelos, cartoesVermelhos,
      golosSofridosEmCampo: goalsConceded,
    });
  }

  const jogosTotal     = partidas.length;
  const jogosTitular   = partidas.filter(p => p.foiTitular).length;
  const jogosSuplente  = partidas.filter(p => p.entrou).length;
  const minutosJogados = partidas.reduce((s, p) => s + p.minutosJogados, 0);
  const vitorias       = partidas.filter(p => p.resultado === 'V').length;
  const empates        = partidas.filter(p => p.resultado === 'E').length;
  const derrotas       = partidas.filter(p => p.resultado === 'D').length;
  const vitoriasTitular = partidas.filter(p => p.foiTitular && p.resultado === 'V').length;

  return {
    nome: k, numero, posicao, isGR, epoca,
    jogosTotal, jogosTitular, jogosSuplente, minutosJogados,
    golosMarcados: partidas.reduce((s, p) => s + p.golosMarcados, 0),
    assistencias: partidas.reduce((s, p) => s + p.assistencias, 0),
    cartoesAmarelos: partidas.reduce((s, p) => s + p.cartoesAmarelos, 0),
    cartoesVermelhos: partidas.reduce((s, p) => s + p.cartoesVermelhos, 0),
    golosSofridosEmCampo: partidas.reduce((s, p) => s + p.golosSofridosEmCampo, 0),
    vitorias, empates, derrotas, vitoriasTitular, partidas,
  };
}
