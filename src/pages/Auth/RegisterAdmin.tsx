import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { register } from '../../services/api/auth'
import { RolesEnum } from '../../constants/roles'

const RegisterAdmin: React.FC = () => {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<number>(RolesEnum.STAFF)
  const [err, setErr] = useState<string | null>(null)

  // only admin allowed in UI
  if (!user || user.idRole !== RolesEnum.ADMIN) {
    navigate('/login')
    return null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    try {
      await register({ idRole: role, name, email, username, password })
      alert('Usuario creado')
      navigate('/')
    } catch (error: any) {
      setErr(error?.response?.data?.message || 'Error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50">
      <div className="w-full max-w-md bg-white shadow rounded p-6">
        <h2 className="text-2xl font-semibold text-sky-800 mb-4">Crear personal — Admin</h2>
        <form onSubmit={submit} className="space-y-4">
          {err && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{err}</div>}
          <div>
            <label className="block text-sm text-gray-700">Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Usuario</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Rol</label>
            <select value={role} onChange={e => setRole(Number(e.target.value))} className="w-full border rounded px-3 py-2 mt-1">
              <option value={RolesEnum.STAFF}>Staff</option>
              <option value={RolesEnum.ADMIN}>Admin</option>
            </select>
          </div>
          <button className="w-full bg-sky-800 hover:bg-sky-900 text-white py-2 rounded">Crear</button>
        </form>
      </div>
    </div>
  )
}

export default RegisterAdmin
