import React, { useState, useRef } from "react";
import { ArrowLeft, Copy, Check, Send, X, Mail, ChevronRight } from "lucide-react";

// ── Acesso restrito ────────────────────────────────────────────────────────────
const ALLOWED = ["daniel.silva@prozis.com"];

// ── Dados dos selects ──────────────────────────────────────────────────────────
const COUNTRIES = [
  "Portugal","Itália","Espanha","França","Alemanha","Outros"
];

const MODELS = [
  "Elite","Professionals","Progym","Proteams","Probox","Corporate","Performance"
];

const EMAIL_TYPES = [
  { id:"apresentacao", label:"Apresentação de Parceria" },
  { id:"boas_vindas",  label:"Email Boas-Vindas" },
  { id:"documentacao", label:"Pedido de Documentação" },
];

// ── Templates ─────────────────────────────────────────────────────────────────
// Chave: "PAIS_MODELO_TIPO"  (lowercase, sem acentos, underscores)
// Cada template tem: subject, html, text
function makeKey(country, model, type) {
  const norm = s => s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/\s+/g,"_");
  return `${norm(country)}_${norm(model)}_${type}`;
}

const TEMPLATES = {
  // ── Portugal · Elite · Apresentação ─────────────────────────────────────────
  "portugal_elite_apresentacao": {
    subject: "Apresentação de parceria - Elite",
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
  <img src="https://via.placeholder.com/600x200/0f172a/ffffff?text=Prozis+Elite" alt="Prozis Elite" style="width:100%;border-radius:8px 8px 0 0" />
  <div style="padding:32px 24px">
    <p style="margin:0 0 16px">Bom dia,</p>
    <p style="margin:0 0 16px">Obrigado pelo contacto e interesse na Prozis.</p>
    <p style="margin:0 0 16px">Em sequência do teu pedido de informação, gostaríamos de apresentar o <strong>Prozis Elite</strong>, um programa direcionado para profissionais na área da defesa.</p>
    <p style="margin:0 0 8px">Através do Prozis Elite:</p>
    <ul style="margin:0 0 16px;padding-left:20px">
      <li style="margin-bottom:4px">tens acesso a uma conta de parceiro com descontos;</li>
      <li style="margin-bottom:4px">este desconto é imediato e utilizável em todas as encomendas realizadas durante a duração da parceria;</li>
      <li style="margin-bottom:4px">tens acesso a campanhas exclusivas e apoio personalizado ao negócio;</li>
      <li style="margin-bottom:4px">acumulas ProzisPoints em todas as compras, que podem ser trocados por produtos Prozis.</li>
    </ul>
    <p style="margin:0 0 16px">O valor mínimo de compra é de 24,99€ e 49,99€ para obtenção de portes grátis.</p>
    <p style="margin:0 0 8px">Para ativarmos a conta Prozis Elite é necessário:</p>
    <ul style="margin:0 0 24px;padding-left:20px">
      <li style="margin-bottom:4px">indicar-nos qual o e-mail de registo na nossa loja online - <a href="https://www.prozis.com" style="color:#2563eb">www.prozis.com</a> ou efetuar o registo;</li>
      <li style="margin-bottom:4px">indicação do número profissional.</li>
    </ul>
    <p style="margin:0 0 24px">Ficamos a aguardar a tua resposta.</p>
    <a href="https://www.prozis.com" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold">Saber mais</a>
    <p style="margin:24px 0 0">Obrigado!</p>
  </div>
  <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;border-radius:0 0 8px 8px">
    Prozis · partners@prozis.com · <a href="#" style="color:#64748b">Cancelar subscrição</a>
  </div>
</div>`,
    text: `Bom dia,

Obrigado pelo contacto e interesse na Prozis.

Em sequência do teu pedido de informação, gostaríamos de apresentar o Prozis Elite, um programa direcionado para profissionais na área da defesa.

Através do Prozis Elite:
* tens acesso a uma conta de parceiro com descontos;
* este desconto é imediato e utilizável em todas as encomendas realizadas durante a duração da parceria;
* tens acesso a campanhas exclusivas e apoio personalizado ao negócio;
* acumulas ProzisPoints em todas as compras, que podem ser trocados por produtos Prozis.

O valor mínimo de compra é de 24,99€ e 49,99€ para obtenção de portes grátis.

Para ativarmos a conta Prozis Elite é necessário:
• indicar-nos qual o e-mail de registo na nossa loja online - www.prozis.com ou efetuar o registo;
• indicação do número profissional.

Ficamos a aguardar a tua resposta.

Obrigado!`,
  },
  // Adicionar mais templates aqui conforme forem enviados
};

// Placeholder para combinações sem template ainda
const PLACEHOLDER = (country, model, type) => ({
  subject: `[Template a definir] ${model} · ${country}`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;text-align:center;color:#64748b">
  <p style="font-size:18px;font-weight:bold;margin-bottom:8px">Template em preparação</p>
  <p>O template para <strong>${model} · ${country} · ${EMAIL_TYPES.find(t=>t.id===type)?.label}</strong> ainda não foi configurado.</p>
</div>`,
  text: `Template em preparação para ${model} · ${country}.`,
});

// ── Componente principal ───────────────────────────────────────────────────────
export default function EmailTemplatesApp({ onHome, session }) {
  const email = session?.user?.email || "";
  const canAccess = ALLOWED.includes(email);

  const [country,    setCountry]    = useState("");
  const [model,      setModel]      = useState("");
  const [emailType,  setEmailType]  = useState("");
  const [view,       setView]       = useState("preview"); // preview | html
  const [copiedHTML, setCopiedHTML] = useState(false);
  const [copiedTxt,  setCopiedTxt]  = useState(false);

  // Bloco 4 — lista de emails
  const [wantList,   setWantList]   = useState(false);
  const [emailList,  setEmailList]  = useState("");
  const [sentBatches,setSentBatches]= useState(new Set());
  const [sending,    setSending]    = useState(false);

  const emails = emailList
    .split(/[\n,;]+/)
    .map(e => e.trim())
    .filter(e => e.includes("@"));

  const BATCH_SIZE = 15;
  const batches = [];
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    batches.push(emails.slice(i, i + BATCH_SIZE));
  }

  const key      = country && model && emailType ? makeKey(country, model, emailType) : null;
  const template = key ? (TEMPLATES[key] || PLACEHOLDER(country, model, emailType)) : null;

  const copy = async (text, setCopied) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const sendBatch = async (batchIndex) => {
    const batch = batches[batchIndex];
    if (!batch || !template) return;
    setSending(true);
    // Gera o mailto com BCC
    const bcc    = batch.join(",");
    const subj   = encodeURIComponent(template.subject);
    const body   = encodeURIComponent(template.text);
    const mailto = `mailto:partners@prozis.com?bcc=${encodeURIComponent(bcc)}&subject=${subj}&body=${body}`;
    window.open(mailto, "_blank");
    setSentBatches(prev => new Set([...prev, batchIndex]));
    setSending(false);
  };

  // Acesso restrito
  if (!session) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600 font-medium">Precisas de estar autenticado.</p>
      </div>
    </div>
  );

  if (!canAccess) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-slate-900 font-medium mb-1">Acesso restrito</p>
        <p className="text-sm text-slate-500">Este separador ainda não está disponível para o teu utilizador.</p>
        {onHome && (
          <button onClick={onHome} className="mt-4 flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 mx-auto">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao início
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Templates Email</h1>
            <p className="text-sm text-slate-500 mt-0.5">Gera, copia e envia templates para listas de parceiros</p>
          </div>
          {onHome && (
            <button onClick={onHome} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200">
              <ArrowLeft className="w-3.5 h-3.5" /> Início
            </button>
          )}
        </div>

        {/* BLOCO 1 — Parâmetros */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-medium flex-shrink-0">1</div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parâmetros do envio</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">País</label>
              <select value={country} onChange={e => { setCountry(e.target.value); setSentBatches(new Set()); }}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500">
                <option value="">Seleccionar…</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Modelo de parceria</label>
              <select value={model} onChange={e => { setModel(e.target.value); setSentBatches(new Set()); }}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500">
                <option value="">Seleccionar…</option>
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* BLOCO 2 — Tipo de email */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-medium flex-shrink-0">2</div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo de email</p>
          </div>
          <select value={emailType} onChange={e => { setEmailType(e.target.value); setSentBatches(new Set()); }}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500">
            <option value="">Seleccionar tipo de email…</option>
            {EMAIL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        {/* BLOCO 3 — Template */}
        {template && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-medium flex-shrink-0">3</div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Template gerado</p>
                <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                  {model} · {country}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copy(template.html, setCopiedHTML)}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                  {copiedHTML ? <><Check className="w-3 h-3 text-green-600" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar HTML</>}
                </button>
                <button onClick={() => copy(template.text, setCopiedTxt)}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                  {copiedTxt ? <><Check className="w-3 h-3 text-green-600" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar texto</>}
                </button>
              </div>
            </div>

            {/* Assunto */}
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 bg-slate-50">
              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-500">Assunto:</span>
              <span className="text-xs font-medium text-slate-900">{template.subject}</span>
            </div>

            {/* Abas */}
            <div className="flex border-b border-slate-100">
              <button onClick={() => setView("preview")}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${view === "preview" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                Pré-visualização
              </button>
              <button onClick={() => setView("html")}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${view === "html" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                HTML
              </button>
            </div>

            {view === "preview" && (
              <div className="p-4">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={template.html}
                    title="Preview email"
                    className="w-full"
                    style={{ minHeight: 400, border: "none" }}
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}
            {view === "html" && (
              <div className="p-4">
                <pre className="text-xs leading-relaxed text-emerald-400 bg-slate-900 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono">
                  {template.html}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* BLOCO 4 — Lista de emails */}
        {template && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-medium flex-shrink-0">4</div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Enviar para lista de emails?</p>
              </div>
              <button
                onClick={() => { setWantList(v => !v); setEmailList(""); setSentBatches(new Set()); }}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${wantList ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                {wantList ? "Sim, tenho lista" : "Não"}
              </button>
            </div>

            {wantList && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">
                  Copia a coluna de emails do Excel (um email por linha) e cola abaixo:
                </p>
                <textarea
                  value={emailList}
                  onChange={e => { setEmailList(e.target.value); setSentBatches(new Set()); }}
                  rows={5}
                  placeholder={"email1@exemplo.com\nemail2@exemplo.com\nemail3@exemplo.com"}
                  className="w-full text-xs font-mono px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none bg-slate-50"
                />
                {emails.length > 0 && (
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                        {emails.length} emails detectados
                      </span>
                      <span className="text-xs text-slate-500">
                        → {batches.length} lote{batches.length !== 1 ? "s" : ""} de máx. {BATCH_SIZE}
                      </span>
                    </div>
                    <button onClick={() => { setEmailList(""); setSentBatches(new Set()); }}
                      className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                      <X className="w-3 h-3" /> Limpar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* BLOCO 5 — Envio */}
        {template && wantList && emails.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-medium flex-shrink-0">5</div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Envio automático</p>
            </div>

            {/* Info */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-xs text-slate-600">
              <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
              <span><strong>Para:</strong> partners@prozis.com &nbsp;·&nbsp; <strong>BCC:</strong> máx. {BATCH_SIZE}/lote &nbsp;·&nbsp; <strong>Total:</strong> {emails.length} emails · {batches.length} lote{batches.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Lotes */}
            <div className="space-y-2 mb-4">
              {batches.map((batch, i) => {
                const sent = sentBatches.has(i);
                const isNext = !sent && !batches.slice(0, i).some((_, j) => !sentBatches.has(j));
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${sent ? "bg-green-50 border-green-200" : isNext ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${sent ? "text-green-700" : isNext ? "text-blue-700" : "text-slate-500"}`}>
                        {sent ? "✓ " : ""}Lote {i+1} · {batch.length} email{batch.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {batch.slice(0,3).join(", ")}{batch.length > 3 ? ` +${batch.length - 3} mais` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => sendBatch(i)}
                      disabled={sent || !isNext || sending}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
                        sent ? "bg-green-100 text-green-700 cursor-default"
                             : isNext ? "bg-slate-900 text-white hover:bg-slate-700"
                             : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}>
                      {sent ? <><Check className="w-3 h-3" /> Enviado</> : <><Send className="w-3 h-3" /> Enviar lote</>}
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-slate-400">
              Ao clicar "Enviar lote", abre o teu cliente de email com o destinatário, assunto e BCC já preenchidos. Confirma e envia directamente. O próximo lote fica disponível após enviar o actual.
            </p>
          </div>
        )}

        {!template && (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
            <Mail className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Selecciona o país, modelo e tipo de email</p>
            <p className="text-xs text-slate-400 mt-1">O template gerado aparece aqui</p>
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-slate-400 pb-4">Templates Email · Equipa Comercial</footer>
      </div>
    </div>
  );
}
