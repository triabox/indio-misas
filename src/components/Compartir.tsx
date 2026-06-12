import { useState } from 'react';

interface Props {
  url: string;
  titulo: string;
  almas: number;
  imagen?: string;
  lugar?: string;
  ciudad?: string;
  fecha?: string;
  variante?: 'evento' | 'archivo';
}

function fmt(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function slugificar(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40) || 'misa'
  );
}

export default function Compartir({ url, titulo, almas, imagen, lugar, ciudad, fecha, variante = 'evento' }: Props) {
  const [copiado, setCopiado] = useState(false);
  const [generando, setGenerando] = useState(false);

  const texto =
    variante === 'archivo'
      ? `MISAS — el archivo de los que fueron a ver al Indio. Ya somos ${fmt(almas)} almas. Sumate 🤘`
      : `Fui a ${titulo}. Somos ${fmt(almas)} almas en el archivo del Indio. Sumá la tuya 🤘`;

  const enc = encodeURIComponent;
  const redes = [
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${enc(`${texto} ${url}`)}` },
    { id: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(texto)}&url=${enc(url)}` },
    { id: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { id: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${enc(url)}&text=${enc(texto)}` },
  ];

  async function copiar() {
    try {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sin clipboard: no pasa nada */
    }
  }

  async function compartirNativo() {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: `MISAS · ${titulo}`, text: texto, url });
      } catch {
        /* el usuario canceló */
      }
    } else {
      copiar();
    }
  }

  async function imagenHistoria() {
    setGenerando(true);
    try {
      const blob = await generarHistoria({ titulo, almas, imagen, lugar, ciudad, fecha, variante });
      const file = new File([blob], `misas-${slugificar(titulo)}.png`, { type: 'image/png' });
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
        share?: (d: ShareData) => Promise<void>;
      };
      // En el celu intentamos compartir el archivo directo (→ historia de IG/WA).
      if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: `MISAS · ${titulo}` });
        } catch {
          descargar(blob, file.name);
        }
      } else {
        descargar(blob, file.name);
      }
    } catch (e) {
      console.error('[historia]', e);
      alert('No pude generar la imagen. Probá de nuevo.');
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="compartir">
      <button className="share-nativo" onClick={compartirNativo}>
        ↗ Compartir
      </button>
      <div className="share-row">
        {redes.map((r) => (
          <a key={r.id} className={`share-btn share-${r.id}`} href={r.href} target="_blank" rel="noopener noreferrer">
            {r.label}
          </a>
        ))}
        <button className="share-btn share-copiar" onClick={copiar}>
          {copiado ? '¡copiado!' : 'Copiar link'}
        </button>
      </div>
      <button className="share-historia" onClick={imagenHistoria} disabled={generando}>
        {generando ? 'Generando…' : '📸 Imagen para tu historia'}
      </button>
    </div>
  );
}

function descargar(blob: Blob, nombre: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// Dibuja la foto "cover" (recortada al rectángulo destino, sin deformar).
function dibujarCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const escala = Math.max(dw / img.naturalWidth, dh / img.naturalHeight);
  const w = img.naturalWidth * escala;
  const h = img.naturalHeight * escala;
  ctx.save();
  ctx.beginPath();
  ctx.rect(dx, dy, dw, dh);
  ctx.clip();
  ctx.drawImage(img, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h);
  ctx.restore();
}

function envolver(ctx: CanvasRenderingContext2D, texto: string, maxW: number, maxLineas: number): string[] {
  const palabras = texto.split(' ');
  const lineas: string[] = [];
  let actual = '';
  for (const p of palabras) {
    const tentativa = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(tentativa).width > maxW && actual) {
      lineas.push(actual);
      actual = p;
    } else {
      actual = tentativa;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.slice(0, maxLineas);
}

interface DatosHistoria {
  titulo: string;
  almas: number;
  imagen?: string;
  lugar?: string;
  ciudad?: string;
  fecha?: string;
  variante: 'evento' | 'archivo';
}

async function generarHistoria(d: DatosHistoria): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const FOTO_H = 1100;

  // Precargamos la foto (puede fallar por CORS → seguimos sin ella).
  let img: HTMLImageElement | null = null;
  if (d.imagen) {
    try {
      img = await cargarImagen(d.imagen);
    } catch {
      img = null;
    }
  }
  // Esperamos a que las tipografías estén listas para el canvas.
  try {
    await (document as Document & { fonts: FontFaceSet }).fonts.ready;
  } catch {
    /* navegadores viejos */
  }

  const pintar = (conFoto: boolean): Promise<Blob | null> => {
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d');
    if (!ctx) return Promise.resolve(null);

    // Fondo carbón.
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    if (conFoto && img) {
      dibujarCover(ctx, img, 0, 0, W, FOTO_H);
      // Gradiente que hunde la foto en el negro.
      const g = ctx.createLinearGradient(0, 0, 0, FOTO_H);
      g.addColorStop(0, 'rgba(10,10,10,0.55)');
      g.addColorStop(0.35, 'rgba(10,10,10,0.05)');
      g.addColorStop(0.82, 'rgba(10,10,10,0.5)');
      g.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, FOTO_H);
    } else {
      ctx.fillStyle = '#14110f';
      ctx.fillRect(0, 0, W, FOTO_H);
    }

    ctx.textAlign = 'center';

    // Marca arriba + subrayado rojo.
    ctx.fillStyle = '#c1121f';
    ctx.font = "700 54px 'Oswald', Arial, sans-serif";
    ctx.fillText('M I S A S', W / 2, 118);
    ctx.fillRect(W / 2 - 70, 140, 140, 5);

    // Kicker.
    ctx.fillStyle = '#e7c95c';
    ctx.font = "600 34px 'Oswald', Arial, sans-serif";
    ctx.fillText(
      d.variante === 'archivo' ? '· EL ARCHIVO DE LOS QUE ESTUVIERON ·' : '· FUI A ESTA MISA ·',
      W / 2,
      1190,
    );

    // Título (Anton, hasta 2 líneas).
    ctx.fillStyle = '#e8e2d0';
    ctx.font = "400 92px 'Anton', Impact, sans-serif";
    const lineas = envolver(ctx, d.titulo.toUpperCase(), W - 130, 2);
    if (lineas.length === 1) {
      ctx.fillText(lineas[0], W / 2, 1360);
    } else {
      ctx.fillText(lineas[0], W / 2, 1306);
      ctx.fillText(lineas[1], W / 2, 1400);
    }

    // Lugar · ciudad · fecha.
    const meta = [d.lugar, d.ciudad, d.fecha].filter(Boolean).join(' · ');
    if (meta) {
      ctx.fillStyle = 'rgba(232,226,208,0.72)';
      ctx.font = "500 32px 'Oswald', Arial, sans-serif";
      ctx.fillText(meta, W / 2, 1470);
    }

    // Número de almas, enorme.
    ctx.fillStyle = '#c1121f';
    ctx.font = "400 230px 'Anton', Impact, sans-serif";
    ctx.fillText(fmt(d.almas), W / 2, 1700);
    ctx.fillStyle = '#e8e2d0';
    ctx.font = "600 44px 'Oswald', Arial, sans-serif";
    ctx.fillText(d.variante === 'archivo' ? 'ALMAS EN EL MOSAICO' : 'ALMAS QUE ESTUVIERON', W / 2, 1772);

    // Pie.
    ctx.fillStyle = 'rgba(232,226,208,0.55)';
    ctx.font = "600 30px 'Oswald', Arial, sans-serif";
    ctx.fillText('NADIE SE VA DEL TODO', W / 2, 1852);
    ctx.fillStyle = 'rgba(232,226,208,0.32)';
    ctx.font = "400 26px 'Oswald', Arial, sans-serif";
    ctx.fillText('sumá tu alma en MISAS', W / 2, 1896);

    return new Promise((res) => cv.toBlob((b) => res(b), 'image/png'));
  };

  // Si el canvas quedó "tainted" por CORS, toBlob devuelve null → reintentamos sin foto.
  let blob = await pintar(true);
  if (!blob) blob = await pintar(false);
  if (!blob) throw new Error('No se pudo exportar el canvas.');
  return blob;
}
