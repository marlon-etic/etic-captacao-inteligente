import { useMemo } from 'react'
import useAppStore from '@/stores/useAppStore'
import { PontuacaoTab } from '@/components/dashboard/PontuacaoTab'

export default function PontuacaoPage() {
  const { currentUser, demands, users } = useAppStore()
  const userDemands = useMemo(() => {
    return demands.filter(
      (d) =>
        d.assignedTo === currentUser?.id ||
        d.capturedProperties?.some((p) => p.captador_id === currentUser?.id),
    )
  }, [demands, currentUser])

  if (!currentUser) return null

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto animate-fade-in-up">
      <PontuacaoTab currentUser={currentUser} userDemands={userDemands} users={users} />
    </div>
  )
}
