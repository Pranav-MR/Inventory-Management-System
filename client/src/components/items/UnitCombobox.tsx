import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

const COMMON_UNITS = ['tablet', 'bottle', 'packet', 'kg', 'litre', 'box', 'piece'];

export function UnitCombobox({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = COMMON_UNITS.filter((u) => u.toLowerCase().includes(value.trim().toLowerCase()));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        required
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="tablet"
      />
      {open && filtered.length > 0 && (
        <div className="bg-popover text-popover-foreground absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border py-1 shadow-lg backdrop-blur-xl">
          {filtered.map((u) => (
            <button
              key={u}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(u);
                setOpen(false);
              }}
              className="hover:bg-accent hover:text-accent-foreground block w-full px-3 py-1.5 text-left text-sm transition-colors"
            >
              {u}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
