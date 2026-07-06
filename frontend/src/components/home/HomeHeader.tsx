interface HomeHeaderProps {
  tracksCount: number;
  albumsCount: number;
  artistsCount: number;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';

  return 'Buenas noches';
}

function getCurrentDate() {
  return new Intl.DateTimeFormat('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}

export default function HomeHeader({
  tracksCount,
  albumsCount,
  artistsCount,
}: HomeHeaderProps) {
  return (
    <header className="mb-10">

      <p className="text-sm uppercase tracking-[0.3em] text-neutral-500 mb-3">
        {getCurrentDate()}
      </p>

      <h1 className="text-5xl font-bold tracking-tight">
        {getGreeting()}
      </h1>

      <p className="mt-3 text-neutral-400 text-lg">
        Bienvenido a tu biblioteca musical.
      </p>

      <div className="flex flex-wrap gap-8 mt-8">

        <div>
          <p className="text-3xl font-bold">
            {tracksCount}
          </p>

          <p className="text-sm text-neutral-500">
            Canciones
          </p>
        </div>

        <div>
          <p className="text-3xl font-bold">
            {albumsCount}
          </p>

          <p className="text-sm text-neutral-500">
            Álbumes
          </p>
        </div>

        <div>
          <p className="text-3xl font-bold">
            {artistsCount}
          </p>

          <p className="text-sm text-neutral-500">
            Artistas
          </p>
        </div>

      </div>

    </header>
  );
}