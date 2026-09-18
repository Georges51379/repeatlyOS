import type { ReactNode } from 'react';

interface Props {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helper?: string;
  children: ReactNode;
}

/** A label that stays visible above the field instead of vanishing into a
 * placeholder the moment someone starts typing — placeholder-as-label was
 * the single biggest reason the dashboard forms read as confusing: once you
 * typed anything, there was nothing left on screen saying what the field
 * was. Every field below still keeps its own placeholder for an example
 * value; this just adds the label (and optional helper text) that stays. */
export default function FormField({ label, htmlFor, required, helper, children }: Props) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {helper && <p className="text-xs text-slate-600 mt-1">{helper}</p>}
    </div>
  );
}

/** Shared input/textarea/select classes so every field in a form looks and
 * behaves identically — one string to tweak instead of finding-and-editing
 * every field individually. */
export const fieldInputClass =
  'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors';
