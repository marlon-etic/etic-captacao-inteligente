import * as React from 'react'
const { useEffect, useState } = React
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'

export type NormalizedRole = 'admin' | 'sdr' | 'corretor' | 'captador' | 'gestor'

export interface UserRoleFlags {
  role: NormalizedRole | undefined
  loading: boolean
  isAdmin: boolean
  isGestor: boolean
  isCaptador: boolean
  isSDR: boolean
  isCorretor: boolean
}

function normalizeRole(raw: string | undefined | null): NormalizedRole {
  if (!raw) return 'captador'
  const lower = raw.toLowerCase().trim()
  if (lower === 'admin') return 'admin'
  if (lower === 'sdr') return 'sdr'
  if (lower === 'corretor' || lower === 'broker') return 'corretor'
  if (lower === 'captador') return 'captador'
  if (lower === 'gestor') return 'gestor'
  return 'captador'
}

function buildFlags(role: NormalizedRole | undefined): Omit<UserRoleFlags, 'loading'> {
  const r = role ?? 'captador'
  return {
    role,
    isAdmin: r === 'admin',
    isGestor: r === 'gestor' || r === 'admin',
    isCaptador: r === 'captador',
    isSDR: r === 'sdr',
    isCorretor: r === 'corretor',
  }
}

export function useUserRole(): UserRoleFlags {
  const { currentUser } = useAppStore()
  const [role, setRole] = useState<NormalizedRole | undefined>(
    currentUser?.role ? normalizeRole(currentUser.role) : undefined,
  )
  const [loading, setLoading] = useState(!currentUser)

  useEffect(() => {
    let isMounted = true

    const loadRoleFromDB = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user || !isMounted) {
          if (isMounted) {
            setRole(undefined)
            setLoading(false)
          }
          return
        }

        const { data: userRow, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (isMounted) {
          if (error || !userRow?.role) {
            const metaRole = user.user_metadata?.role || user.app_metadata?.role || 'captador'
            setRole(normalizeRole(metaRole))
          } else {
            setRole(normalizeRole(userRow.role))
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('[USER ROLE] Erro ao carregar role:', error)
        if (isMounted) {
          setRole('captador')
          setLoading(false)
        }
      }
    }

    if (currentUser?.role) {
      setRole(normalizeRole(currentUser.role))
      setLoading(false)
      return
    }

    loadRoleFromDB()

    return () => {
      isMounted = false
    }
  }, [currentUser])

  return { ...buildFlags(role), loading }
}
