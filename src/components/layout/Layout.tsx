import React, { useContext } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'

const Sidebar: React.FC = () => {
  const { logout, user } = useContext(AuthContext)
  const navigate = useNavigate()
  return (
    <aside className="w-64 bg-gradient-to-b from-sky-50 to-white border-r border-gray-200 min-h-screen p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-sky-700">Bioclinics</h1>
        <p className="text-sm text-gray-600">Farmacia - Panel</p>
      </div>

      <nav className="space-y-1">
        <NavLink to="/" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-sky-600 text-white' : 'text-gray-700 hover:bg-sky-100'}`}>Dashboard</NavLink>
        <NavLink to="/productos" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-sky-600 text-white' : 'text-gray-700 hover:bg-sky-100'}`}>Productos</NavLink>
        <NavLink to="/ventas/crear" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-sky-600 text-white' : 'text-gray-700 hover:bg-sky-100'}`}>Hacer venta</NavLink>
        <NavLink to="/ventas" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-sky-600 text-white' : 'text-gray-700 hover:bg-sky-100'}`}>Historial ventas</NavLink>
        <NavLink to="/entradas" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-sky-600 text-white' : 'text-gray-700 hover:bg-sky-100'}`}>Entradas</NavLink>
        <NavLink to="/salidas" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-sky-600 text-white' : 'text-gray-700 hover:bg-sky-100'}`}>Salidas</NavLink>
      </nav>

      <div className="mt-10 border-t pt-4">
        <div className="text-sm text-gray-600 mb-2">Usuario</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-800">{user?.username || 'Usuario'}</div>
            <div className="text-xs text-gray-500">Administrador</div>
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
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
