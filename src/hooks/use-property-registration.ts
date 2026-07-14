import { useState, useCallback } from 'react'
import {
  registerProperty,
  fetchMyProperties,
  type PropertyRegistrationData,
} from '@/services/propertyService'
import type { Database } from '@/lib/supabase/types'

type ImovelRow = Database['public']['Tables']['imoveis_captados']['Row']

export function usePropertyRegistration() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdProperty, setCreatedProperty] = useState<ImovelRow | null>(null)

  const submit = useCallback(async (data: PropertyRegistrationData) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    setCreatedProperty(null)

    const { data: result, error: err } = await registerProperty(data)

    if (err) {
      setError(err)
      setLoading(false)
      return { success: false, error: err }
    }

    setSuccess(true)
    setCreatedProperty(result)
    setLoading(false)
    return { success: true, error: null, data: result }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setSuccess(false)
    setCreatedProperty(null)
    setLoading(false)
  }, [])

  return { loading, error, success, createdProperty, submit, reset }
}

export function useMyProperties() {
  const [properties, setProperties] = useState<ImovelRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await fetchMyProperties()
    if (err) {
      setError(err)
    } else {
      setProperties(data ?? [])
    }
    setLoading(false)
  }, [])

  return { properties, loading, error, load, setProperties }
}
