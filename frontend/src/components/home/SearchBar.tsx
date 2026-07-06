import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar canciones, artistas o álbumes...',
}: SearchBarProps) {
  return (
    <div className="mb-6">
      <div
        className="
          group
          flex
          items-center
          gap-3

          rounded-xl

          border
          border-neutral-800

          bg-neutral-900

          px-4
          py-3

          transition-all
          duration-200

          focus-within:border-green-500
          focus-within:ring-2
          focus-within:ring-green-500/20
        "
      >
        <Search
          size={20}
          className="text-neutral-400 group-focus-within:text-green-500 transition"
        />

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="
            flex-1
            bg-transparent
            outline-none
            text-sm
            placeholder:text-neutral-500
          "
        />

        {value.length > 0 && (
          <button
            onClick={() => onChange('')}
            className="
              rounded-md
              p-1

              hover:bg-neutral-800
              transition
            "
          >
            <X
              size={16}
              className="text-neutral-400"
            />
          </button>
        )}

        <div
          className="
            hidden
            md:flex

            items-center
            gap-1

            rounded-md

            border
            border-neutral-700

            bg-neutral-950

            px-2
            py-1

            text-[11px]
            text-neutral-500
          "
        >
          <kbd>Ctrl</kbd>

          <span>+</span>

          <kbd>K</kbd>
        </div>
      </div>
    </div>
  );
}