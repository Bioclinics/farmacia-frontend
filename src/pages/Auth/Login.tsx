import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import { showError, showLoading, closeLoading } from '../../lib/sweet-alert'
import { LogIn } from 'lucide-react'

const Login: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      showError('Validación', 'Por favor completa todos los campos')
      return
    }

    setLoading(true)
    showLoading()

    try {
      await login(username, password)
      closeLoading()
      navigate('/')
    } catch (error: any) {
      closeLoading()
      setLoading(false)
      const message = error?.response?.data?.message || 'Error al iniciar sesión'
      showError('Error de autenticación', message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-t-lg">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                <LogIn className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Bioclinics</CardTitle>
            <CardDescription className="text-center text-white/80">Farmacia — Sistema de Gestión</CardDescription>
          </CardHeader>

          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Usuario */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground font-medium">
                  Usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="h-10 border-border focus:ring-primary"
                />
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-10 border-border focus:ring-primary"
                />
              </div>

              {/* Botón Iniciar Sesión */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Iniciando sesión...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Iniciar sesión
                  </span>
                )}
              </Button>

              {/* Registro */}
              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-foreground/70">
                  ¿No tienes cuenta?{' '}
                  <Link to="/register" className="text-primary font-semibold hover:text-primary/80 transition">
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-foreground/50 mt-8 font-light">
          © 2024 Bioclinics Farmacia. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

export default Login
