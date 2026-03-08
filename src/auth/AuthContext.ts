import type { Session, User } from '@supabase/supabase-js'
import { createContext } from 'react'

export type AuthContextValue = {
  isConfigured: boolean
  loading: boolean
  session: Session | null
  signOut: () => Promise<void>
  user: User | null
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
