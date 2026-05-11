import type { JogoComRelacoes, ResumoEpoca } from '@/types';

const CAP_ATUAL  = 5300;
const CAP_ANTIGA = 11600;
const CAP_PACOS  = 9076;

function pct(n: number, cap: number) { return Math.round((n / cap) * 10000) / 100; }

export const MOCK_ESTADIO_ARCOS = { id: 'est-arcos', nome: 'Estádio dos Arcos', cidade: 'Vila do Conde', capacidade: CAP_ATUAL, is_principal: true };
export const MOCK_ESTADIO_PACOS = { id: 'est-pacos', nome: 'Estádio Capital do Móvel', cidade: 'Paços de Ferreira', capacidade: CAP_PACOS, is_principal: false };
export const MOCK_COMPETICAO_LIGA = { id: 'comp-liga', nome: 'Liga Portugal Betclic', tipo: 'liga' as const, pais: 'Portugal' };

type GameRaw = { jornada: number; adversario: string; assistencia: number; porta_fechada?: boolean; estadio_alternativo?: boolean; cap?: number; };

const DADOS: Record<string, { jogos: GameRaw[]; cap: number; divisao?: string }> = {
  '25/26': { cap: CAP_ATUAL, jogos: [
    { jornada:  1, adversario: 'Nacional',    assistencia: 2452 },
    { jornada:  2, adversario: 'Braga',        assistencia: 3250 },
    { jornada:  3, adversario: 'Porto',        assistencia: 4624 },
    { jornada:  4, adversario: 'Tondela',      assistencia: 2066 },
    { jornada:  5, adversario: 'Estoril',      assistencia: 2039 },
    { jornada:  6, adversario: 'Santa Clara',  assistencia: 2098 },
    { jornada:  7, adversario: 'Vitória',      assistencia: 2521 },
    { jornada:  8, adversario: 'Casa Pia',     assistencia: 2067 },
    { jornada:  9, adversario: 'Benfica',      assistencia: 4435 },
    { jornada: 10, adversario: 'Arouca',       assistencia: 1842 },
    { jornada: 11, adversario: 'Moreirense',   assistencia: 2041 },
    { jornada: 12, adversario: 'Famalicão',    assistencia: 2595 },
    { jornada: 13, adversario: 'Estrela',      assistencia: 2885 },
    { jornada: 14, adversario: 'Alverca',      assistencia: 2284 },
    { jornada: 15, adversario: 'AFS',          assistencia: 2158 },
    { jornada: 16, adversario: 'Gil',          assistencia: 2801 },
    { jornada: 17, adversario: 'Sporting',     assistencia: 3742 },
  ]},
  '24/25': { cap: CAP_ATUAL, jogos: [
    { jornada:  1, adversario: 'Farense',      assistencia: 3177 },
    { jornada:  2, adversario: 'Arouca',       assistencia: 2558 },
    { jornada:  3, adversario: 'Estoril',      assistencia: 3014 },
    { jornada:  4, adversario: 'Famalicão',    assistencia: 2708 },
    { jornada:  5, adversario: 'Casa Pia',     assistencia: 2323 },
    { jornada:  6, adversario: 'Moreirense',   assistencia: 2009 },
    { jornada:  7, adversario: 'Vitória',      assistencia: 2897 },
    { jornada:  8, adversario: 'Nacional',     assistencia: 2729 },
    { jornada:  9, adversario: 'Sporting',     assistencia: 4756 },
    { jornada: 10, adversario: 'Porto',        assistencia: 4100 },
    { jornada: 11, adversario: 'AFS',          assistencia: 2206 },
    { jornada: 12, adversario: 'Braga',        assistencia: 3434 },
    { jornada: 13, adversario: 'Benfica',      assistencia: 4753 },
    { jornada: 14, adversario: 'Boavista',     assistencia: 1060, estadio_alternativo: true, cap: CAP_PACOS },
    { jornada: 15, adversario: 'Santa Clara',  assistencia: 921,  estadio_alternativo: true, cap: CAP_PACOS },
    { jornada: 16, adversario: 'Estrela',      assistencia: 689,  estadio_alternativo: true, cap: CAP_PACOS },
    { jornada: 17, adversario: 'Gil',          assistencia: 909,  estadio_alternativo: true, cap: CAP_PACOS },
  ]},
  '23/24': { cap: CAP_ATUAL, jogos: [
    { jornada:  1, adversario: 'Chaves',       assistencia: 3044 },
    { jornada:  2, adversario: 'Porto',        assistencia: 4811 },
    { jornada:  3, adversario: 'Famalicão',    assistencia: 3075 },
    { jornada:  4, adversario: 'Moreirense',   assistencia: 2695 },
    { jornada:  5, adversario: 'Farense',      assistencia: 1865 },
    { jornada:  6, adversario: 'Boavista',     assistencia: 2866 },
    { jornada:  7, adversario: 'Estrela',      assistencia: 2403 },
    { jornada:  8, adversario: 'Vizela',       assistencia: 2538 },
    { jornada:  9, adversario: 'Portim.',      assistencia: 2593 },
    { jornada: 10, adversario: 'Estoril',      assistencia: 3035 },
    { jornada: 11, adversario: 'Casa Pia',     assistencia: 2682 },
    { jornada: 12, adversario: 'Sporting',     assistencia: 4406 },
    { jornada: 13, adversario: 'Braga',        assistencia: 2753 },
    { jornada: 14, adversario: 'Gil',          assistencia: 3085 },
    { jornada: 15, adversario: 'Arouca',       assistencia: 3225 },
    { jornada: 16, adversario: 'Vitória',      assistencia: 3624 },
    { jornada: 17, adversario: 'Benfica',      assistencia: 4809 },
  ]},
  '22/23': { cap: CAP_ATUAL, jogos: [
    { jornada:  1, adversario: 'Vizela',       assistencia: 3038 },
    { jornada:  2, adversario: 'Porto',        assistencia: 3980 },
    { jornada:  3, adversario: 'Braga',        assistencia: 3071 },
    { jornada:  4, adversario: 'Santa Clara',  assistencia: 1984 },
    { jornada:  5, adversario: 'Portim.',      assistencia: 1693 },
    { jornada:  6, adversario: 'Boavista',     assistencia: 2546 },
    { jornada:  7, adversario: 'Marítimo',     assistencia: 1492 },
    { jornada:  8, adversario: 'Paços',        assistencia: 2310 },
    { jornada:  9, adversario: 'Sporting',     assistencia: 4125 },
    { jornada: 10, adversario: 'Estoril',      assistencia: 2654 },
    { jornada: 11, adversario: 'Chaves',       assistencia: 3244 },
    { jornada: 12, adversario: 'Gil',          assistencia: 3036 },
    { jornada: 13, adversario: 'Benfica',      assistencia: 4134 },
    { jornada: 14, adversario: 'Casa Pia',     assistencia: 2752 },
    { jornada: 15, adversario: 'Arouca',       assistencia: 2298 },
    { jornada: 16, adversario: 'Vitória',      assistencia: 4001 },
    { jornada: 17, adversario: 'Famalicão',    assistencia: 3037 },
  ]},
  '21/22': { cap: CAP_ATUAL, divisao: 'Liga SABSEG (2ª Divisão)', jogos: [
    { jornada:  1, adversario: 'Académica',    assistencia: 635 },
    { jornada:  2, adversario: 'Leixões',      assistencia: 1025 },
    { jornada:  3, adversario: 'Feirense',     assistencia: 909 },
    { jornada:  4, adversario: 'AFS',          assistencia: 963 },
    { jornada:  5, adversario: 'Académico',    assistencia: 720 },
    { jornada:  6, adversario: 'Nacional',     assistencia: 803 },
    { jornada:  7, adversario: 'Mafra',        assistencia: 743 },
    { jornada:  8, adversario: 'Covilhã',      assistencia: 702 },
    { jornada:  9, adversario: 'Farense',      assistencia: 798 },
    { jornada: 10, adversario: 'Varzim',       assistencia: 1930 },
    { jornada: 11, adversario: 'Estrela',      assistencia: 1150 },
    { jornada: 12, adversario: 'Porto B',      assistencia: 1729 },
    { jornada: 13, adversario: 'Penafiel',     assistencia: 912 },
    { jornada: 14, adversario: 'Trofense',     assistencia: 1854 },
    { jornada: 15, adversario: 'Benfica B',    assistencia: 1906 },
    { jornada: 16, adversario: 'Casa Pia',     assistencia: 3047 },
    { jornada: 17, adversario: 'Chaves',       assistencia: 3668 },
  ]},
  '20/21': { cap: CAP_ATUAL, jogos: [
    { jornada:  1, adversario: 'Vitória',      assistencia: 0, porta_fechada: true },
    { jornada:  2, adversario: 'Benfica',      assistencia: 0, porta_fechada: true },
    { jornada:  3, adversario: 'Moreirense',   assistencia: 0, porta_fechada: true },
    { jornada:  4, adversario: 'Boavista',     assistencia: 0, porta_fechada: true },
    { jornada:  5, adversario: 'Marítimo',     assistencia: 0, porta_fechada: true },
    { jornada:  6, adversario: 'Portim.',      assistencia: 0, porta_fechada: true },
    { jornada:  7, adversario: 'Santa Clara',  assistencia: 0, porta_fechada: true },
    { jornada:  8, adversario: 'Nacional',     assistencia: 0, porta_fechada: true },
    { jornada:  9, adversario: 'Tondela',      assistencia: 0, porta_fechada: true },
    { jornada: 10, adversario: 'Famalicão',    assistencia: 0, porta_fechada: true },
    { jornada: 11, adversario: 'Farense',      assistencia: 0, porta_fechada: true },
    { jornada: 12, adversario: 'B SAD',        assistencia: 0, porta_fechada: true },
    { jornada: 13, adversario: 'Gil Vicente',  assistencia: 0, porta_fechada: true },
    { jornada: 14, adversario: 'Braga',        assistencia: 0, porta_fechada: true },
    { jornada: 15, adversario: 'Paços',        assistencia: 0, porta_fechada: true },
    { jornada: 16, adversario: 'Sporting',     assistencia: 0, porta_fechada: true },
    { jornada: 17, adversario: 'FC Porto',     assistencia: 0, porta_fechada: true },
  ]},
  '19/20': { cap: CAP_ATUAL, jogos: [
    { jornada:  1, adversario: 'Vitória',      assistencia: 2713 },
    { jornada:  2, adversario: 'Aves',         assistencia: 2485 },
    { jornada:  3, adversario: 'Tondela',      assistencia: 2103 },
    { jornada:  4, adversario: 'Porto',        assistencia: 4411 },
    { jornada:  5, adversario: 'Moreirense',   assistencia: 1387 },
    { jornada:  6, adversario: 'Setubal',      assistencia: 1740 },
    { jornada:  7, adversario: 'Gil Vicente',  assistencia: 2350 },
    { jornada:  8, adversario: 'Marítimo',     assistencia: 2168 },
    { jornada:  9, adversario: 'Boavista',     assistencia: 2830 },
    { jornada: 10, adversario: 'Famalicão',    assistencia: 2337 },
    { jornada: 11, adversario: 'Sporting',     assistencia: 4434 },
    { jornada: 12, adversario: 'BSAD',         assistencia: 2289 },
    { jornada: 13, adversario: 'Paços',        assistencia: 0, porta_fechada: true },
    { jornada: 14, adversario: 'Benfica',      assistencia: 0, porta_fechada: true },
    { jornada: 15, adversario: 'Braga',        assistencia: 0, porta_fechada: true },
    { jornada: 16, adversario: 'Portim.',      assistencia: 0, porta_fechada: true },
    { jornada: 17, adversario: 'Santa Clara',  assistencia: 0, porta_fechada: true },
  ]},
  '18/19': { cap: CAP_ANTIGA, jogos: [
    { jornada:  1, adversario: 'Marítimo',     assistencia: 2529 },
    { jornada:  2, adversario: 'Portim.',      assistencia: 2539 },
    { jornada:  3, adversario: 'Boavista',     assistencia: 3099 },
    { jornada:  4, adversario: 'Chaves',       assistencia: 2894 },
    { jornada:  5, adversario: 'Nacional',     assistencia: 2232 },
    { jornada:  6, adversario: 'Sporting',     assistencia: 5927 },
    { jornada:  7, adversario: 'BSAD',         assistencia: 2288 },
    { jornada:  8, adversario: 'Moreirense',   assistencia: 2089 },
    { jornada:  9, adversario: 'Setúbal',      assistencia: 2163 },
    { jornada: 10, adversario: 'Feirense',     assistencia: 2052 },
    { jornada: 11, adversario: 'Tondela',      assistencia: 1159 },
    { jornada: 12, adversario: 'Santa Clara',  assistencia: 2343 },
    { jornada: 13, adversario: 'Braga',        assistencia: 3306 },
    { jornada: 14, adversario: 'Aves',         assistencia: 4955 },
    { jornada: 15, adversario: 'Vitória',      assistencia: 5739 },
    { jornada: 16, adversario: 'Porto',        assistencia: 7532 },
    { jornada: 17, adversario: 'Benfica',      assistencia: 8836 },
  ]},
  '17/18': { cap: CAP_ANTIGA, jogos: [
    { jornada:  1, adversario: 'BSAD',         assistencia: 2539 },
    { jornada:  2, adversario: 'Portim.',      assistencia: 2541 },
    { jornada:  3, adversario: 'Benfica',      assistencia: 8614 },
    { jornada:  4, adversario: 'Porto',        assistencia: 8052 },
    { jornada:  5, adversario: 'Setubal',      assistencia: 2385 },
    { jornada:  6, adversario: 'Sporting',     assistencia: 7158 },
    { jornada:  7, adversario: 'Vitória',      assistencia: 3587 },
    { jornada:  8, adversario: 'Moreirense',   assistencia: 2011 },
    { jornada:  9, adversario: 'P. Ferreira',  assistencia: 1781 },
    { jornada: 10, adversario: 'Boavista',     assistencia: 2935 },
    { jornada: 11, adversario: 'Marítimo',     assistencia: 2754 },
    { jornada: 12, adversario: 'CD Aves',      assistencia: 2590 },
  ]},
  '16/17': { cap: CAP_ANTIGA, jogos: [
    { jornada:  1, adversario: 'Porto',        assistencia: 8357 },
    { jornada:  2, adversario: 'Feirense',     assistencia: 2268 },
    { jornada:  3, adversario: 'Sporting',     assistencia: 8315 },
    { jornada:  4, adversario: 'Estoril',      assistencia: 3843 },
    { jornada:  5, adversario: 'Vitória',      assistencia: 6166 },
    { jornada:  6, adversario: 'Boavista',     assistencia: 2705 },
    { jornada:  7, adversario: 'Tondela',      assistencia: 2116 },
    { jornada:  8, adversario: 'Nacional',     assistencia: 2267 },
    { jornada:  9, adversario: 'Chaves',       assistencia: 2908 },
    { jornada: 10, adversario: 'Braga',        assistencia: 1508 },
    { jornada: 11, adversario: 'Marítimo',     assistencia: 1981 },
    { jornada: 12, adversario: 'P. Ferreira',  assistencia: 2661 },
  ]},
  '15/16': { cap: CAP_ANTIGA, jogos: [
    { jornada:  1, adversario: 'Braga',        assistencia: 3825 },
    { jornada:  2, adversario: 'Sporting',     assistencia: 6685 },
    { jornada:  3, adversario: 'Académica',    assistencia: 2558 },
    { jornada:  4, adversario: 'Boavista',     assistencia: 2912 },
    { jornada:  5, adversario: 'Nacional',     assistencia: 3182 },
    { jornada:  6, adversario: 'Moreirense',   assistencia: 3985 },
    { jornada:  7, adversario: 'Arouca',       assistencia: 3017 },
    { jornada:  8, adversario: 'Tondela',      assistencia: 1615 },
    { jornada:  9, adversario: 'Uni. Madeira', assistencia: 1682 },
    { jornada: 10, adversario: 'BSAD',         assistencia: 2115 },
    { jornada: 11, adversario: 'Setubal',      assistencia: 2355 },
    { jornada: 12, adversario: 'P. Ferreira',  assistencia: 2290 },
  ]},
  '14/15': { cap: CAP_ANTIGA, jogos: [
    { jornada:  1, adversario: 'Setubal',      assistencia: 1959 },
    { jornada:  2, adversario: 'Boavista',     assistencia: 2708 },
    { jornada:  3, adversario: 'Arouca',       assistencia: 2176 },
    { jornada:  4, adversario: 'Penafiel',     assistencia: 2748 },
    { jornada:  5, adversario: 'Académica',    assistencia: 1810 },
    { jornada:  6, adversario: 'Gil Vicente',  assistencia: 2144 },
    { jornada:  7, adversario: 'BSAD',         assistencia: 1825 },
    { jornada:  8, adversario: 'Marítimo',     assistencia: 2230 },
    { jornada:  9, adversario: 'Estoril',      assistencia: 1928 },
    { jornada: 10, adversario: 'Moreirense',   assistencia: 1609 },
    { jornada: 11, adversario: 'Braga',        assistencia: 2375 },
    { jornada: 12, adversario: 'Nacional',     assistencia: 1850 },
  ]},
  '13/14': { cap: CAP_ANTIGA, jogos: [
    { jornada:  1, adversario: 'Setúbal',      assistencia: 1524 },
    { jornada:  2, adversario: 'Vitória',      assistencia: 2452 },
    { jornada:  3, adversario: 'Nacional',     assistencia: 1148 },
    { jornada:  4, adversario: 'Gil Vicente',  assistencia: 2203 },
    { jornada:  5, adversario: 'Estoril',      assistencia: 1833 },
    { jornada:  6, adversario: 'Benfica',      assistencia: 6023 },
    { jornada:  7, adversario: 'Porto',        assistencia: 3896 },
    { jornada:  8, adversario: 'Marítimo',     assistencia: 1773 },
    { jornada:  9, adversario: 'BSAD',         assistencia: 1415 },
    { jornada: 10, adversario: 'Arouca',       assistencia: 1183 },
    { jornada: 11, adversario: 'Sporting',     assistencia: 4995 },
    { jornada: 12, adversario: 'Académica',    assistencia: 1615 },
    { jornada: 13, adversario: 'Braga',        assistencia: 1731 },
    { jornada: 14, adversario: 'Olhanense',    assistencia: 1579 },
    { jornada: 15, adversario: 'P. Ferreira',  assistencia: 1630 },
  ]},
  '12/13': { cap: CAP_ANTIGA, jogos: [
    { jornada:  1, adversario: 'Marítimo',     assistencia: 1239 },
    { jornada:  2, adversario: 'Académica',    assistencia: 1321 },
    { jornada:  3, adversario: 'Porto',        assistencia: 3341 },
    { jornada:  4, adversario: 'Nacional',     assistencia: 1477 },
    { jornada:  5, adversario: 'Benfica',      assistencia: 5028 },
    { jornada:  6, adversario: 'P. Ferreira',  assistencia: 1551 },
    { jornada:  7, adversario: 'Olhanense',    assistencia: 1385 },
    { jornada:  8, adversario: 'Vitória',      assistencia: 1097 },
    { jornada:  9, adversario: 'Sporting',     assistencia: 2356 },
    { jornada: 10, adversario: 'Braga',        assistencia: 4663 },
    { jornada: 11, adversario: 'Estoril',      assistencia: 2529 },
    { jornada: 12, adversario: 'Moreirense',   assistencia: 2125 },
    { jornada: 13, adversario: 'Setúbal',      assistencia: 1253 },
    { jornada: 14, adversario: 'Beira-Mar',    assistencia: 1469 },
    { jornada: 15, adversario: 'Gil Vicente',  assistencia: 1220 },
  ]},
  '11/12': { cap: CAP_ANTIGA, jogos: [
    { jornada:  1, adversario: 'Braga',        assistencia: 3322 },
    { jornada:  2, adversario: 'Olhanense',    assistencia: 1829 },
    { jornada:  3, adversario: 'Sporting',     assistencia: 4308 },
    { jornada:  4, adversario: 'Leiria',       assistencia: 1276 },
    { jornada:  5, adversario: 'Nacional',     assistencia: 1718 },
    { jornada:  6, adversario: 'Gil Vicente',  assistencia: 1632 },
    { jornada:  7, adversario: 'P. Ferreira',  assistencia: 1602 },
    { jornada:  8, adversario: 'Académica',    assistencia: 1624 },
    { jornada:  9, adversario: 'Marítimo',     assistencia: 1173 },
    { jornada: 10, adversario: 'Beira-Mar',    assistencia: 3050 },
    { jornada: 11, adversario: 'Setúbal',      assistencia: 4906 },
    { jornada: 12, adversario: 'Vitória',      assistencia: 2378 },
    { jornada: 13, adversario: 'Feirense',     assistencia: 2520 },
    { jornada: 14, adversario: 'Benfica',      assistencia: 3706 },
    { jornada: 15, adversario: 'Porto',        assistencia: 5454 },
  ]},
  '10/11': { cap: CAP_ANTIGA, jogos: [
    { jornada:  1, adversario: 'Nacional',     assistencia: 1654 },
    { jornada:  2, adversario: 'Porto',        assistencia: 5064 },
    { jornada:  3, adversario: 'Académica',    assistencia: 1627 },
    { jornada:  4, adversario: 'Marítimo',     assistencia: 1184 },
    { jornada:  5, adversario: 'Braga',        assistencia: 1817 },
    { jornada:  6, adversario: 'P. Ferreira',  assistencia: 1972 },
    { jornada:  7, adversario: 'Beira-Mar',    assistencia: 1413 },
    { jornada:  8, adversario: 'Olhanense',    assistencia: 1666 },
    { jornada:  9, adversario: 'Vitória',      assistencia: 1845 },
    { jornada: 10, adversario: 'Portim.',      assistencia: 1339 },
    { jornada: 11, adversario: 'Leiria',       assistencia: 1683 },
    { jornada: 12, adversario: 'Sporting',     assistencia: 2934 },
    { jornada: 13, adversario: 'Setúbal',      assistencia: 5639 },
    { jornada: 14, adversario: 'Naval',        assistencia: 3638 },
    { jornada: 15, adversario: 'Benfica',      assistencia: 2390 },
  ]},
  '09/10': { cap: CAP_ANTIGA, jogos: [
    { jornada:  1, adversario: 'Setúbal',      assistencia: 1050 },
    { jornada:  2, adversario: 'Nacional',     assistencia: 2117 },
    { jornada:  3, adversario: 'Académica',    assistencia: 1889 },
    { jornada:  4, adversario: 'Braga',        assistencia: 3696 },
    { jornada:  5, adversario: 'Sporting',     assistencia: 3385 },
    { jornada:  6, adversario: 'Belenenses',   assistencia: 1316 },
    { jornada:  7, adversario: 'Benfica',      assistencia: 7060 },
    { jornada:  8, adversario: 'Leiria',       assistencia: 1471 },
    { jornada:  9, adversario: 'Leixões',      assistencia: 1979 },
    { jornada: 10, adversario: 'P. Ferreira',  assistencia: 1905 },
    { jornada: 11, adversario: 'Naval',        assistencia: 1682 },
    { jornada: 12, adversario: 'Olhanense',    assistencia: 3365 },
    { jornada: 13, adversario: 'Porto',        assistencia: 3402 },
    { jornada: 14, adversario: 'Marítimo',     assistencia: 1221 },
    { jornada: 15, adversario: 'Vitória',      assistencia: 3364 },
  ]},
  '08/09': { cap: CAP_ANTIGA, jogos: [
    { jornada:  1, adversario: 'Benfica',      assistencia: 10426 },
    { jornada:  2, adversario: 'Porto',        assistencia: 2735 },
    { jornada:  3, adversario: 'P. Ferreira',  assistencia: 1601 },
    { jornada:  4, adversario: 'Sporting',     assistencia: 3549 },
    { jornada:  5, adversario: 'Leixões',      assistencia: 2507 },
    { jornada:  6, adversario: 'Naval',        assistencia: 3048 },
    { jornada:  7, adversario: 'Vitória',      assistencia: 2898 },
    { jornada:  8, adversario: 'Belenenses',   assistencia: 1960 },
    { jornada:  9, adversario: 'Académica',    assistencia: 2043 },
    { jornada: 10, adversario: 'Setúbal',      assistencia: 1920 },
    { jornada: 11, adversario: 'Marítimo',     assistencia: 1369 },
    { jornada: 12, adversario: 'Nacional',     assistencia: 937 },
    { jornada: 13, adversario: 'Trofense',     assistencia: 3165 },
    { jornada: 14, adversario: 'Braga',        assistencia: 4437 },
    { jornada: 15, adversario: 'Estrela',      assistencia: 7073 },
  ]},
  '07/08': { cap: CAP_ANTIGA, jogos: [
    { jornada:  1, adversario: 'Gondomar',       assistencia: 729 },
    { jornada:  2, adversario: 'Portimonense',   assistencia: 729 },
    { jornada:  3, adversario: 'Gil Vicente',    assistencia: 1211 },
    { jornada:  4, adversario: 'CD Aves',        assistencia: 1125 },
    { jornada:  5, adversario: 'Penafiel',       assistencia: 1282 },
    { jornada:  6, adversario: 'Beira-Mar',      assistencia: 3059 },
    { jornada:  7, adversario: 'Trofense',       assistencia: 1202 },
    { jornada:  8, adversario: 'Feirense',       assistencia: 1529 },
    { jornada:  9, adversario: 'Gondomar',       assistencia: 1162 },
    { jornada: 10, adversario: 'Fátima',         assistencia: 1214 },
    { jornada: 11, adversario: 'Vizela',         assistencia: 2079 },
    { jornada: 12, adversario: 'SC Freamunde',   assistencia: 2165 },
    { jornada: 13, adversario: 'Olhanense',      assistencia: 2052 },
    { jornada: 14, adversario: 'Estoril',        assistencia: 2567 },
    { jornada: 15, adversario: 'Santa Clara',    assistencia: 2638 },
  ]},
  '06/07': { cap: CAP_ANTIGA, jogos: [
    { jornada:  1, adversario: 'Varzim',            assistencia: 2982 },
    { jornada:  2, adversario: 'Olivais e Moscavide', assistencia: 1391 },
    { jornada:  3, adversario: 'Gil Vicente',       assistencia: 2438 },
    { jornada:  4, adversario: 'Leixões',           assistencia: 2424 },
    { jornada:  5, adversario: 'Estoril',           assistencia: 1428 },
    { jornada:  6, adversario: 'Vitória',           assistencia: 2017 },
    { jornada:  7, adversario: 'Olhanense',         assistencia: 990 },
    { jornada:  8, adversario: 'Penafiel',          assistencia: 3426 },
    { jornada:  9, adversario: 'Chaves',            assistencia: 1756 },
    { jornada: 10, adversario: 'Santa Clara',       assistencia: 6695 },
    { jornada: 11, adversario: 'Feirense',          assistencia: 5150 },
    { jornada: 12, adversario: 'Trofense',          assistencia: 3349 },
    { jornada: 13, adversario: 'Portimonense',      assistencia: 4822 },
    { jornada: 14, adversario: 'Gondomar',          assistencia: 5970 },
    { jornada: 15, adversario: 'Vizela',            assistencia: 855 },
  ]},
};

export const EPOCAS_ORDENADAS = ['25/26','24/25','23/24','22/23','21/22','20/21','19/20','18/19','17/18','16/17','15/16','14/15','13/14','12/13','11/12','10/11','09/10','08/09','07/08','06/07'];

export function getJogosByEpoca(epoca: string): JogoComRelacoes[] {
  const d = DADOS[epoca];
  if (!d) return [];
  const epocaObj = {
    id: `ep-${epoca.replace('/', '-')}`,
    nome: epoca,
    ano_inicio: parseInt(epoca.split('/')[0]) + (parseInt(epoca.split('/')[0]) < 30 ? 2000 : 1900),
    ano_fim: parseInt(epoca.split('/')[1]) + (parseInt(epoca.split('/')[1]) < 30 ? 2000 : 1900),
    ativa: epoca === '25/26',
    divisao: d.divisao ?? 'Liga Portugal',
  };
  return d.jogos.map((j, i) => {
    const cap = j.cap ?? d.cap;
    const estadio = j.estadio_alternativo ? MOCK_ESTADIO_PACOS : MOCK_ESTADIO_ARCOS;
    return {
      id: `${epoca}-${i + 1}`,
      jornada: j.jornada,
      adversario: j.adversario,
      assistencia: j.assistencia,
      capacidade_jogo: cap,
      pct_ocupacao: j.porta_fechada ? 0 : pct(j.assistencia, cap),
      jogo_porta_fechada: j.porta_fechada ?? false,
      estadio_alternativo: j.estadio_alternativo ?? false,
      local: 'casa' as const,
      notas: j.porta_fechada ? 'À porta fechada (COVID-19)' : j.estadio_alternativo ? 'Estádio Capital do Móvel (Tempestade Martinho)' : null,
      data_jogo: null, hora_jogo: null,
      golos_ra: null, golos_adversario: null,
      publicado: true, publicado_em: null,
      epoca_id: epocaObj.id,
      competicao_id: MOCK_COMPETICAO_LIGA.id,
      estadio_id: estadio.id,
      epoca: epocaObj,
      competicao: MOCK_COMPETICAO_LIGA,
      estadio,
    };
  });
}

export const MOCK_RESUMO_EPOCAS: ResumoEpoca[] = EPOCAS_ORDENADAS.map(epoca => {
  const d = DADOS[epoca];
  const validos = d.jogos.filter(j => !j.porta_fechada && j.assistencia > 0);
  const total = d.jogos.reduce((s, j) => s + (j.porta_fechada ? 0 : j.assistencia), 0);
  const media = d.jogos.length > 0 ? Math.round(total / d.jogos.length) : 0;
  return {
    epoca, ano_inicio: parseInt(epoca.split('/')[0]) + (parseInt(epoca.split('/')[0]) < 30 ? 2000 : 1900),
    ativa: epoca === '25/26',
    total_jogos: d.jogos.length, total_assistencia: total, media_assistencia: media,
    max_assistencia: validos.length ? Math.max(...validos.map(j => j.assistencia)) : 0,
    min_assistencia: validos.length ? Math.min(...validos.map(j => j.assistencia)) : 0,
  };
});

export const MOCK_JOGOS_2526 = getJogosByEpoca('25/26');

export function calcularKpis(jogos: JogoComRelacoes[]) {
  const validos = jogos.filter(j => !j.jogo_porta_fechada && (j.assistencia ?? 0) > 0);
  const total   = jogos.reduce((s, j) => s + (j.assistencia ?? 0), 0);
  const media   = jogos.length ? Math.round(total / jogos.length) : 0;
  const maximo  = validos.length ? Math.max(...validos.map(j => j.assistencia ?? 0)) : 0;
  const minimo  = validos.length ? Math.min(...validos.map(j => j.assistencia ?? 0)) : 0;
  const cap     = jogos.find(j => !j.estadio_alternativo)?.capacidade_jogo ?? 5300;
  return {
    total, media, maximo, minimo,
    totalJogos: jogos.length,
    jogoMaximo: validos.find(j => j.assistencia === maximo),
    jogoMinimo: validos.find(j => j.assistencia === minimo),
    pctMedia: cap > 0 ? ((media / cap) * 100).toFixed(1) : '—',
  };
}

export interface EstatAdversario {
  adversario: string;
  visitas: number;
  media: number;
  maximo: number;
  total: number;
  epocas: number;
}

export function getEstatisticasAdversarios(): EstatAdversario[] {
  const map = new Map<string, { total: number; visitas: number; maximo: number; epocasSet: Set<string> }>();
  for (const epoca of EPOCAS_ORDENADAS) {
    for (const j of DADOS[epoca].jogos) {
      if (j.porta_fechada || j.assistencia === 0) continue;
      const key = j.adversario.trim();
      if (!map.has(key)) map.set(key, { total: 0, visitas: 0, maximo: 0, epocasSet: new Set() });
      const e = map.get(key)!;
      e.visitas++; e.total += j.assistencia;
      e.maximo = Math.max(e.maximo, j.assistencia);
      e.epocasSet.add(epoca);
    }
  }
  return Array.from(map.entries())
    .map(([adversario, e]) => ({
      adversario, visitas: e.visitas,
      media: Math.round(e.total / e.visitas),
      maximo: e.maximo, total: e.total, epocas: e.epocasSet.size,
    }))
    .sort((a, b) => b.media - a.media);
}
