import type { PropsWithChildren, ReactNode } from 'react'
import { ConfigBanner } from './ConfigBanner'

type AuthScaffoldProps = PropsWithChildren<{
  description: string
  footer?: ReactNode
  spotlightBody: string
  spotlightPoints: string[]
  spotlightTitle: string
  title: string
}>

export function AuthScaffold({
  children,
  description,
  footer,
  spotlightBody,
  spotlightPoints,
  spotlightTitle,
  title,
}: AuthScaffoldProps) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-5%] h-80 w-80 rounded-full bg-orange-400/15 blur-3xl" />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.95fr]">
        <section className="glass-panel relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="flex h-full flex-col justify-between gap-10">
            <div className="space-y-5">
              <span className="info-chip">柏盛管理系统</span>
              <div className="space-y-4">
                <h1 className="max-w-lg text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  {spotlightTitle}
                </h1>
                <p className="max-w-xl text-sm leading-7 text-slate-200/78 sm:text-base">
                  {spotlightBody}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {spotlightPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-3xl border border-white/10 bg-slate-950/20 px-4 py-4 text-sm leading-6 text-slate-100/80"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-panel px-6 py-8 sm:px-8 sm:py-10">
          <div className="space-y-6">
            <ConfigBanner />

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">
                业务员入口
              </p>
              <h2 className="text-3xl font-semibold text-white">{title}</h2>
              <p className="text-sm leading-7 text-slate-200/72">{description}</p>
            </div>

            <div className="space-y-4">{children}</div>

            {footer ? <div className="soft-divider pt-5 text-sm text-slate-200/75">{footer}</div> : null}
          </div>
        </section>
      </div>
    </div>
  )
}
