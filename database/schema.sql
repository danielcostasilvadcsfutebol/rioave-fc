-- ============================================================
--  Rio Ave FC · Plataforma Estatística
--  Esquema de Base de Dados · Supabase (PostgreSQL)
--  v1.0 — Módulo: Assistências
--  Extensível para: Golos, Cartões, Feminino, Formação
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ÉPOCAS
CREATE TABLE epocas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL UNIQUE,
  ano_inicio  INTEGER NOT NULL,
  ano_fim     INTEGER NOT NULL,
  ativa       BOOLEAN NOT NULL DEFAULT FALSE,
  divisao     TEXT NOT NULL DEFAULT 'Liga Portugal Betclic',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. COMPETIÇÕES
CREATE TABLE competicoes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL UNIQUE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('liga', 'taca', 'europeu', 'amigavel')),
  pais        TEXT NOT NULL DEFAULT 'Portugal',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ESTÁDIOS
CREATE TABLE estadios (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                 TEXT NOT NULL,
  cidade               TEXT NOT NULL,
  capacidade           INTEGER,
  capacidade_historica INTEGER,
  is_principal         BOOLEAN NOT NULL DEFAULT FALSE,
  notas                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. JOGOS
CREATE TABLE jogos (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  epoca_id             UUID NOT NULL REFERENCES epocas(id) ON DELETE RESTRICT,
  competicao_id        UUID NOT NULL REFERENCES competicoes(id) ON DELETE RESTRICT,
  estadio_id           UUID REFERENCES estadios(id) ON DELETE SET NULL,
  jornada              INTEGER,
  adversario           TEXT NOT NULL,
  local                TEXT NOT NULL CHECK (local IN ('casa', 'fora', 'neutro')),
  data_jogo            DATE,
  hora_jogo            TIME,
  golos_ra             INTEGER,
  golos_adversario     INTEGER,
  assistencia          INTEGER,
  capacidade_jogo      INTEGER,
  pct_ocupacao         DECIMAL(5,2) GENERATED ALWAYS AS (
                         CASE
                           WHEN capacidade_jogo > 0 AND assistencia IS NOT NULL
                           THEN ROUND((assistencia::DECIMAL / capacidade_jogo) * 100, 2)
                           ELSE NULL
                         END
                       ) STORED,
  notas                TEXT,
  jogo_porta_fechada   BOOLEAN NOT NULL DEFAULT FALSE,
  estadio_alternativo  BOOLEAN NOT NULL DEFAULT FALSE,
  publicado            BOOLEAN NOT NULL DEFAULT FALSE,
  publicado_em         TIMESTAMPTZ,
  publicado_por        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ÍNDICES
CREATE INDEX idx_jogos_epoca      ON jogos(epoca_id);
CREATE INDEX idx_jogos_competicao ON jogos(competicao_id);
CREATE INDEX idx_jogos_local      ON jogos(local);
CREATE INDEX idx_jogos_publicado  ON jogos(publicado);
CREATE INDEX idx_jogos_data       ON jogos(data_jogo DESC);
CREATE INDEX idx_jogos_jornada    ON jogos(epoca_id, jornada);

-- 6. TRIGGER updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.publicado = TRUE AND OLD.publicado = FALSE THEN
    NEW.publicado_em = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_jogos_updated_at
  BEFORE UPDATE ON jogos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. ROW LEVEL SECURITY
ALTER TABLE epocas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE competicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE estadios    ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogos       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura_publica_epocas"
  ON epocas FOR SELECT USING (true);

CREATE POLICY "leitura_publica_competicoes"
  ON competicoes FOR SELECT USING (true);

CREATE POLICY "leitura_publica_estadios"
  ON estadios FOR SELECT USING (true);

CREATE POLICY "leitura_publica_jogos"
  ON jogos FOR SELECT USING (publicado = true);

CREATE POLICY "admin_jogos_total"
  ON jogos FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 8. SEED
INSERT INTO estadios (nome, cidade, capacidade, capacidade_historica, is_principal, notas) VALUES
  ('Estádio dos Arcos', 'Vila do Conde', 5000, 11600, TRUE,
   'Bancada nascente demolida em 2019. Capacidade atual: ~5000.'),
  ('Estádio Capital do Móvel', 'Paços de Ferreira', 9076, NULL, FALSE,
   'Utilizado em 2025 por interdição dos Arcos (Tempestade Martinho).');

INSERT INTO competicoes (nome, tipo) VALUES
  ('Liga Portugal Betclic', 'liga'),
  ('Taça de Portugal',      'taca'),
  ('Taça da Liga',          'taca'),
  ('Liga Conferência UEFA', 'europeu'),
  ('Fase de Qualificação UEFA', 'europeu');

INSERT INTO epocas (nome, ano_inicio, ano_fim, ativa) VALUES
  ('2006/07', 2006, 2007, FALSE),
  ('2007/08', 2007, 2008, FALSE),
  ('2008/09', 2008, 2009, FALSE),
  ('2009/10', 2009, 2010, FALSE),
  ('2010/11', 2010, 2011, FALSE),
  ('2011/12', 2011, 2012, FALSE),
  ('2012/13', 2012, 2013, FALSE),
  ('2013/14', 2013, 2014, FALSE),
  ('2014/15', 2014, 2015, FALSE),
  ('2015/16', 2015, 2016, FALSE),
  ('2016/17', 2016, 2017, FALSE),
  ('2017/18', 2017, 2018, FALSE),
  ('2018/19', 2018, 2019, FALSE),
  ('2019/20', 2019, 2020, FALSE),
  ('2020/21', 2020, 2021, FALSE),
  ('2021/22', 2021, 2022, FALSE),
  ('2022/23', 2022, 2023, FALSE),
  ('2023/24', 2023, 2024, FALSE),
  ('2024/25', 2024, 2025, FALSE),
  ('2025/26', 2025, 2026, TRUE);

-- 9. VIEW
CREATE OR REPLACE VIEW v_resumo_epocas AS
SELECT
  e.nome                    AS epoca,
  e.ano_inicio,
  e.ativa,
  COUNT(j.id)               AS total_jogos,
  SUM(j.assistencia)        AS total_assistencia,
  ROUND(AVG(j.assistencia)) AS media_assistencia,
  MAX(j.assistencia)        AS max_assistencia,
  MIN(j.assistencia)        AS min_assistencia
FROM epocas e
LEFT JOIN jogos j
       ON j.epoca_id = e.id
      AND j.publicado = TRUE
      AND j.local = 'casa'
      AND j.jogo_porta_fechada = FALSE
GROUP BY e.id, e.nome, e.ano_inicio, e.ativa
ORDER BY e.ano_inicio DESC;
