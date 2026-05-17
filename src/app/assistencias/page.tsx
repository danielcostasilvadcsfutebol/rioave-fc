'use client';
import { useState, useEffect, useMemo } from 'react';
import { useIsMobile } from '@/lib/useIsMobile';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';

const CAPACIDADE = 5300;

interface JogoEspectadores {
  id: string;
  jornada: string;
  data: string;
  adversario: string;
  competicao: string;
  competicao_label: string;
  local: string;
  golos_ra: number;
  golos_adv: number;
  resultado: string;
  espectadores: number | null;
}

function pct(n: number, total: number) {
  return total > 0 ? Math.round(n / total * 100) : 0;
}

function fmt(n: number) {
  return n.toLocaleString('pt-PT');
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function OccupancyBar({ value, max, color = '#006B3C' }: { value: number; max: number; color?: string }) {
  const p = pct(value, max);
  return (
    <div style={{ height: 6, background: '#E4E7EC', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 99, transition: 'width .4s' }} />
    </div>
  );
}

export default function AssistenciasPage() {
  const isMobile = useIsMobile();
  const [epoca, setEpoca] = useState('25/26');
  const [tab, setTab] = useState<'jogo' | 'adversarios' | 'epoca'>('jogo');
  const [jogos, setJogos] = useState<JogoEspectadores[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('jogos')
      .select('id,jornada,data,adversario,competicao,competicao_label,local,golos_ra,golos_adv,resultado,espectadores')
      .eq('epoca', epoca)
      .eq('local', 'casa')
      .eq('publicado', true)
      .order('data', { ascending: true })
      .then(({ data }) => {
        setJogos((data ?? []) as JogoEspectadores[]);
        setLoading(false);
      });
  }, [epoca]);

  const comEspectadores = useMemo(() => jogos.filter(j => j.espectadores != null), [jogos]);

  const totalEspectadores = useMemo(() => comEspectadores.reduce((s, j) => s + (j.espectadores ?? 0), 0), [comEspectadores]);
  const mediaEspectadores = useMemo(() => comEspectadores.length > 0 ? Math.round(totalEspectadores / comEspectadores.length) : 0, [totalEspectadores, comEspectadores]);
  const maxJogo = useMemo(() => comEspectadores.reduce((mx, j) => (j.espectadores ?? 0) > (mx?.espectadores ?? 0) ? j : mx, comEspectadores[0]), [comEspectadores]);
  const minJogo = useMemo(() => comEspectadores.reduce((mn, j) => (j.espectadores ?? 0) < (mn?.espectadores ?? Infinity) ? j : mn, comEspectadores[0]), [comEspectadores]);

  // Adversários com média
  const adversarios = useMemo(() => {
    const map = new Map<string, { total: number; jogos: number; max: number }>();
    for (const j of comEspectadores) {
      const e = map.get(j.adversario) ?? { total: 0, jogos: 0, max: 0 };
      e.total += j.espectadores!;
      e.jogos++;
      e.max = Math.max(e.max, j.espectadores!);
      map.set(j.adversario, e);
    }
    return Array.from(map.entries())
      .map(([adv, v]) => ({ adversario: adv, media: Math.round(v.total / v.jogos), total: v.total, jogos: v.jogos, max: v.max }))
      .sort((a, b) => b.media - a.media);
  }, [comEspectadores]);

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
    border: '1.5px solid', cursor: 'pointer',
    borderColor: tab === t ? '#006B3C' : '#E4E7EC',
    background: tab === t ? '#006B3C' : '#fff',
    color: tab === t ? '#fff' : '#6B7280',
  });

  const RES_BG = { V: '#EEF7F2', E: '#F3F4F6', D: '#FCEBEB' };
  const RES_COLOR = { V: '#006B3C', E: '#6B7280', D: '#DC2626' };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5' }}>
      <header style={{ background: '#fff', borderBottom: '0.5px solid #E4E7EC', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', color: '#6B7280', fontSize: 12, fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 3L5 8l5 5" /></svg>Início
          </Link>
          <span style={{ color: '#E4E7EC' }}>·</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111318' }}>Assistências nos Arcos</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#B0B5BE', letterSpacing: '.08em', textTransform: 'uppercase' }}>Estádio dos Arcos · Cap. {fmt(CAPACIDADE)}</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: isMobile ? '10px' : '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Banner */}
        <div style={{ background: 'linear-gradient(135deg,#003D20,#005A30)', borderRadius: 14, padding: 20, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Época {epoca} · {comEspectadores.length} jogos com dados
            </div>
            <select value={epoca} onChange={e => setEpoca(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {['25/26', '24/25', '23/24'].map(e => <option key={e} value={e} style={{ color: '#111' }}>{e}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 8 }}>
            {[
              { l: 'Total', v: fmt(totalEspectadores), s: `${comEspectadores.length} jogos` },
              { l: 'Média', v: fmt(mediaEspectadores), s: `${pct(mediaEspectadores, CAPACIDADE)}% lotação` },
              { l: 'Máximo', v: maxJogo ? fmt(maxJogo.espectadores!) : '—', s: maxJogo?.adversario ?? '' },
              { l: 'Mínimo', v: minJogo ? fmt(minJogo.espectadores!) : '—', s: minJogo?.adversario ?? '' },
            ].map(s => (
              <div key={s.l} style={{ background: 'rgba(0,0,0,.2)', borderRadius: 9, padding: '9px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>{s.l}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-.5px', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>{s.s}</div>
              </div>
            ))}
          </div>
          {/* Occupancy bar */}
          {comEspectadores.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>
                <span>Lotação média</span>
                <span>{pct(mediaEspectadores, CAPACIDADE)}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct(mediaEspectadores, CAPACIDADE)}%`, background: '#5CFF9D', borderRadius: 99 }} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setTab('jogo')} style={tabStyle('jogo')}>Por Jogo</button>
          <button onClick={() => setTab('adversarios')} style={tabStyle('adversarios')}>Por Adversário</button>
          <button onClick={() => setTab('epoca')} style={tabStyle('epoca')}>Por Época</button>
        </div>

        {loading ? (
          <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
            A carregar dados…
          </div>
        ) : comEspectadores.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏟️</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Sem dados de assistência</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Adiciona o número de espectadores nos jogos em casa pelo painel admin.</div>
          </div>
        ) : (
          <>
            {/* ── Por Jogo ── */}
            {tab === 'jogo' && (
              <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 60px', gap: 8, padding: '8px 16px', background: '#F9FAFB', borderBottom: '1px solid #E4E7EC', fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  <div>Jogo</div><div style={{ textAlign: 'right' }}>Espectadores</div><div style={{ textAlign: 'right' }}>Lotação</div><div style={{ textAlign: 'center' }}>Res.</div>
                </div>
                {comEspectadores.map((j, i) => {
                  const p = pct(j.espectadores!, CAPACIDADE);
                  const barColor = p >= 80 ? '#006B3C' : p >= 50 ? '#EF9F27' : '#9CA3AF';
                  return (
                    <div key={j.id} style={{ padding: isMobile ? '10px' : '12px 16px', borderBottom: i < comEspectadores.length - 1 ? '1px solid #F3F4F6' : 'none', display: 'grid', gridTemplateColumns: isMobile ? '1fr 80px 50px' : '1fr 90px 90px 60px', gap: 8, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111318' }}>{j.adversario}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{fmtDate(j.data)} · {j.jornada}</div>
                        <div style={{ marginTop: 5 }}><OccupancyBar value={j.espectadores!} max={CAPACIDADE} color={barColor} /></div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111318' }}>{fmt(j.espectadores!)}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>de {fmt(CAPACIDADE)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: barColor }}>{p}%</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: RES_BG[j.resultado as keyof typeof RES_BG], color: RES_COLOR[j.resultado as keyof typeof RES_COLOR] }}>
                          {j.golos_ra}-{j.golos_adv}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Por Adversário ── */}
            {tab === 'adversarios' && (
              <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 60px', gap: 8, padding: '8px 16px', background: '#F9FAFB', borderBottom: '1px solid #E4E7EC', fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  <div>Adversário</div><div style={{ textAlign: 'right' }}>Média</div><div style={{ textAlign: 'right' }}>Máximo</div><div style={{ textAlign: 'center' }}>Jogos</div>
                </div>
                {adversarios.map((a, i) => (
                  <div key={a.adversario} style={{ padding: '11px 16px', borderBottom: i < adversarios.length - 1 ? '1px solid #F3F4F6' : 'none', display: 'grid', gridTemplateColumns: '1fr 80px 80px 60px', gap: 8, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111318' }}>{a.adversario}</div>
                      <div style={{ marginTop: 5 }}><OccupancyBar value={a.media} max={CAPACIDADE} /></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111318' }}>{fmt(a.media)}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>{pct(a.media, CAPACIDADE)}%</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#374151' }}>{fmt(a.max)}</div>
                    <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#9CA3AF' }}>{a.jogos}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Por Época ── */}
            {tab === 'epoca' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Resumo época {epoca}</div>
                  {[
                    { l: 'Jogos em casa com dados', v: String(comEspectadores.length), sub: `de ${jogos.length} disputados` },
                    { l: 'Total de espectadores', v: fmt(totalEspectadores), sub: 'acumulado época' },
                    { l: 'Média por jogo', v: fmt(mediaEspectadores), sub: `${pct(mediaEspectadores, CAPACIDADE)}% de lotação` },
                    { l: 'Jogo mais assistido', v: maxJogo ? fmt(maxJogo.espectadores!) : '—', sub: maxJogo ? `vs ${maxJogo.adversario} · ${fmtDate(maxJogo.data)}` : '' },
                    { l: 'Jogo menos assistido', v: minJogo ? fmt(minJogo.espectadores!) : '—', sub: minJogo ? `vs ${minJogo.adversario} · ${fmtDate(minJogo.data)}` : '' },
                    { l: 'Capacidade do estádio', v: fmt(CAPACIDADE), sub: 'Estádio dos Arcos' },
                  ].map((row, i) => (
                    <div key={row.l} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '9px 0', borderBottom: i < 5 ? '1px solid #F3F4F6' : 'none' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#374151' }}>{row.l}</div>
                        {row.sub && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{row.sub}</div>}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#006B3C' }}>{row.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', padding: '4px 0 16px', fontSize: 11, color: '#B0B5BE' }}>
          Dados coletados por Daniel Silva · Sócio 3883
        </div>
      </main>
    </div>
  );
}
