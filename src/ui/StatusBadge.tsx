import { cn } from '@/lib/cn';

type Tone = 'active' | 'inactive' | 'blocked';

const TONE_CLASSES: Record<Tone, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  blocked: 'bg-red-100 text-red-700',
};

interface StatusBadgeProps {
  tone: Tone;
  children: string;
}

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={cn('inline-flex rounded px-2 py-0.5 text-xs font-medium', TONE_CLASSES[tone])}
    >
      {children}
    </span>
  );
}
