import type { InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string | null
  label: string
  note?: string
}

export function TextField({ error, label, note, className = '', ...props }: TextFieldProps) {
  return (
    <label className="block">
      <span className="glass-label">{label}</span>
      <input className={['glass-input', className].join(' ').trim()} {...props} />
      {note ? <span className="mt-2 block text-xs text-slate-300/60">{note}</span> : null}
      {error ? <span className="mt-2 block text-xs text-rose-200">{error}</span> : null}
    </label>
  )
}
