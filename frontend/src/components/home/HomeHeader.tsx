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
    <header className="mb-8 sm:mb-10">

      <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-neutral-500 mb-2 sm:mb-3">
        {getCurrentDate()}
      </p>

      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
        {getGreeting()}
      </h1>

      <p className="mt-2 sm:mt-3 text-sm sm:text-lg text-neutral-400">
        Bienvenido a tu biblioteca musical.
      </p>

      <div className="flex flex-wrap gap-5 sm:gap-8 mt-6 sm:mt-8">

        <div>
          <p className="text-2xl sm:text-3xl font-bold">
            {tracksCount}
          </p>

          <p className="text-xs sm:text-sm text-neutral-500">
            Canciones
          </p>
        </div>

        <div>
          <p className="text-2xl sm:text-3xl font-bold">
            {albumsCount}
          </p>

          <p className="text-xs sm:text-sm text-neutral-500">
            Álbumes
          </p>
        </div>

        <div>
          <p className="text-2xl sm:text-3xl font-bold">
            {artistsCount}
          </p>

          <p className="text-xs sm:text-sm text-neutral-500">
            Artistas
          </p>
        </div>

      </div>

    </header>
  );
}