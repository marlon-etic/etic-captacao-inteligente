import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { LandlordProfile } from '@/types/landlord'

export const useLandlordAuth = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [landlordProfile, setLandlordProfile] = useState<LandlordProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session)
        if (session) fetchLandlordProfile(session.user.id)
        else setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session)
        if (session) fetchLandlordProfile(session.user.id)
        else {
          setLandlordProfile(null)
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchLandlordProfile = async (userId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('landlord_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        throw error
      }

      setLandlordProfile(data)
      setError(null)
    } catch (err) {
      console.warn('Failed to load landlord profile:', err)
      setLandlordProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signup = async (email: string, password: string, meta: { name: string; phone: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'landlord',
          name: meta.name,
        },
      },
    })

    if (data.user && !error) {
      await supabase.from('landlord_profiles').insert({
        user_id: data.user.id,
        name: meta.name,
        email: email,
        phone: meta.phone,
        codigo_locador: `LOC-${Math.floor(Math.random() * 10000)}`,
      })
    }

    return { data, error }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desconectar')
    }
  }

  return {
    session,
    landlordProfile,
    loading,
    error,
    login,
    signup,
    logout,
  }
}
