import React, { useEffect, useState } from 'react'
import { usersApi } from '../../services/api/users'

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [nameFilter, setNameFilter] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all')
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [formData, setFormData] = useState<any>({ name: '', username: '', email: '', idRole: 3, password: '' })

  const fetch = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (nameFilter) params.name = nameFilter
      if (isActiveFilter !== 'all') params.isActive = isActiveFilter === 'true'
      const data = await usersApi.listFiltered(params)
      if (Array.isArray(data)) setUsers(data)
      else if (data?.data && Array.isArray(data.data)) setUsers(data.data)
      else setUsers([])
    } catch (err) {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const onSearch = () => { fetch() }

  const onActivate = async (id: number) => {
    await usersApi.activate(id)
    fetch()
  }

  const onDeactivate = async (id: number) => {
    await usersApi.deactivate(id)
    fetch()
  }

  const onDelete = async (id: number) => {
    if (!confirm('¿Eliminar usuario? Esta acción marcará el usuario como eliminado.')) return
    await usersApi.remove(id)
    fetch()
  }

  const onEditOpen = (u: any) => {
    setEditingUser(u)
    setFormData({
      name: u.name || '',
      username: u.username || '',
      email: u.email || '',
      idRole: u.idRole || 3,
      password: '',
    })
  }

  const onSaveEdit = async () => {
    const payload: any = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      idRole: formData.idRole,
    }
    if (formData.password) payload.password = formData.password
    await usersApi.update(editingUser.id, payload)
    setEditingUser(null)
    fetch()
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-sky-700">Usuarios — Administración</h2>

      <div className="mb-4 flex gap-2 items-center">
        <input value={nameFilter} onChange={e => setNameFilter(e.target.value)} placeholder="Buscar por nombre o usuario" className="px-3 py-2 border rounded w-64" />
        <select value={isActiveFilter} onChange={e => setIsActiveFilter(e.target.value)} className="px-3 py-2 border rounded">
          <option value="all">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <button onClick={onSearch} className="px-3 py-2 bg-sky-600 text-white rounded">Filtrar</button>
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="bg-white rounded shadow p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th>Id</th>
                <th>Username</th>
                <th>Nombre</th>
                <th>Role</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="py-2">{u.id}</td>
                  <td className="py-2">{u.username}</td>
                  <td className="py-2">{u.name || '-'}</td>
                  <td className="py-2">{u.role?.name || u.idRole}</td>
                  <td className="py-2">{u.isActive ? 'Sí' : 'No'}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button onClick={() => onEditOpen(u)} className="text-sm px-2 py-1 bg-yellow-200 rounded">Editar</button>
                      {u.isActive ? (
                        <button onClick={() => onDeactivate(u.id)} className="text-sm px-2 py-1 bg-gray-200 rounded">Desactivar</button>
                      ) : (
                        <button onClick={() => onActivate(u.id)} className="text-sm px-2 py-1 bg-green-200 rounded">Activar</button>
                      )}
                      <button onClick={() => onDelete(u.id)} className="text-sm px-2 py-1 bg-red-200 rounded">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 max-w-md p-6 shadow-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Editar usuario #{editingUser.id}</h3>
              <button onClick={() => setEditingUser(null)} className="text-sm text-gray-600">Cerrar ✕</button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-600">Nombre</label>
                <input className="w-full px-3 py-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Username</label>
                <input className="w-full px-3 py-2 border rounded" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Email</label>
                <input className="w-full px-3 py-2 border rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Rol</label>
                <select className="w-full px-3 py-2 border rounded" value={formData.idRole} onChange={e => setFormData({...formData, idRole: Number(e.target.value)})}>
                  <option value={3}>Staff</option>
                  <option value={2}>Admin</option>
                  <option value={1}>Root</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Nueva contraseña (opcional)</label>
                <input type="password" className="w-full px-3 py-2 border rounded" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setEditingUser(null)} className="px-3 py-2 border rounded">Cancelar</button>
                <button onClick={onSaveEdit} className="px-3 py-2 bg-sky-600 text-white rounded">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminUsers
