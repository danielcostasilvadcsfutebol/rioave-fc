export interface Epoca {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
  ativa: boolean;
  divisao: string;
}

export interface Competicao {
  id: string;
  nome: string;
  tipo: 'liga' | 'taca' | 'europeu' | 'amigavel';
  pais: string;
}

export interface Estadio {
  id: string;
  nome: string;
  cidade: string;
  capacidade: number | null;
  is_principal: boolean;
  notas?: string;
}

export interface Jogo {
  id: string;
  epoca_id: string;
  competicao_id: string;
  estadio_id: string | null;
  jornada: number | null;
  adversario: string;
  local: 'casa' | 'fora' | 'neutro';
  data_jogo: string | null;
  hora_jogo: string | null;
  golos_ra: number | null;
  golos_adversario: number | null;
  assistencia: number | null;
  capacidade_jogo: number | null;
  pct_ocupacao: number | null;
  notas: string | null;
  jogo_porta_fechada: boolean;
  estadio_alternativo: boolean;
  publicado: boolean;
  publicado_em: string | null;
  epoca?: Epoca;
  competicao?: Competicao;
  estadio?: Estadio;
}

export interface JogoComRelacoes extends Jogo {
  epoca: Epoca;
  competicao: Competicao;
  estadio: Estadio | null;
}

export interface ResumoEpoca {
  epoca: string;
  ano_inicio: number;
  ativa: boolean;
  total_jogos: number;
  total_assistencia: number;
  media_assistencia: number;
  max_assistencia: number;
  min_assistencia: number;
}

export interface JogoFormData {
  epoca_id: string;
  competicao_id: string;
  estadio_id: string;
  jornada: number | '';
  adversario: string;
  local: 'casa' | 'fora' | 'neutro';
  data_jogo: string;
  hora_jogo: string;
  assistencia: number | '';
  capacidade_jogo: number | '';
  golos_ra: number | '';
  golos_adversario: number | '';
  notas: string;
  jogo_porta_fechada: boolean;
  estadio_alternativo: boolean;
}

export interface CsvValidationError {
  row: number;
  campo: string;
  valor: string;
  mensagem: string;
}
