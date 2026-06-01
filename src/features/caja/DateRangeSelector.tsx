import { cn } from '@/lib/cn';
import { todayBusinessDate } from '@/lib/dates';

export type RangePreset = 'today' | 'week' | 'custom';

interface DateRangeSelectorProps {
  preset: RangePreset;
  customStart: string;
  customEnd: string;
  onPresetChange: (p: RangePreset) => void;
  onCustomChange: (start: string, end: string) => void;
}

function presetBtn(
  current: RangePreset,
  value: RangePreset,
  label: string,
  onClick: () => void,
) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        current === value
          ? 'bg-brand text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      )}
    >
      {label}
    </button>
  );
}

export function DateRangeSelector({
  preset,
  customStart,
  customEnd,
  onPresetChange,
  onCustomChange,
}: DateRangeSelectorProps) {
  const today = todayBusinessDate();

  function handlePreset(p: RangePreset) {
    onPresetChange(p);
    if (p === 'today') {
      onCustomChange(today, today);
    } else if (p === 'week') {
      const d = new Date(`${today}T12:00:00Z`);
      const day = d.getUTCDay();
      const offset = day === 0 ? -6 : 1 - day;
      d.setUTCDate(d.getUTCDate() + offset);
      const mon = d.toISOString().slice(0, 10);
      onCustomChange(mon, today);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presetBtn(preset, 'today', 'Hoy', () => handlePreset('today'))}
      {presetBtn(preset, 'week', 'Esta semana', () => handlePreset('week'))}
      {presetBtn(preset, 'custom', 'Personalizado', () => onPresetChange('custom'))}
      {preset === 'custom' && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={customStart}
            max={customEnd}
            onChange={(e) => onCustomChange(e.target.value, customEnd)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          <span className="text-xs text-gray-500">a</span>
          <input
            type="date"
            value={customEnd}
            min={customStart}
            max={today}
            onChange={(e) => onCustomChange(customStart, e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
      )}
    </div>
  );
}
