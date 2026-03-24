import { useEffect, useState, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { LandlordProfile } from '@/types/landlord'

export const useLandlordAuth = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [landlordProfile, setLandlordProfile] = useState<LandlordProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(true)

  const retryCountRef = useRef(0)
  const maxRetries = 3

  useEffect(() => {
    let mounted = true
    checkConnection()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session)
        if (session) {
          fetchLandlordProfile(session.user.id)
        } else {
          setLoading(false)
        }
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event)
      if (mounted) {
        setSession(session)
        if (session) {
          fetchLandlordProfile(session.user.id)
        } else {
          setLandlordProfile(null)
          setLoading(false)
        }
      }
    })

    const connectionCheckInterval = setInterval(() => {
      checkConnection()
    }, 30000)

    return () => {
      mounted = false
      subscription?.unsubscribe()
      clearInterval(connectionCheckInterval)
    }
  }, [])

  const checkConnection = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .limit(1)

      if (error) throw error

      setIsConnected(true)
      retryCountRef.current = 0
    } catch (err) {
      console.error('Erro ao verificar conexão:', err)
      setIsConnected(false)
    }
  }

  const fetchLandlordProfile = async (userId: string, retryCount = 0) => {
    try {
      setLoading(true)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const { data, error } = await supabase
        .from('landlord_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      clearTimeout(timeoutId)

      if (error) throw error

      setLandlordProfile(data)
      setError(null)
      setIsConnected(true)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar perfil'
      console.error('Erro ao buscar perfil:', errorMsg)
      setError(errorMsg)
      setIsConnected(false)

      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
        console.log(`Retentando fetch de perfil em ${delay}ms`)

        setTimeout(() => {
          fetchLandlordProfile(userId, retryCount + 1)
        }, delay)
      } else {
        setLandlordProfile(null)
      }
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
    isConnected,
    login,
    signup,
    logout,
  }
}
