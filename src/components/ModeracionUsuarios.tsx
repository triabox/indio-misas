import { useState } from 'react';

interface Usuario {
  id: string;
  email: string;
  name: string;
  alias: string | null;
  rol: string;
  bloqueado: boolean;
  posts: number;
}

export default function ModeracionUsuarios({ usuarios: inicial, miId }: { usuarios: Usuario[]; miId?: string }) {
  const [us, setUs] = useState(inicial);
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(id: string, body: Record<string, unknown>, upd: Partial<Usuario>) {
    setBusy(id);
    await fetch(`/api/admin/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setUs((x) => x.map((u) => (u.id === id ? { ...u, ...upd } : u)));
    setBusy(null);
  }

  if (!us.length) return <p className="admin-vacio">Todavía no hay usuarios.</p>;

  return (
    <table className="admin-tabla">
      <thead>
        <tr><th>Usuario</th><th>Posts</th><th>Rol</th><th>Estado</th><th></th></tr>
      </thead>
      <tbody>
        {us.map((u) => (
          <tr key={u.id} className={u.bloqueado ? 'admin-oculto' : ''}>
            <td>{u.alias || u.name}<br /><span className="admin-sub">{u.email}</span></td>
            <td>{u.posts}</td>
            <td>{u.rol}</td>
            <td>{u.bloqueado ? 'bloqueado' : 'activo'}</td>
            <td className="admin-acc">
              {u.id === miId ? (
                <span className="admin-sub">vos</span>
              ) : (
                <>
                  <button
                    className="admin-mini admin-mini-rojo"
                    disabled={busy === u.id}
                    onClick={() => patch(u.id, { bloqueado: !u.bloqueado }, { bloqueado: !u.bloqueado })}
                  >
                    {u.bloqueado ? 'desbloquear' : 'bloquear'}
                  </button>
                  <button
                    className="admin-mini"
                    disabled={busy === u.id}
                    onClick={() => patch(u.id, { rol: u.rol === 'admin' ? 'user' : 'admin' }, { rol: u.rol === 'admin' ? 'user' : 'admin' })}
                  >
                    {u.rol === 'admin' ? 'sacar admin' : 'hacer admin'}
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
