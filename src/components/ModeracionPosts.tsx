import { useState } from 'react';

interface Post {
  id: string;
  tipo: string;
  historia: string;
  src: string;
  estado: string;
  alias: string;
  userEmail: string;
  eventoTitulo: string;
}

export default function ModeracionPosts({ posts: inicial }: { posts: Post[] }) {
  const [posts, setPosts] = useState(inicial);
  const [busy, setBusy] = useState<string | null>(null);

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este post para siempre?')) return;
    setBusy(id);
    await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    setPosts((ps) => ps.filter((p) => p.id !== id));
    setBusy(null);
  }

  async function toggle(p: Post) {
    const estado = p.estado === 'oculto' ? 'visible' : 'oculto';
    setBusy(p.id);
    await fetch(`/api/admin/posts/${p.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, estado } : x)));
    setBusy(null);
  }

  if (!posts.length) return <p className="admin-vacio">Todavía no hay posts.</p>;

  return (
    <table className="admin-tabla">
      <thead>
        <tr><th></th><th>Misa</th><th>Quién</th><th>Historia</th><th>Estado</th><th></th></tr>
      </thead>
      <tbody>
        {posts.map((p) => (
          <tr key={p.id} className={p.estado === 'oculto' ? 'admin-oculto' : ''}>
            <td>{p.tipo === 'recuerdo' || !p.src ? <span className="admin-vela">🕯️</span> : <img src={p.src} alt="" className="admin-thumb" />}</td>
            <td>{p.eventoTitulo}</td>
            <td>{p.alias}<br /><span className="admin-sub">{p.userEmail}</span></td>
            <td className="admin-hist">{p.historia}</td>
            <td>{p.estado}</td>
            <td className="admin-acc">
              <button className="admin-mini" disabled={busy === p.id} onClick={() => toggle(p)}>
                {p.estado === 'oculto' ? 'mostrar' : 'ocultar'}
              </button>
              <button className="admin-mini admin-mini-rojo" disabled={busy === p.id} onClick={() => eliminar(p.id)}>
                eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
