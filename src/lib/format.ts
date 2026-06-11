// Formato de números estilo es-AR (puntos como separador de miles), sin depender
// de ICU/toLocaleString para que sea idéntico en server y cliente.
export function formatNumero(n: number): string {
  const s = Math.round(Math.abs(n)).toString();
  return (n < 0 ? '-' : '') + s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export const TIPO_LABEL: Record<string, string> = {
  recital: 'Recital',
  homenaje: 'Homenaje',
  otro: 'Encuentro',
};
