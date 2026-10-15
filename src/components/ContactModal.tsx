import { useRef } from 'react';
import { X } from 'lucide-react';
import { ContactForm } from './ContactForm';
import { useDialogFocus } from './useDialogFocus';
import { useLanguage } from '../i18n/LanguageContext';

export function ContactModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { locale } = useLanguage();
  const dialog = useRef<HTMLDivElement>(null);
  useDialogFocus(isOpen, dialog, onClose);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="contact-title" tabIndex={-1} className="relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4"><h2 id="contact-title" className="text-xl font-semibold text-white">{locale === 'zh' ? '联系工程团队' : 'Contact engineering'}</h2><button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800" aria-label={locale === 'zh' ? '关闭' : 'Close'}><X className="h-5 w-5" /></button></div>
        <ContactForm />
      </div>
    </div>
  );
}
