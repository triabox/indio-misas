import type { Foto } from '@/lib/store';

export type TipoEvento = 'recital' | 'homenaje' | 'otro';

export interface Evento {
  slug: string;
  titulo: string;
  subtitulo: string;
  tipo: TipoEvento;
  fecha: string;
  anio: number;
  lugar: string;
  ciudad: string;
  almas: number;
  imagenObjetivo: string; // foto real (libre) que se reconstruye con las caras
  meta: number; // caras para revelar la imagen completa
  progreso: number; // 0..1 fracción ya revelada al cargar (gente histórica)
  panoramica: string;
  fotos: Foto[];
}

// --- PRNG determinista (mulberry32) para sembrar fotos de ejemplo ---
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMBRES = [
  'El Negro', 'Rulo', 'Pucho', 'Tincho', 'Cabeza', 'La Pepa', 'El Flaco', 'Sandra',
  'Mariano', 'Vasco', 'Colo', 'Gordo', 'Pato', 'Nacho', 'Brujo', 'Mecha', 'Lauti',
  'Piru', 'Tana', 'Beto', 'Chino', 'Coni', 'Fede', 'Ema', 'Pela', 'Lobo',
];

const SUFIJOS = [
  '', '', ' del Oeste', ' (Tandil)', ' 77', ' zona sur', ' La Plata', ' del fondo',
  ' bombista', ' ’95', ' de Berisso',
];

const HISTORIAS = [
  'Mi primer Indio. Tenía 16 y no paré de saltar.',
  'Fui con mi viejo. Hoy lo llevo en cada estribillo.',
  'Cruzamos el país en una Trafic, éramos nueve apretados.',
  'El fondo de bombos no se olvida más en la vida.',
  'Levanté la bandera de mi barrio bien alto toda la noche.',
  'Llovía a baldazos y a nadie le importó.',
  'Dejé la garganta entera en el “a-a-aaah”.',
  'Ahí entendí lo que es ser parte de algo más grande.',
  'Me lo perdí dos veces, a la tercera no falté.',
  'Abrazado a desconocidos como si fueran de toda la vida.',
  'Vendí de todo para juntar la plata del micro.',
  'Mi vieja no quería que vaya. Volví distinto.',
  'Diecisiete horas de cola y volvería a hacerlas.',
  'La primera vez que sentí el pogo más grande del mundo.',
  'Fui solo y me volví con mil hermanos.',
  'Todavía tengo la entrada pegada en la heladera.',
  'Esa noche el cielo era todo nuestro.',
  'Canté hasta quedarme sin voz tres días.',
  'Lo vi de lejos pero lo sentí acá adentro.',
  'Mis hijos nacieron sabiendo quién es el Indio.',
];

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function genFotos(slug: string, count: number, seed: number): Foto[] {
  const rnd = mulberry32(seed);
  const fotos: Foto[] = [];
  for (let i = 0; i < count; i++) {
    const id = `${slug}-${i}`;
    fotos.push({
      id,
      src: `https://picsum.photos/seed/${id}/200/200?grayscale`,
      alias: pick(rnd, NOMBRES) + pick(rnd, SUFIJOS),
      historia: pick(rnd, HISTORIAS),
      x: Math.round((6 + rnd() * 88) * 10) / 10,
      y: Math.round((14 + rnd() * 72) * 10) / 10,
    });
  }
  return fotos;
}

const WC = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

interface Semilla {
  slug: string;
  titulo: string;
  subtitulo: string;
  tipo: TipoEvento;
  fecha: string;
  anio: number;
  lugar: string;
  ciudad: string;
  almas: number;
  imagenObjetivo: string;
  meta: number;
  progreso: number;
  cant: number;
  seed: number;
}

// Recitales reales del Indio Solari (solista, con Los Fundamentalistas del Aire
// Acondicionado) + el homenaje tras su muerte en junio de 2026. Fechas y lugares
// reales; las cifras de convocatoria son aproximadas (las fuentes varían mucho).
// Las imágenes-objetivo son fotos libres de ejemplo (no las reales del recital).
const SEMILLAS: Semilla[] = [
  {
    slug: 'homenaje-2026', titulo: 'Velas por el Indio', subtitulo: 'El adiós ricotero · junio de 2026',
    tipo: 'homenaje', fecha: 'Junio 2026', anio: 2026, lugar: 'Plazas de todo el país', ciudad: 'Argentina',
    almas: 45000, meta: 1000, progreso: 0.34,
    imagenObjetivo: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Indio_solari.jpg',
    cant: 44, seed: 707,
  },
  {
    slug: 'olavarria-2017', titulo: 'Olavarría 2017', subtitulo: 'La última misa · 11 de marzo',
    tipo: 'recital', fecha: 'Marzo 2017', anio: 2017, lugar: 'Predio La Colmena', ciudad: 'Olavarría',
    almas: 300000, meta: 1800, progreso: 0.82,
    imagenObjetivo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Indio_Solari_2011.jpg/1280px-Indio_Solari_2011.jpg',
    cant: 60, seed: 101,
  },
  {
    slug: 'tandil-2016', titulo: 'Tandil 2016', subtitulo: 'El Hipódromo temblando · 12 de marzo',
    tipo: 'recital', fecha: 'Marzo 2016', anio: 2016, lugar: 'Hipódromo de Tandil', ciudad: 'Tandil',
    almas: 200000, meta: 1600, progreso: 0.68,
    imagenObjetivo: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Indio_solari_uruguay.jpg',
    cant: 56, seed: 202,
  },
  {
    slug: 'gualeguaychu-2014', titulo: 'Gualeguaychú 2014', subtitulo: 'Bajo la tormenta y el barro',
    tipo: 'recital', fecha: 'Abril 2014', anio: 2014, lugar: 'Hipódromo', ciudad: 'Gualeguaychú',
    almas: 170000, meta: 1500, progreso: 0.5,
    imagenObjetivo: 'https://upload.wikimedia.org/wikipedia/commons/d/db/Indiosolari-laplata-2005.JPG',
    cant: 50, seed: 303,
  },
  {
    slug: 'mendoza-2013', titulo: 'Mendoza 2013', subtitulo: 'Autódromo de San Martín · 14 de septiembre',
    tipo: 'recital', fecha: 'Septiembre 2013', anio: 2013, lugar: 'Autódromo Jorge Á. Pena', ciudad: 'San Martín, Mendoza',
    almas: 150000, meta: 1400, progreso: 0.6,
    imagenObjetivo: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Los_redondos_en_salta_1978.jpg',
    cant: 48, seed: 404,
  },
  {
    slug: 'tandil-2011', titulo: 'Tandil 2011', subtitulo: 'La gran misa en el Hipódromo · 3 de diciembre',
    tipo: 'recital', fecha: 'Diciembre 2011', anio: 2011, lugar: 'Hipódromo de Tandil', ciudad: 'Tandil',
    almas: 100000, meta: 1200, progreso: 0.42,
    imagenObjetivo: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Patricio_Rey_y_sus_Redonditos_de_Ricota_durante_una_actuaci%C3%B3n_en_los_a%C3%B1os_70.jpg',
    cant: 40, seed: 606,
  },
];

export const eventos: Evento[] = SEMILLAS.map((s) => ({
  slug: s.slug,
  titulo: s.titulo,
  subtitulo: s.subtitulo,
  tipo: s.tipo,
  fecha: s.fecha,
  anio: s.anio,
  lugar: s.lugar,
  ciudad: s.ciudad,
  almas: s.almas,
  imagenObjetivo: s.imagenObjetivo,
  meta: s.meta,
  progreso: s.progreso,
  panoramica: `https://picsum.photos/seed/${s.slug}-pano/1600/640?grayscale`,
  fotos: genFotos(s.slug, s.cant, s.seed),
}));

export function getEvento(slug: string): Evento | undefined {
  return eventos.find((e) => e.slug === slug);
}

export const almasGlobales = eventos.reduce((acc, e) => acc + e.almas, 0);
