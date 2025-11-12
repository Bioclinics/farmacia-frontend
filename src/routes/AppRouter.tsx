import React, { useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import Layout from '../components/layout/Layout'
import ProductList from '../pages/Products/ProductList'
import Login from '../pages/Auth/Login'
import RegisterAdmin from '../pages/Auth/RegisterAdmin'
import CreateSale from '../pages/Sales/CreateSale'
import SalesHistory from '../pages/Sales/SalesHistory'
import Entries from '../pages/Inventory/Entries'
import Dashboard from '../pages/Dashboard'
import Exits from '../pages/Inventory/Exits'
import AdminUsers from '../pages/Admin/Users'

const AppRouter: React.FC = () => {
  const { token, ready, user } = useContext(AuthContext)

  if (!ready) return null

  return (
    <BrowserRouter>
      <Routes>
  <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={token ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="productos" element={<ProductList />} />
          {(user?.idRole === 3 || user?.idRole === 2) && (
            <Route path="ventas/crear" element={<CreateSale />} />
          )}
          <Route path="ventas" element={<SalesHistory />} />
          {user?.idRole === 2 && (
            <>
              <Route path="staff/create" element={<RegisterAdmin />} />
              <Route path="usuarios" element={<AdminUsers />} />
            </>
          )}
          <Route path="entradas" element={<Entries />} />
          <Route path="salidas" element={<Exits />} />
        </Route>
        <Route path="*" element={<Navigate to={token ? '/' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
