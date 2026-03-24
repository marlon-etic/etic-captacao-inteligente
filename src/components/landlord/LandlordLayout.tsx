import { Outlet } from 'react-router-dom'
import { LandlordHeader } from '@/components/landlord/LandlordHeader'

export const LandlordLayout = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <LandlordHeader />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
