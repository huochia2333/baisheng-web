import type { PropsWithChildren } from 'react'
import type { Session } from '@supabase/supabase-js'
import { startTransition, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext'
import { hasSupabaseEnv } from '../lib/env'
import { supabase } from '../lib/supabase'

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(hasSupabaseEnv)

  const applySession = useEffectEvent((nextSession: Session | null) => {
    startTransition(() => {
      setSession(nextSession)
      setLoading(false)
    })
  })

  useEffect(() => {
    if (!hasSupabaseEnv) {
      return
    }

    let mounted = true

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          applySession(data.session)
        }
      })
      .catch(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        applySession(nextSession)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      isConfigured: hasSupabaseEnv,
      loading,
      session,
      signOut: async () => {
        if (hasSupabaseEnv) {
          await supabase.auth.signOut()
        }
      },
      user: session?.user ?? null,
    }),
    [loading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
