import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { register as apiRegister } from '../../services/api/auth'

const Register: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)

    if (password !== confirmPassword) {
      setErr('Las contraseñas no coinciden')
      return
    }

    try {
      const res = await apiRegister({
        idRole: 3, // staff role by default
        name,
        email,
        username,
        password,
      })

      // Guardar token y usuario
      localStorage.setItem('bioclinics_token', res.access_token)
      localStorage.setItem('bioclinics_user', JSON.stringify(res.user))

      // Actualizar contexto
      await login(username, password)
      navigate('/')
    } catch (error: any) {
      setErr(error?.response?.data?.message || 'Error al registrarse')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50">
      <div className="w-full max-w-md bg-white shadow rounded p-6">
        <h2 className="text-2xl font-semibold text-sky-700 mb-4">Registro — Bioclinics Farmacia</h2>
        <form onSubmit={submit} className="space-y-4">
          {err && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{err}</div>}
          <div>
            <label className="block text-sm text-gray-700">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
              required
            />
          </div>
          <button className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded">Registrarse</button>
          <div className="text-center text-sm">
            <span className="text-gray-600">¿Ya tienes cuenta? </span>
            <Link to="/login" className="text-sky-600 hover:underline">Inicia sesión</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
