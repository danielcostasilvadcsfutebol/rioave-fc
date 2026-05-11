'use client';

import { useState, useMemo } from 'react';
import { MOCK_JOGOS_2526, MOCK_RESUMO_EPOCAS, calcularKpis } from '@/lib/mock-data';
import type { JogoComRelacoes } from '@/types';

const IconSort = ({ asc }: { asc: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <path d={asc ? 'M6 2L2 8h8L6 2z' : 'M6 10L2 4h8L6 10z'} />
  </svg>
);

const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d={open ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString('pt-PT');
}

function fmtData(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

type SortKey = 'jornada' | 'adversario' | 'assistencia' | 'pct_ocupacao';

function KpiCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`kpi-card fade-in ${accent ? 'kpi-card-accent' : ''}`}>
      <span className={`text-xs font-semibold uppercase tracking-wider ${accent ? 'text-green-200' : 'text-[#6B7280]'}`}>{label}</span>
      <span className={`font-display text-4xl leading-none ${accent ? 'text-white' : 'text-[#006B3C]'}`}>{value}</span>
      {sub && <span className={`text-xs mt-0.5 ${accent ? 'text-green-100' : 'text-[#6B7280]'}`}>{sub}</span>}
    </div>
  );
}

function OcupacaoBarra({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-[#6B7280]">—</span>;
  const cor = pct >= 80 ? '#006B3C' : pct >= 50 ? '#16A34A' : '#86EFAC';
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="progress-bar flex-1">
        <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: cor }} />
      </div>
      <span className="text-xs font-mono w-10 text-right text-[#374151]">{pct.toFixed(0)}%</span>
    </div>
  );
}

function GraficoHistorico() {
  const epocas = MOCK_RESUMO_EPOCAS.filter(e => e.total_assistencia > 0).slice(0, 8).reverse();
  const max = Math.max(...epocas.map(e => e.media_assistencia));
  return (
    <div className="card p-5 fade-in">
      <h2 className="font-display text-xl text-[#111111] mb-4 tracking-wide">MÉDIA DE ESPECTADORES POR ÉPOCA</h2>
      <div className="flex items-end gap-2 h-28">
        {epocas.map(e => {
          const h = max > 0 ? (e.media_assistencia / max) * 100 : 0;
          return (
            <div key={e.epoca} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-[9px] text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity">{fmt(e.media_assistencia)}</span>
              <div className="w-full rounded-t-sm transition-all duration-500" style={{ height: `${h}%`, minHeight: 4, backgroundColor: e.ativa ? '#006B3C' : '#C8E6D5' }} />
              <span className="text-[8px] text-[#6B7280]">{e.epoca.split('/')[0].slice(-2)}/{e.epoca.split('/')[1].slice(-2)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#006B3C]" /><span className="text-xs text-[#6B7280]">Época atual</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#C8E6D5]" /><span className="text-xs text-[#6B7280]">Épocas anteriores</span></div>
      </div>
    </div>
  );
}

function JogoRow({ jogo, expandida, onToggle }: { jogo: JogoComRelacoes; expandida: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className={`cursor-pointer ${expandida ? 'expanded' : ''}`} onClick={onToggle}>
        <td className="text-center w-10"><span className="font-display text-lg text-[#006B3C]">{jogo.jornada}</span></td>
        <td>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 rounded-full bg-[#006B3C] opacity-30" />
            <span className="font-medium">{jogo.adversario}</span>
          </div>
        </td>
        <td className="hidden sm:table-cell text-[#6B7280] text-xs">{fmtData(jogo.data_jogo)}</td>
        <td className="font-mono text-right">
          {jogo.jogo_porta_fechada
            ? <span className="badge badge-cinza">Porta fechada</span>
            : <span className="font-semibold">{fmt(jogo.assistencia)}</span>}
        </td>
        <td className="hidden md:table-cell"><OcupacaoBarra pct={jogo.pct_ocupacao} /></td>
        <td className="w-8 text-center text-[#6B7280]"><IconChevron open={expandida} /></td>
      </tr>
      {expandida && (
        <tr className="bg-[#F0FBF5]">
          <td colSpan={6} className="px-4 pb-4 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div><p className="text-xs text-[#6B7280] uppercase tracking-wide mb-0.5">Estádio</p><p className="font-medium">{jogo.estadio?.nome ?? '—'}</p></div>
              <div><p className="text-xs text-[#6B7280] uppercase tracking-wide mb-0.5">Hora</p><p className="font-medium">{jogo.hora_jogo ?? '—'}</p></div>
              <div><p className="text-xs text-[#6B7280] uppercase tracking-wide mb-0.5">Capacidade</p><p className="font-medium">{fmt(jogo.capacidade_jogo)}</p></div>
              <div><p className="text-xs text-[#6B7280] uppercase tracking-wide mb-0.5">% Ocupação</p><p className="font-medium text-[#006B3C]">{jogo.pct_ocupacao != null ? `${jogo.pct_ocupacao.toFixed(1)}%` : '—'}</p></div>
              {jogo.notas && <div className="col-span-2 sm:col-span-4"><p className="text-xs text-[#6B7280] uppercase tracking-wide mb-0.5">Nota</p><p>{jogo.notas}</p></div>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function HomePage() {
  const jogos = MOCK_JOGOS_2526;
  const kpis  = useMemo(() => calcularKpis(jogos), [jogos]);
  const [sortKey, setSortKey]     = useState<SortKey>('jornada');
  const [sortAsc, setSortAsc]     = useState(true);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [busca, setBusca]         = useState('');

  const jogosFiltrados = useMemo(() => {
    let lista = [...jogos];
    if (busca.trim()) lista = lista.filter(j => j.adversario.toLowerCase().includes(busca.toLowerCase()));
    lista.sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      if (typeof va === 'string' && typeof vb === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return lista;
  }, [jogos, sortKey, sortAsc, busca]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  const epocaAtual     = MOCK_RESUMO_EPOCAS[0];
  const epocaAnterior  = MOCK_RESUMO_EPOCAS[1];
  const diffMedia      = epocaAtual.media_assistencia - epocaAnterior.media_assistencia;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#006B3C] rounded-full flex items-center justify-center">
              <span className="text-white font-display text-sm">RA</span>
            </div>
            <div>
              <h1 className="font-display text-lg leading-none tracking-wide">RIO AVE FC</h1>
              <p className="text-[10px] text-[#6B7280] uppercase tracking-widest">Estatísticas</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <a href="#assistencias" className="text-sm font-medium text-[#006B3C] px-3 py-1.5 rounded-lg bg-[#E8F5EE]">Assistências</a>
            <a href="/admin" className="text-sm text-[#6B7280] px-3 py-1.5 rounded-lg hover:bg-[#F3F4F6] transition-colors">Admin</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-[#006B3C] rounded-2xl p-6 text-white fade-in">
          <p className="text-green-200 text-xs uppercase tracking-widest mb-1">Época 2025/26 · Liga Portugal Betclic</p>
          <h2 className="font-display text-5xl sm:text-6xl tracking-wide leading-none">ESTÁDIO DOS ARCOS</h2>
          <p className="text-green-100 text-sm mt-2">{kpis.totalJogos} jogos em casa · {fmt(kpis.totalAssistencia)} espectadores acumulados</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard accent label="Acumulado da Época" value={fmt(kpis.totalAssistencia)} sub={`${kpis.totalJogos} jogos em casa`} />
          <KpiCard label="Média por Jogo" value={fmt(kpis.mediaAssistencia)} sub={`vs ${fmt(epocaAnterior.media_assistencia)} em 24/25`} />
          <KpiCard label="Maior Assistência" value={fmt(kpis.maximoAssistencia)} sub={kpis.jogoMaximo?.adversario ?? '—'} />
          <KpiCard label="Ocupação Média" value={`${kpis.pctOcupacaoMedia}%`} sub="Estádio dos Arcos" />
        </div>

        <div className="card p-4 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wider">Variação vs época anterior</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`font-display text-3xl ${diffMedia >= 0 ? 'text-[#006B3C]' : 'text-[#DC2626]'}`}>{diffMedia >= 0 ? '+' : ''}{fmt(diffMedia)}</span>
                <span className="text-sm text-[#6B7280]">espectadores / jogo</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6B7280]">24/25: {fmt(epocaAnterior.media_assistencia)} médios</p>
              <p className="text-xs text-[#6B7280]">25/26: {fmt(epocaAtual.media_assistencia)} médios</p>
            </div>
          </div>
        </div>

        <GraficoHistorico />

        <div id="assistencias" className="card overflow-hidden fade-in">
          <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl tracking-wide">JOGOS EM CASA · 2025/26</h2>
              <p className="text-xs text-[#6B7280] mt-0.5">Clica numa linha para ver mais detalhes</p>
            </div>
            <input type="search" placeholder="Pesquisar adversário..." value={busca} onChange={e => setBusca(e.target.value)}
              className="w-full sm:w-48 px-3 py-1.5 text-sm rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#006B3C]/30 focus:border-[#006B3C] bg-[#F8F9FA]" />
          </div>
          <div className="overflow-x-auto">
            <table className="table-ra">
              <thead>
                <tr>
                  <th onClick={() => handleSort('jornada')} className="w-14 text-center"><span className="flex items-center justify-center gap-1">J <IconSort asc={sortKey === 'jornada' ? sortAsc : true} /></span></th>
                  <th onClick={() => handleSort('adversario')}><span className="flex items-center gap-1">Adversário <IconSort asc={sortKey === 'adversario' ? sortAsc : true} /></span></th>
                  <th className="hidden sm:table-cell">Data</th>
                  <th onClick={() => handleSort('assistencia')} className="text-right"><span className="flex items-center justify-end gap-1">Espectadores <IconSort asc={sortKey === 'assistencia' ? sortAsc : true} /></span></th>
                  <th onClick={() => handleSort('pct_ocupacao')} className="hidden md:table-cell"><span className="flex items-center gap-1">Ocupação <IconSort asc={sortKey === 'pct_ocupacao' ? sortAsc : true} /></span></th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {jogosFiltrados.length === 0
                  ? <tr><td colSpan={6} className="text-center py-12 text-[#6B7280]">Nenhum jogo encontrado para &ldquo;{busca}&rdquo;</td></tr>
                  : jogosFiltrados.map(jogo => <JogoRow key={jogo.id} jogo={jogo} expandida={expandida === jogo.id} onToggle={() => setExpandida(p => p === jogo.id ? null : jogo.id)} />)
                }
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>{jogosFiltrados.length} de {jogos.length} jogos</span>
            <span>Total: <strong className="text-[#111111]">{fmt(jogosFiltrados.reduce((s, j) => s + (j.assistencia ?? 0), 0))}</strong> espectadores</span>
          </div>
        </div>

        <p className="text-xs text-center text-[#6B7280] pb-6">
          Dados baseados nos registos do{' '}
          <a href="https://reisdoave.blogspot.com" target="_blank" rel="noopener noreferrer" className="text-[#006B3C] hover:underline">Reis do Ave</a>
          {' '}· Plataforma não oficial · Estádio dos Arcos, Vila do Conde
        </p>
      </main>
    </div>
  );
}
