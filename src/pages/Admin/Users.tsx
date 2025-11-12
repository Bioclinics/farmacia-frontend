import React, { useEffect, useState } from 'react'
import { usersApi } from '../../services/api/users'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { confirmDelete, showError, showToast, showLoading, closeLoading, showSuccess } from '../../lib/sweet-alert'
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Loader2 } from 'lucide-react'

const Users: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [togglingId, setTogglingId] = useState<number | string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<number>(3) // default staff

  const fetch = async () => {
    setLoading(true)
    try {
      const data = await usersApi.listFiltered(query ? { q: query } : undefined)
      let arr: any[] = []
      if (Array.isArray(data)) arr = data
      else if (Array.isArray(data?.items)) arr = data.items
      else if (Array.isArray(data?.data)) arr = data.data
      setItems(arr)
    } catch (err) {
      console.error(err)
      setItems([])
      showError('Error', 'No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  useEffect(() => {
    const t = setTimeout(() => { fetch() }, 400)
    return () => clearTimeout(t)
  }, [query])

  const openNew = () => {
    setEditing(null)
    setName('')
    setEmail('')
    setUsername('')
    setPassword('')
    setRole(3)
    setShowForm(true)
  }

  const openEdit = (u: any) => {
    setEditing(u)
    setName(u.name || '')
    setEmail(u.email || '')
    setUsername(u.username || '')
    setPassword('')
    setRole(Number(u.id_role || u.idRole || 3))
    setShowForm(true)
  }

  const submit = async () => {
    if (!name.trim() || !email.trim() || !username.trim()) {
      showError('Campos requeridos', 'Nombre, email y usuario son obligatorios')
      return
    }
    if (!editing && password.trim().length < 4) {
      showError('Contraseña inválida', 'Mínimo 4 caracteres')
      return
    }
    try {
      showLoading()
      if (editing) {
        const id = editing.id_user || editing.id
        await usersApi.update(id, { name: name.trim(), email: email.trim(), username: username.trim(), idRole: role })
        showSuccess('Usuario actualizado')
      } else {
        await usersApi.create({ name: name.trim(), email: email.trim(), username: username.trim(), password: password.trim(), idRole: role })
        showSuccess('Usuario creado')
      }
      closeLoading()
      setShowForm(false)
      fetch()
    } catch (err: any) {
      closeLoading()
      showError('Error', err?.message || 'Error guardando usuario')
    }
  }

  const onDelete = async (u: any) => {
    const result = await confirmDelete('¿Eliminar usuario?')
    if (!result.isConfirmed) return
    try {
      showLoading()
      const id = u.id_user || u.id
      await usersApi.remove(id)
      closeLoading()
      showSuccess('Usuario eliminado')
      fetch()
    } catch (err: any) {
      closeLoading()
      showError('Error', err?.message || 'Error eliminando usuario')
    }
  }

  const toggleActive = async (u: any) => {
    const id = u.id_user || u.id
    setTogglingId(id)
    // optimistic update for immediate feedback
    setItems(prev => prev.map(item => {
      const itemId = item.id_user || item.id
      if (itemId === id) {
        const current = item.is_active ?? item.isActive ?? item.active ?? false
        return { ...item, is_active: !current, isActive: !current, active: !current }
      }
      return item
    }))
    try {
      if (u.is_active ?? u.isActive ?? u.active) {
        await usersApi.deactivate(id)
        await showSuccess('Usuario desactivado')
      } else {
        await usersApi.activate(id)
        await showSuccess('Usuario activado')
      }
      fetch()
    } catch (err: any) {
      showError('Error', err?.message || 'Error cambiando estado')
      // revert optimistic change on error
      setItems(prev => prev.map(item => {
        const itemId = item.id_user || item.id
        if (itemId === id) {
          const current = item.is_active ?? item.isActive ?? item.active ?? false
          return { ...item, is_active: !current, isActive: !current, active: !current }
        }
        return item
      }))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground mt-1">Administra los usuarios del sistema</p>
        </div>
        <Button onClick={openNew} size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre/usuario" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <p className="mt-4 text-muted-foreground">Cargando...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Rol</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay usuarios
                  </TableCell>
                </TableRow>
              ) : (
                items.map(u => {
                  const id = u.id_user || u.id
                  const rawActive = u.is_active ?? u.isActive ?? u.active ?? u.enabled ?? (typeof u.status !== 'undefined' ? (u.status === 'active' || u.status === 1 || u.status === true) : undefined)
                  const active = Boolean(rawActive)
                  const roleName = u.role?.name || u.roleName || (u.id_role === 2 || u.idRole === 2 ? 'Admin' : 'Staff')
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="px-2 py-1 text-xs">{roleName}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={active ? 'default' : 'secondary'} className="gap-1 transition-colors">
                          {active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(u)} className="gap-2">
                            <Edit2 className="w-4 h-4" />
                            Editar
                          </Button>
                          <Button size="sm" variant={active ? 'default' : 'secondary'} onClick={() => toggleActive(u)} title={active ? 'Desactivar' : 'Activar'} disabled={togglingId === id}>
                            {togglingId === id ? <Loader2 className="w-4 h-4 animate-spin" /> : (active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />)}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => onDelete(u)} className="gap-2">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuario *</label>
              <Input value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            {!editing && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Contraseña *</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol *</label>
              <select value={role} onChange={e => setRole(Number(e.target.value))} className="w-full border rounded px-3 py-2 text-sm bg-background">
                <option value={2}>Admin</option>
                <option value={3}>Staff</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={submit} className="gap-2">
              {editing ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Users
