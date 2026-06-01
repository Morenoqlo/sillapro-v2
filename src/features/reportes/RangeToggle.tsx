import { cn } from '@/lib/cn';
import { RANGE_LABELS, type RangePreset } from './types';

interface RangeToggleProps {
  value: RangePreset;
  onChange: (v: RangePreset) => void;
}

const PRESETS: RangePreset[] = ['week', 'month', 'last30'];

export function RangeToggle({ value, onChange }: RangeToggleProps) {
  return (
    <div className="flex gap-1">
      {PRESETS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === p
              ? 'bg-brand text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          )}
        >
          {RANGE_LABELS[p]}
        </button>
      ))}
    </div>
  );
}
