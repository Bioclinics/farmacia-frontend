import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { register } from '../../services/api/auth'
import { RolesEnum } from '../../constants/roles'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { showError, showLoading, closeLoading, showSuccess } from '../../lib/sweet-alert'

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
    if (!name.trim() || !email.trim() || !username.trim() || !password.trim()) {
      showError('Campos requeridos', 'Completa todos los campos obligatorios')
      return
    }
    if (password.trim().length < 4) {
      showError('Contraseña inválida', 'Debe tener al menos 4 caracteres')
      return
    }
    try {
      showLoading()
      await register({ idRole: role, name: name.trim(), email: email.trim(), username: username.trim(), password: password.trim() })
      closeLoading()
      showSuccess('Usuario creado')
      navigate('/')
    } catch (error: any) {
      closeLoading()
      const msg = error?.response?.data?.message || 'Error creando usuario'
      setErr(msg)
      showError('Error', msg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4 animate-fade-in">
      <Card className="w-full max-w-md shadow-soft-card animate-scale-in border border-border/60">
        <CardHeader>
          <CardTitle className="text-primary">Crear personal — Admin</CardTitle>
          <CardDescription>Registra nuevo usuario del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md" role="alert">{err}</div>}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Nombre *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Email *</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@correo.com" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Usuario *</label>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="usuario" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Contraseña *</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Rol *</label>
              <select value={role} onChange={e => setRole(Number(e.target.value))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value={RolesEnum.STAFF}>Staff</option>
                <option value={RolesEnum.ADMIN}>Admin</option>
              </select>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-secondary transition-colors">Crear</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterAdmin
