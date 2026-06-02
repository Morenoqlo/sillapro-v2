import { useEffect } from 'react';

/**
 * Attaches keyboard shortcuts to the document.
 * Only fires when no interactive element (input, textarea, select, [contenteditable])
 * has focus — prevents shortcuts from interfering with form typing.
 */
export function useGlobalShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const editable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || editable) return;

      const handler = handlers[e.key] ?? handlers[e.key.toLowerCase()];
      if (handler) {
        e.preventDefault();
        handler();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}
