import React, { useState, useContext } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Inbox,
  CheckCircle2,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Tags,
} from 'lucide-react'

interface SidebarLink {
  name: string
  icon: React.ReactNode
  key: string
  to: string
  section?: 'staff' | 'admin'
}

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { logout, user } = useContext(AuthContext)
  const navigate = useNavigate()
  const isAdmin = user?.idRole === 2

  const staffLinks: SidebarLink[] = [
    { name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, key: 'dashboard', to: '/' },
    { name: 'Productos', icon: <Package className="w-5 h-5" />, key: 'productos', to: '/productos' },
    { name: 'Hacer venta', icon: <ShoppingCart className="w-5 h-5" />, key: 'crear-venta', to: '/ventas/crear', section: 'staff' },
    { name: 'Historial ventas', icon: <FileText className="w-5 h-5" />, key: 'ventas', to: '/ventas' },
    { name: 'Entradas', icon: <Inbox className="w-5 h-5" />, key: 'entradas', to: '/entradas' },
    { name: 'Salidas', icon: <CheckCircle2 className="w-5 h-5" />, key: 'salidas', to: '/salidas' },
  ]

  const adminLinks: SidebarLink[] = [
    { name: 'Gestionar personal', icon: <Users className="w-5 h-5" />, key: 'personal', to: '/staff/create', section: 'admin' },
    { name: 'Usuarios', icon: <Users className="w-5 h-5" />, key: 'usuarios', to: '/usuarios', section: 'admin' },
    { name: 'Tipos de Productos', icon: <Settings className="w-5 h-5" />, key: 'tipos-productos', to: '/tipos-productos', section: 'admin' },
    { name: 'Laboratorios', icon: <Settings className="w-5 h-5" />, key: 'laboratorios', to: '/laboratorios', section: 'admin' },
    { name: 'Marcas', icon: <Tags className="w-5 h-5" />, key: 'marcas', to: '/marcas', section: 'admin' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleLinks = [
    ...staffLinks,
    ...(isAdmin ? adminLinks : []),
  ]

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar/90 backdrop-blur-sm border-r border-sidebar-border p-4 flex flex-col transition-all duration-300 shadow-[0_4px_16px_-4px_rgba(46,73,153,0.25)]',
        isCollapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        {!isCollapsed && (
          <h2 className="text-2xl font-extrabold text-sidebar-primary">Bioclinics</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hover:bg-sidebar-primary/20"
        >
          {isCollapsed ? (
            <ChevronRight className="w-6 h-6 text-sidebar-primary" />
          ) : (
            <ChevronLeft className="w-6 h-6 text-sidebar-primary" />
          )}
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="space-y-2 flex-1">
        {/* STAFF Section */}
        <div>
          {!isCollapsed && (
            <p className="text-xs font-semibold text-sidebar-foreground/60 px-4 py-2 uppercase tracking-wide">
              Operaciones
            </p>
          )}
          {visibleLinks
            .filter(link => !link.section || link.section === 'staff')
            .map(link => (
              <NavLink
                key={link.key}
                to={link.to}
                end={link.to === '/ventas'}
                className={({ isActive }) =>
                  cn(
                    'group relative w-full flex items-center px-3 py-3 rounded-xl text-sm font-medium overflow-hidden transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-r from-primary/90 to-secondary/80 text-white shadow-lg ring-2 ring-primary/40'
                      : 'text-sidebar-foreground hover:text-primary'
                  )
                }
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-primary/15 to-secondary/15 transition-opacity duration-300" />
                <span className="absolute left-0 top-0 h-full w-1 rounded-r bg-primary/70 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                <div className="flex items-center justify-center w-9 h-9 rounded-md bg-white/40 group-hover:bg-white/60 backdrop-blur-sm text-primary shadow-inner transition-colors">
                  {link.icon}
                </div>
                {!isCollapsed && <span className="ml-3 z-10">{link.name}</span>}
              </NavLink>
            ))}
        </div>

        {/* ADMIN Section */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-sidebar-border">
            {!isCollapsed && (
              <p className="text-xs font-semibold text-sidebar-foreground/60 px-4 py-2 uppercase tracking-wide">
                Administración
              </p>
            )}
            {visibleLinks
              .filter(link => link.section === 'admin')
              .map(link => (
                <NavLink
                  key={link.key}
                  to={link.to}
                  end={link.to === '/ventas'}
                  className={({ isActive }) =>
                    cn(
                      'group relative w-full flex items-center px-3 py-3 rounded-xl text-sm font-medium overflow-hidden transition-all duration-300',
                      isActive
                        ? 'bg-gradient-to-r from-secondary/90 to-primary/80 text-white shadow-lg ring-2 ring-secondary/40'
                        : 'text-sidebar-foreground hover:text-secondary'
                    )
                  }
                >
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-secondary/15 to-primary/15 transition-opacity duration-300" />
                  <span className="absolute left-0 top-0 h-full w-1 rounded-r bg-secondary/70 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                  <div className="flex items-center justify-center w-9 h-9 rounded-md bg-white/40 group-hover:bg-white/60 backdrop-blur-sm text-secondary shadow-inner transition-colors">
                    {link.icon}
                  </div>
                  {!isCollapsed && <span className="ml-3 z-10">{link.name}</span>}
                </NavLink>
              ))}
          </div>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="mt-auto pt-4 border-t border-sidebar-border space-y-3">
        {!isCollapsed && (
          <div className="px-3 py-2 rounded-lg bg-sidebar-primary/10">
            <p className="text-sm font-semibold text-sidebar-primary">{user?.username || 'Usuario'}</p>
            <p className="text-xs text-sidebar-foreground/70">{isAdmin ? 'Administrador' : 'Personal'}</p>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="outline"
          size={isCollapsed ? 'icon' : 'default'}
          className="w-full border-red-300 text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="ml-2">Cerrar sesión</span>}
        </Button>
      </div>
    </aside>
  )
}

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 bg-background text-foreground overflow-auto animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
