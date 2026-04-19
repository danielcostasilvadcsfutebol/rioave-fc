// api/chat.js — Vercel Edge Function
// A chave da API Anthropic fica aqui no servidor, nunca exposta ao browser

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { pergunta, contexto } = await req.json();

  if (!pergunta || !contexto) {
    return new Response(JSON.stringify({ error: 'Pergunta e contexto são obrigatórios' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const systemPrompt = `És um assistente especializado em dados e estatísticas do Rio Ave FC.
Tens acesso ao histórico completo de jogos, jogadores, golos e estatísticas do clube.
Respondes sempre em português europeu, de forma clara e concisa.
Quando apresentares números ou estatísticas, sê preciso.
Se a informação não estiver nos dados fornecidos, diz isso honestamente.
Não inventes dados — baseia-te apenas no contexto fornecido.

DADOS DISPONÍVEIS:
${JSON.stringify(contexto, null, 2)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: pergunta }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(JSON.stringify({ error: 'Erro na API Claude', detalhe: err }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await response.json();
  const resposta = data.content?.[0]?.text || 'Sem resposta.';

  return new Response(JSON.stringify({ resposta }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
