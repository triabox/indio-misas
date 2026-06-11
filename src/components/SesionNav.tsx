import { authClient } from '@/lib/auth-client';

interface Props {
  user: { alias?: string | null; name: string } | null;
}

export default function SesionNav({ user }: Props) {
  async function salir() {
    await authClient.signOut();
    window.location.href = '/';
  }

  if (!user) {
    return (
      <div className="nav-auth">
        <a href="/entrar">Entrar</a>
        <a href="/registro" className="nav-cta">Registrate</a>
      </div>
    );
  }

  return (
    <div className="nav-auth">
      <a href="/perfil" className="nav-user">{user.alias || user.name}</a>
      <button onClick={salir} className="nav-salir" aria-label="Salir">Salir</button>
    </div>
  );
}
