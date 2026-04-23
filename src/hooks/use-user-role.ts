import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'

export function useUserRole() {
  const { currentUser } = useAppStore()
  const [role, setRole] = useState<string | undefined>(currentUser?.role)
  const [loading, setLoading] = useState(!currentUser)

  useEffect(() => {
    if (currentUser?.role) {
      setRole(currentUser.role)
      setLoading(false)
      return
    }

    let isMounted = true
    const loadUserRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user && isMounted) {
          const userRole = user.user_metadata?.role || user.app_metadata?.role || 'captador'
          setRole(userRole)
        }
      } catch (error) {
        console.error('[USER ROLE] Erro ao carregar role:', error)
        if (isMounted) setRole('captador')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadUserRole()

    return () => {
      isMounted = false
    }
  }, [currentUser])

  return { role, loading }
}
