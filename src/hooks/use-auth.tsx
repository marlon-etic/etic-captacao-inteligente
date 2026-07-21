import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (mounted) {
        if (error) {
          console.error('[useAuth] Error getting session:', error.message)
        }
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (mounted) {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const ensureProfile = async () => {
      try {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!existing) {
          const metaRoleRaw = (user.user_metadata?.role as string) || 'captador'
          const validRoles = ['admin', 'sdr', 'corretor', 'captador', 'gestor']
          const metaRole = validRoles.includes(metaRoleRaw) ? metaRoleRaw : 'captador'
          await supabase.from('users').upsert({
            id: user.id,
            email: user.email || '',
            nome: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
            role: metaRole as any,
            status: 'ativo',
          })
        }
      } catch (e) {
        console.error('[useAuth] Error ensuring profile:', e)
      }
    }

    ensureProfile()
  }, [user])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const timeoutPromise = new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 15000),
      )
      const authPromise = supabase.auth.signInWithPassword({ email, password })
      const result = (await Promise.race([authPromise, timeoutPromise])) as any
      return { error: result.error }
    } catch (err: any) {
      if (err.message === 'TIMEOUT' || err.message?.includes('fetch')) {
        return { error: { message: 'Upstream Request Timeout', status: 504 } as any }
      }
      return { error: err }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
