import { useState } from 'react';
import type { GrupoRecuerdos } from '@/lib/eventos.server';

export default function MisRecuerdos({ grupos: inicial }: { grupos: GrupoRecuerdos[] }) {
  const [grupos, setGrupos] = useState(inicial);
  const [borrando, setBorrando] = useState<string | null>(null);

  async function borrar(slug: string, id: string) {
    if (!confirm('¿Borrar este recuerdo? No se puede deshacer.')) return;
    setBorrando(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGrupos((gs) =>
          gs
            .map((g) => (g.slug === slug ? { ...g, posts: g.posts.filter((p) => p.id !== id) } : g))
            .filter((g) => g.posts.length > 0),
        );
      }
    } finally {
      setBorrando(null);
    }
  }

  if (!grupos.length) {
    return (
      <p className="perfil-vacio">
        Todavía no dejaste ningún recuerdo. <a href="/">Entrá a una misa</a> y sumate.
      </p>
    );
  }

  return (
    <div className="perfil-grupos">
      {grupos.map((g) => (
        <div key={g.slug} className="perfil-grupo">
          <a href={`/evento/${g.slug}`} className="perfil-evento stencil">
            {g.titulo}
          </a>
          <div className="perfil-posts">
            {g.posts.map((p) => (
              <div key={p.id} className="perfil-post afiche">
                {p.tipo === 'recuerdo' || !p.src ? (
                  <span className="perfil-vela">🕯️</span>
                ) : (
                  <img src={p.src} alt="" className="perfil-img no-drag" />
                )}
                <p className="perfil-historia">“{p.historia}”</p>
                <button
                  className="perfil-borrar"
                  disabled={borrando === p.id}
                  onClick={() => borrar(g.slug, p.id)}
                >
                  {borrando === p.id ? '...' : 'Borrar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
