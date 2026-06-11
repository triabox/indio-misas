import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

interface Props {
  modo: 'registro' | 'entrar';
  googleOn: boolean;
  next?: string;
}

function traducir(m?: string): string {
  if (!m) return 'Algo salió mal, probá de nuevo.';
  if (/exist|already|taken/i.test(m)) return 'Ese email ya está registrado. Probá entrar.';
  if (/invalid|credential|password|incorrect/i.test(m)) return 'Email o contraseña incorrectos.';
  return m;
}

export default function AuthForm({ modo, googleOn, next = '/' }: Props) {
  const esRegistro = modo === 'registro';
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = esRegistro
        ? await authClient.signUp.email({
            email,
            password: pass,
            name: nombre.trim() || email.split('@')[0],
          })
        : await authClient.signIn.email({ email, password: pass });
      if ((res as any).error) throw new Error((res as any).error.message);
      window.location.href = next;
    } catch (err) {
      setError(traducir((err as Error).message));
    } finally {
      setCargando(false);
    }
  }

  async function conGoogle() {
    setError('');
    try {
      await authClient.signIn.social({ provider: 'google', callbackURL: next });
    } catch {
      setError('No se pudo entrar con Google.');
    }
  }

  return (
    <form onSubmit={submit} className="auth-form">
      {esRegistro && (
        <input
          className="subir-input"
          placeholder="Tu nombre o apodo"
          value={nombre}
          maxLength={40}
          onChange={(e) => setNombre(e.target.value)}
        />
      )}
      <input
        className="subir-input"
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="subir-input"
        type="password"
        required
        minLength={8}
        placeholder="Contraseña (mín. 8)"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />
      {error && <p className="auth-error">{error}</p>}
      <button className="subir-cta" disabled={cargando}>
        {cargando ? '...' : esRegistro ? 'Crear mi cuenta' : 'Entrar'}
      </button>
      {googleOn && (
        <button type="button" className="subir-google" onClick={conGoogle}>
          <span className="subir-g">G</span> {esRegistro ? 'Registrarme' : 'Entrar'} con Google
        </button>
      )}
      <p className="auth-alt">
        {esRegistro ? (
          <>
            ¿Ya tenés cuenta? <a href="/entrar">Entrá</a>
          </>
        ) : (
          <>
            ¿Sos nuevo? <a href="/registro">Registrate</a>
          </>
        )}
      </p>
    </form>
  );
}
