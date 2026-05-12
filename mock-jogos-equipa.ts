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
  jornada: string;          // ex: 'J1', 'J33', '3E', 'QF', 'SF'
  data: string;             // ISO YYYY-MM-DD
  hora: string;             // HH:MM
  local: Local;
  adversario: string;
  golos_ra: number;
  golos_adv: number;
  resultado: Resultado;
  espectadores?: number;    // apenas jogos em casa no Estádio dos Arcos
  estadio?: string;         // estadio do adversário quando (F)
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
    golos_ra:0, golos_adv:0, espectadores:2801 },

  { epoca:'25/26', competicao:'liga', competicao_label:'Liga Portugal Betclic', jornada:'J33',
    data:'2026-05-11', hora:'20:15', local:'casa', adversario:'Sporting CP',
    golos_ra:1, golos_adv:4, espectadores:3742 },
];

const TACA_2526: Omit<PartidaEquipa, 'id' | 'resultado' | 'publicado'>[] = [
  { epoca:'25/26', competicao:'taca-pt', competicao_label:'Taça de Portugal', jornada:'3ª Elim.',
    data:'2025-10-19', hora:'15:00', local:'fora', adversario:'Sintrense',
    golos_ra:3, golos_adv:2, estadio:'Estádio de Sintra' },
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
