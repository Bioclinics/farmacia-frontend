import React, { useContext } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { RolesEnum } from '../../constants/roles'

const Sidebar: React.FC = () => {
  const { logout, user } = useContext(AuthContext)
  const isAdmin = user?.idRole === RolesEnum.ADMIN
  const navigate = useNavigate()
  return (
    <aside className={`w-64 border-r border-gray-200 min-h-screen p-4 ${isAdmin ? 'bg-gradient-to-b from-sky-100 to-white' : 'bg-gradient-to-b from-sky-50 to-white'}`}>
      <div className="mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isAdmin ? 'text-sky-900' : 'text-sky-700'}`}>Bioclinics</h1>
          <p className="text-sm text-gray-600">Farmacia - Panel</p>
        </div>
      </div>

      <nav className="space-y-1">
        <NavLink to="/" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? (isAdmin ? 'bg-sky-800 text-white' : 'bg-sky-600 text-white') : 'text-gray-700 hover:bg-sky-100'}`}>Dashboard</NavLink>
        <NavLink to="/productos" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? (isAdmin ? 'bg-sky-800 text-white' : 'bg-sky-600 text-white') : 'text-gray-700 hover:bg-sky-100'}`}>Productos</NavLink>
        {/* Ventas: mostrar 'Hacer venta' para STAFF o ADMIN; mostrar historial para todos */}
        {(user?.idRole === RolesEnum.STAFF || user?.idRole === RolesEnum.ADMIN) && (
          <NavLink to="/ventas/crear" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-sky-600 text-white' : 'text-gray-700 hover:bg-sky-100'}`}>Hacer venta</NavLink>
        )}
        <NavLink to="/ventas" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? (isAdmin ? 'bg-sky-800 text-white' : 'bg-sky-600 text-white') : 'text-gray-700 hover:bg-sky-100'}`}>Historial ventas</NavLink>
        <NavLink to="/entradas" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? (isAdmin ? 'bg-sky-800 text-white' : 'bg-sky-600 text-white') : 'text-gray-700 hover:bg-sky-100'}`}>Entradas</NavLink>
        <NavLink to="/salidas" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? (isAdmin ? 'bg-sky-800 text-white' : 'bg-sky-600 text-white') : 'text-gray-700 hover:bg-sky-100'}`}>Salidas</NavLink>
        {isAdmin && (
          <>
            <NavLink to="/staff/create" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-sky-800 text-white' : 'text-gray-700 hover:bg-sky-100'}`}>Gestionar personal</NavLink>
            <NavLink to="/usuarios" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-sky-800 text-white' : 'text-gray-700 hover:bg-sky-100'}`}>Usuarios</NavLink>
            <NavLink to="/tipos-productos" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-sky-800 text-white' : 'text-gray-700 hover:bg-sky-100'}`}>Tipos de Productos</NavLink>
            <NavLink to="/laboratorios" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-sky-800 text-white' : 'text-gray-700 hover:bg-sky-100'}`}>Laboratorios</NavLink>
          </>
        )}
      </nav>

      <div className="mt-10 border-t pt-4">
        <div className="text-sm text-gray-600 mb-2">Usuario</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-800">{user?.username || 'Usuario'}</div>
            <div className="text-xs text-gray-500">{isAdmin ? 'Administrador' : 'staff'}</div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-sm text-red-600 hover:underline">Cerrar sesión</button>
        </div>
      </div>
    </aside>
  )
}

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 bg-white text-gray-900">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
