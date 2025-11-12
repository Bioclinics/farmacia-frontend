import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'

const Login: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(username, password)
      navigate('/')
    } catch (error: any) {
      setErr(error?.response?.data?.message || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50">
      <div className="w-full max-w-md bg-white shadow rounded p-6">
        <h2 className="text-2xl font-semibold text-sky-700 mb-4">Bioclinics — Farmacia</h2>
        <form onSubmit={submit} className="space-y-4">
          {err && <div className="text-sm text-red-600">{err}</div>}
          <div>
            <label className="block text-sm text-gray-700">Usuario</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" />
          </div>
          <button className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded">Iniciar sesión</button>
          <div className="text-center text-sm">
            <span className="text-gray-600">¿No tienes cuenta? </span>
            <Link to="/register" className="text-sky-600 hover:underline">Regístrate aquí</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
