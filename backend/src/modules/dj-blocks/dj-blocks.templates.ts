const GENRE_ERA_TEMPLATES = [
  'Ahora vamos con un bloque de {genre} de la vieja escuela, de eso que no puede faltar en la Jam.',
  'Se viene un bloque de {genre} clásico, para recordar viejos tiempos.',
  'Bajamos el ritmo un momento para traerles {genre} de antes, agárrense.',
];

const GENRE_TEMPLATES = [
  'Ahora sí, arranca un bloque de {genre} para todos ustedes.',
  'Se viene {genre} sin parar, prepárense.',
  'Cambiamos el rumbo: bloque completo de {genre}.',
];

const ERA_TEMPLATES = [
  'Nos vamos un momento al pasado con un bloque de música vieja.',
  'Bloque throwback, de esas canciones que no pasan de moda.',
];

const GENERIC_TEMPLATES = [
  'Aquí les traigo un bloque especial para esta Jam.',
  'Preparen los oídos, que viene un bloque nuevo.',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildIntroScript(params: { genre?: string; isOld?: boolean }): string {
  const { genre, isOld } = params;

  if (genre && isOld) return pick(GENRE_ERA_TEMPLATES).replace('{genre}', genre);
  if (genre) return pick(GENRE_TEMPLATES).replace('{genre}', genre);
  if (isOld) return pick(ERA_TEMPLATES);
  return pick(GENERIC_TEMPLATES);
}