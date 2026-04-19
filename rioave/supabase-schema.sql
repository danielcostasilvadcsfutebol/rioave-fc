-- ============================================================
-- RIO AVE FC — SCHEMA SUPABASE
-- Copia e cola isto no SQL Editor do Supabase
-- ============================================================

-- ÉPOCAS
create table epocas (
  id uuid default gen_random_uuid() primary key,
  nome text not null unique,
  criado_em timestamp with time zone default now()
);

-- JOGADORES
create table jogadores (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  data_nasc date,
  nacionalidade text,
  posicoes text[],
  pe text,
  epocas text[],
  foto text,
  criado_em timestamp with time zone default now()
);

-- JOGOS
create table jogos (
  id uuid default gen_random_uuid() primary key,
  data date not null,
  hora time,
  adversario text not null,
  local text,
  competicao text,
  epoca text,
  golos_nos integer default 0,
  golos_adv integer default 0,
  duracao integer default 90,
  espectadores integer,
  formacao text,
  treinadores text[],
  -- estatísticas
  posse numeric,
  remates integer,
  remates_os integer,
  cruzamentos integer,
  ataques integer,
  ataques_centro integer,
  ataques_esq integer,
  ataques_dir integer,
  cantos integer,
  forasjogo integer,
  faltas integer,
  amarelos integer,
  vermelhos integer,
  criado_em timestamp with time zone default now()
);

-- GOLOS
create table golos (
  id uuid default gen_random_uuid() primary key,
  jogo_id uuid references jogos(id) on delete cascade,
  jogador_id uuid references jogadores(id) on delete set null,
  assist_id uuid references jogadores(id) on delete set null,
  minuto integer,
  tipo text default 'normal'
);

-- SUBSTITUIÇÕES
create table substituicoes (
  id uuid default gen_random_uuid() primary key,
  jogo_id uuid references jogos(id) on delete cascade,
  saiu_id uuid references jogadores(id) on delete set null,
  entrou_id uuid references jogadores(id) on delete set null,
  minuto integer
);

-- JOGADORES POR JOGO (titulares + suplentes)
create table jogadores_jogo (
  id uuid default gen_random_uuid() primary key,
  jogo_id uuid references jogos(id) on delete cascade,
  jogador_id uuid references jogadores(id) on delete set null,
  titular boolean default true,
  posicao_slot integer,
  slot_x numeric,
  slot_y numeric
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Leitura pública · Escrita apenas para utilizadores autenticados
-- ============================================================

alter table epocas enable row level security;
alter table jogadores enable row level security;
alter table jogos enable row level security;
alter table golos enable row level security;
alter table substituicoes enable row level security;
alter table jogadores_jogo enable row level security;

-- Leitura pública
create policy "Leitura pública" on epocas for select using (true);
create policy "Leitura pública" on jogadores for select using (true);
create policy "Leitura pública" on jogos for select using (true);
create policy "Leitura pública" on golos for select using (true);
create policy "Leitura pública" on substituicoes for select using (true);
create policy "Leitura pública" on jogadores_jogo for select using (true);

-- Escrita autenticada
create policy "Escrita autenticada" on epocas for all using (auth.role() = 'authenticated');
create policy "Escrita autenticada" on jogadores for all using (auth.role() = 'authenticated');
create policy "Escrita autenticada" on jogos for all using (auth.role() = 'authenticated');
create policy "Escrita autenticada" on golos for all using (auth.role() = 'authenticated');
create policy "Escrita autenticada" on substituicoes for all using (auth.role() = 'authenticated');
create policy "Escrita autenticada" on jogadores_jogo for all using (auth.role() = 'authenticated');
