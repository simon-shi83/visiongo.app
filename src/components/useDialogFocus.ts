import { useEffect, type RefObject } from 'react';

export function useDialogFocus(open: boolean, ref: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open || !ref.current) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const container = ref.current;
    const elements = () => Array.from(container.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]')).filter(element => element.getClientRects().length > 0 && !element.matches(':disabled') && !element.closest('[aria-hidden="true"]'));
    document.body.style.overflow = 'hidden';
    (elements()[0] || container).focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key !== 'Tab') return;
      const list = elements();
      if (!list.length) { event.preventDefault(); container.focus(); return; }
      if (event.shiftKey && (document.activeElement === list[0] || document.activeElement === container)) { event.preventDefault(); list[list.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === list[list.length - 1]) { event.preventDefault(); list[0].focus(); }
    };
    container.addEventListener('keydown', keyboard);
    return () => { container.removeEventListener('keydown', keyboard); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open, ref, close]);
}
