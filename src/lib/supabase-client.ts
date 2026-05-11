import { createBrowserClient } from '@supabase/ssr';
import type { Jogo, JogoComRelacoes, ResumoEpoca, Epoca, Competicao, Estadio } from '@/types';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export async function getJogosByEpoca(epocaNome: string): Promise<JogoComRelacoes[]> {
  const { data, error } = await supabase
    .from('jogos')
    .select('*, epoca:epocas(*), competicao:competicoes(*), estadio:estadios(*)')
    .eq('local', 'casa')
    .eq('publicado', true)
    .order('jornada', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as JogoComRelacoes[]) ?? [];
}

export async function getResumoEpocas(): Promise<ResumoEpoca[]> {
  const { data, error } = await supabase
    .from('v_resumo_epocas')
    .select('*')
    .order('ano_inicio', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ResumoEpoca[]) ?? [];
}

export async function getEpocas(): Promise<Epoca[]> {
  const { data, error } = await supabase.from('epocas').select('*').order('ano_inicio', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Epoca[]) ?? [];
}

export async function getCompeticoes(): Promise<Competicao[]> {
  const { data, error } = await supabase.from('competicoes').select('*').order('nome');
  if (error) throw new Error(error.message);
  return (data as Competicao[]) ?? [];
}

export async function getEstadios(): Promise<Estadio[]> {
  const { data, error } = await supabase.from('estadios').select('*');
  if (error) throw new Error(error.message);
  return (data as Estadio[]) ?? [];
}

export async function inserirJogo(jogo: Omit<Jogo, 'id' | 'pct_ocupacao' | 'publicado' | 'publicado_em'>): Promise<Jogo> {
  const { data, error } = await supabase.from('jogos').insert({ ...jogo, publicado: false }).select().single();
  if (error) throw new Error(error.message);
  return data as Jogo;
}

export async function publicarJogo(jogoId: string): Promise<void> {
  const { error } = await supabase.from('jogos').update({ publicado: true }).eq('id', jogoId);
  if (error) throw new Error(error.message);
}

export async function loginAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function logoutAdmin() {
  await supabase.auth.signOut();
}

export async function getSessionAdmin() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
