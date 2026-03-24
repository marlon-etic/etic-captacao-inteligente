import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Home, FileText, Settings, Building } from 'lucide-react'
import { useLandlordAuth } from '@/hooks/useLandlordAuth'

export const LandlordHeader = () => {
  const { landlordProfile, logout } = useLandlordAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/landlord/login')
  }

  const navItems = [
    { name: 'Dashboard', path: '/landlord/dashboard', icon: Home },
    { name: 'Meus Imóveis', path: '/landlord/properties', icon: Building },
    { name: 'Propostas', path: '/landlord/proposals', icon: FileText },
    { name: 'Configurações', path: '/landlord/settings', icon: Settings },
  ]

  return (
    <header className="bg-[#1A3A52] text-white shadow-md z-40 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Building className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Portal do Proprietário</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium hidden sm:block">
              Olá, {landlordProfile?.name}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="bg-[#2E5F8A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
                    isActive
                      ? 'border-white text-white bg-white/5'
                      : 'border-transparent text-blue-100 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
