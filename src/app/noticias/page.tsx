// src/app/noticias/page.tsx
// Server Component — fetches Blogger feed server-side on each request
// Revalidates every hour automatically via Vercel ISR

import Link from 'next/link';

export const revalidate = 3600; // refresh every hour

interface BlogPost {
  id: string;
  title: string;
  published: string;
  url: string;
  thumbnail?: string;
  summary: string;
}

async function fetchPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      'https://reisdoave.blogspot.com/feeds/posts/default?alt=json&max-results=30',
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const entries = data?.feed?.entry ?? [];

    return entries.map((e: Record<string, unknown>, i: number) => {
      const title     = (e.title as Record<string,string>)?.$t ?? '';
      const published = (e.published as Record<string,string>)?.$t ?? '';
      const content   = (e.content as Record<string,string>)?.$t ?? '';

      // Find the alternate link (post URL)
      const links  = (e.link as { rel: string; href: string }[]) ?? [];
      const altLink = links.find(l => l.rel === 'alternate');
      const url     = altLink?.href ?? '#';

      // Extract first image from content
      const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
      const thumbnail = imgMatch?.[1] ?? undefined;

      // Plain text summary (strip HTML, max 160 chars)
      const summary = content
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160) + (content.length > 160 ? '…' : '');

      return { id: String(i), title, published, url, thumbnail, summary };
    });
  } catch {
    return [];
  }
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

export default async function NoticiasPage() {
  const posts = await fetchPosts();

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', fontFamily: "'Sora', -apple-system, sans-serif" }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '0.5px solid #E4E7EC', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', color: '#6B7280', fontSize: 12, fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M10 3L5 8l5 5"/>
            </svg>
            Início
          </Link>
          <span style={{ color: '#E4E7EC' }}>·</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111318' }}>Notícias</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#B0B5BE', letterSpacing: '.08em', textTransform: 'uppercase' }}>Reis do Ave · Blog</div>
          </div>
          {/* Live indicator */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#006B3C', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#006B3C', display: 'inline-block', animation: 'pulse 2s infinite' }}/>
            Auto-atualizado
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '16px' }}>

        {/* Banner */}
        <div style={{ background: 'linear-gradient(135deg,#003D20,#005A30)', borderRadius: 14, padding: '20px 22px', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.4)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Blog</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Reis do Ave</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>reisdoave.blogspot.com</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{posts.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>artigos</div>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 14, padding: '40px 20px', textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📰</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Não foi possível carregar os artigos</div>
            <div style={{ fontSize: 12 }}>Verifica a ligação ou tenta mais tarde.</div>
            <a href="https://reisdoave.blogspot.com" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 16, fontSize: 12, fontWeight: 600, color: '#006B3C', textDecoration: 'none' }}>
              Abrir blog diretamente →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {posts.map((post, i) => (
              <a key={post.id} href={post.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', border: '1.5px solid #E4E7EC', borderRadius: 14, overflow: 'hidden', display: 'flex', transition: 'all .15s', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#006B3C'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,107,60,.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E4E7EC'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  {/* Thumbnail */}
                  {post.thumbnail ? (
                    <div style={{ width: 120, minHeight: 100, flexShrink: 0, background: '#F0F2F5', overflow: 'hidden', position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLElement).parentElement!.style.display = 'none'; }}/>
                    </div>
                  ) : (
                    <div style={{ width: 100, minHeight: 100, flexShrink: 0, background: '#EEF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                      📰
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ padding: '14px 16px', flex: 1, minWidth: 0 }}>
                    {i === 0 && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: '#EEF7F2', color: '#006B3C', textTransform: 'uppercase', letterSpacing: '.06em', display: 'inline-block', marginBottom: 6 }}>
                        Mais recente
                      </span>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111318', lineHeight: 1.35, marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                      {post.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.5, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                      {post.summary}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>{fmtDate(post.published)}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#006B3C', display: 'flex', alignItems: 'center', gap: 3 }}>
                        Ler artigo
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8h10M9 4l4 4-4 4" stroke="#006B3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}

            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <a href="https://reisdoave.blogspot.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: '#006B3C', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Ver todos os artigos no blog
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="#006B3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: '#B0B5BE' }}>
          Dados coletados por Daniel Silva · Sócio 3883
        </div>
      </main>
    </div>
  );
}
