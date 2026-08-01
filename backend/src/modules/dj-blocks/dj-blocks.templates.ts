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

const PERSONALIZED_TEMPLATES = [
  'Hola, arrancamos con un mix armado a tu medida, con lo que más te gusta escuchar.',
  '¡Qué tal! Aquí va un bloque pensado para ti, mezclando tus favoritas con algunas sorpresas.',
  'Bienvenido de nuevo, esto va a sonar bien: tu música, mezclada al estilo DJ.',
];

const PERSONALIZED_WITH_ARTIST_TEMPLATES = [
  'Hola, he notado que te encanta escuchar a {artist}, así que arrancamos con eso y seguimos mezclando a tu gusto.',
  '¡Qué tal! Veo que {artist} no puede faltar en tu playlist, empezamos con eso y armamos un bloque pensado en ti.',
  'Bienvenido de nuevo. Sé que te gusta mucho {artist}, así que preparamos esta mezcla pensando en ti.',
];

const PERSONALIZED_TRANSITION_TEMPLATES = [
  'Eso fue todo por ahora de {previousArtist}. Seguimos mezclando tu música, esta vez con más de {nextArtist}.',
  'Cerramos ese bloque con {previousArtist}. Ahora vamos con un poco de {nextArtist}, sigue sonando la Jam.',
  'Hasta aquí ese segmento. Continuamos con lo tuyo: más de {nextArtist} viene en camino.',
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


export function buildPersonalizedIntroScript(params: { topArtist?: string }): string {
  const { topArtist } = params;
  if (topArtist) return pick(PERSONALIZED_WITH_ARTIST_TEMPLATES).replace('{artist}', topArtist);
  return pick(PERSONALIZED_TEMPLATES);
}

export function buildPersonalizedTransitionScript(params: { previousArtist?: string; nextArtist?: string }): string {
  const { previousArtist, nextArtist } = params;
  if (previousArtist && nextArtist) {
    return pick(PERSONALIZED_TRANSITION_TEMPLATES)
      .replace('{previousArtist}', previousArtist)
      .replace('{nextArtist}', nextArtist);
  }
  return buildPersonalizedIntroScript({ topArtist: nextArtist });
}