/* js/supabase.js — Camada de dados Supabase
   Substitui o SUPABASE_URL e SUPABASE_ANON_KEY pelos teus valores */

const SUPABASE_URL = 'https://ivcjqicyibwlwpkdoxsb.supabase.co;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2Y2pxaWN5aWJ3bHdwa2RveHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjgyODYsImV4cCI6MjA5MjIwNDI4Nn0.vCrIZG4OPS89cN2gByLPV-YkjhxMgLpS-f0fjNwb0UE';

const headers = () => ({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Prefer': 'return=representation'
});

const headersAuth = async () => {
  const token = await getSessionToken();
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
    'Prefer': 'return=representation'
  };
};

const api = (path) => `${SUPABASE_URL}/rest/v1${path}`;
const authApi = (path) => `${SUPABASE_URL}/auth/v1${path}`;

/* ---- AUTH ---- */
async function getSessionToken() {
  const s = localStorage.getItem('sb_session');
  if (!s) return null;
  try {
    const session = JSON.parse(s);
    if (session.expires_at && Date.now() / 1000 > session.expires_at - 60) {
      return await refreshSession(session.refresh_token);
    }
    return session.access_token;
  } catch { return null; }
}

async function refreshSession(refreshToken) {
  const r = await fetch(authApi('/token?grant_type=refresh_token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  if (!r.ok) { localStorage.removeItem('sb_session'); return null; }
  const data = await r.json();
  localStorage.setItem('sb_session', JSON.stringify(data));
  return data.access_token;
}

async function login(email, password) {
  const r = await fetch(authApi('/token?grant_type=password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error_description || data.msg || 'Erro de autenticação');
  localStorage.setItem('sb_session', JSON.stringify(data));
  return data;
}

async function logout() {
  const token = await getSessionToken();
  if (token) {
    await fetch(authApi('/logout'), {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
    });
  }
  localStorage.removeItem('sb_session');
}

async function isLoggedIn() {
  const token = await getSessionToken();
  return !!token;
}

/* ---- JOGADORES ---- */
const DB = {

  async getJogadores() {
    const r = await fetch(api('/jogadores?select=*&order=nome'), { headers: headers() });
    if (!r.ok) throw new Error('Erro ao carregar jogadores');
    return r.json();
  },

  async getJogador(id) {
    const r = await fetch(api(`/jogadores?id=eq.${id}&select=*`), { headers: headers() });
    if (!r.ok) throw new Error('Erro ao carregar jogador');
    const data = await r.json();
    return data[0];
  },

  async criarJogador(jogador) {
    const r = await fetch(api('/jogadores'), {
      method: 'POST',
      headers: await headersAuth(),
      body: JSON.stringify(jogador)
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.message || 'Erro ao criar jogador'); }
    const data = await r.json();
    return data[0];
  },

  async atualizarJogador(id, jogador) {
    const r = await fetch(api(`/jogadores?id=eq.${id}`), {
      method: 'PATCH',
      headers: await headersAuth(),
      body: JSON.stringify(jogador)
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.message || 'Erro ao atualizar jogador'); }
    const data = await r.json();
    return data[0];
  },

  async apagarJogador(id) {
    const r = await fetch(api(`/jogadores?id=eq.${id}`), {
      method: 'DELETE',
      headers: await headersAuth()
    });
    if (!r.ok) throw new Error('Erro ao apagar jogador');
  },

  /* ---- JOGOS ---- */
  async getJogos(filtros = {}) {
    let query = '/jogos?select=*,golos(*),substituicoes(*),jogadores_jogo(*)&order=data.desc';
    if (filtros.epoca) query += `&epoca=eq.${encodeURIComponent(filtros.epoca)}`;
    if (filtros.competicao) query += `&competicao=eq.${encodeURIComponent(filtros.competicao)}`;
    const r = await fetch(api(query), { headers: headers() });
    if (!r.ok) throw new Error('Erro ao carregar jogos');
    return r.json();
  },

  async getJogo(id) {
    const r = await fetch(api(`/jogos?id=eq.${id}&select=*,golos(*),substituicoes(*),jogadores_jogo(*)`), { headers: headers() });
    if (!r.ok) throw new Error('Erro ao carregar jogo');
    const data = await r.json();
    return data[0];
  },

  async criarJogo(jogo) {
    const { golos, substituicoes, jogadores_jogo, ...jogoBase } = jogo;
    const r = await fetch(api('/jogos'), {
      method: 'POST',
      headers: await headersAuth(),
      body: JSON.stringify(jogoBase)
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.message || 'Erro ao criar jogo'); }
    const data = await r.json();
    const jogoId = data[0].id;

    if (golos?.length) await DB._inserirRelacionados('/golos', golos.map(g => ({ ...g, jogo_id: jogoId })));
    if (substituicoes?.length) await DB._inserirRelacionados('/substituicoes', substituicoes.map(s => ({ ...s, jogo_id: jogoId })));
    if (jogadores_jogo?.length) await DB._inserirRelacionados('/jogadores_jogo', jogadores_jogo.map(j => ({ ...j, jogo_id: jogoId })));

    return data[0];
  },

  async atualizarJogo(id, jogo) {
    const { golos, substituicoes, jogadores_jogo, ...jogoBase } = jogo;
    const r = await fetch(api(`/jogos?id=eq.${id}`), {
      method: 'PATCH',
      headers: await headersAuth(),
      body: JSON.stringify(jogoBase)
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.message || 'Erro ao atualizar jogo'); }

    await fetch(api(`/golos?jogo_id=eq.${id}`), { method: 'DELETE', headers: await headersAuth() });
    await fetch(api(`/substituicoes?jogo_id=eq.${id}`), { method: 'DELETE', headers: await headersAuth() });
    await fetch(api(`/jogadores_jogo?jogo_id=eq.${id}`), { method: 'DELETE', headers: await headersAuth() });

    if (golos?.length) await DB._inserirRelacionados('/golos', golos.map(g => ({ ...g, jogo_id: id })));
    if (substituicoes?.length) await DB._inserirRelacionados('/substituicoes', substituicoes.map(s => ({ ...s, jogo_id: id })));
    if (jogadores_jogo?.length) await DB._inserirRelacionados('/jogadores_jogo', jogadores_jogo.map(j => ({ ...j, jogo_id: id })));
  },

  async apagarJogo(id) {
    await fetch(api(`/golos?jogo_id=eq.${id}`), { method: 'DELETE', headers: await headersAuth() });
    await fetch(api(`/substituicoes?jogo_id=eq.${id}`), { method: 'DELETE', headers: await headersAuth() });
    await fetch(api(`/jogadores_jogo?jogo_id=eq.${id}`), { method: 'DELETE', headers: await headersAuth() });
    const r = await fetch(api(`/jogos?id=eq.${id}`), { method: 'DELETE', headers: await headersAuth() });
    if (!r.ok) throw new Error('Erro ao apagar jogo');
  },

  async _inserirRelacionados(endpoint, registos) {
    if (!registos.length) return;
    const r = await fetch(api(endpoint), {
      method: 'POST',
      headers: await headersAuth(),
      body: JSON.stringify(registos)
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.message || `Erro ao inserir em ${endpoint}`); }
  },

  /* ---- ÉPOCAS ---- */
  async getEpocas() {
    const r = await fetch(api('/epocas?select=*&order=nome.desc'), { headers: headers() });
    if (!r.ok) throw new Error('Erro ao carregar épocas');
    return r.json();
  },

  async criarEpoca(nome) {
    const r = await fetch(api('/epocas'), {
      method: 'POST',
      headers: await headersAuth(),
      body: JSON.stringify({ nome })
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.message || 'Erro ao criar época'); }
    const data = await r.json();
    return data[0];
  },

  async apagarEpoca(id) {
    const r = await fetch(api(`/epocas?id=eq.${id}`), { method: 'DELETE', headers: await headersAuth() });
    if (!r.ok) throw new Error('Erro ao apagar época');
  },

  /* ---- DADOS PARA CHATBOT ---- */
  async getContextoChatbot() {
    const [jogadores, jogos, epocas] = await Promise.all([
      DB.getJogadores(),
      fetch(api('/jogos?select=*,golos(*),substituicoes(*),jogadores_jogo(*)&order=data.desc&limit=200'), { headers: headers() }).then(r => r.json()),
      DB.getEpocas()
    ]);
    return { jogadores, jogos, epocas };
  }
};

window.DB = DB;
window.login = login;
window.logout = logout;
window.isLoggedIn = isLoggedIn;
