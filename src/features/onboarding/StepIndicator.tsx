import { cn } from '@/lib/cn';

interface StepIndicatorProps {
  current: number;
  total: number;
  labels: string[];
}

export function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isCurrent = step === current;
        return (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                  isDone && 'bg-brand text-white',
                  isCurrent && 'bg-brand text-white ring-4 ring-brand/20',
                  !isDone && !isCurrent && 'bg-gray-200 text-gray-600',
                )}
              >
                {isDone ? '✓' : step}
              </div>
              <span className="mt-1 text-xs text-gray-600">{labels[i]}</span>
            </div>
            {step < total && (
              <div
                className={cn('mx-2 h-px flex-1', isDone ? 'bg-brand' : 'bg-gray-200')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
