import React, { useEffect, useState } from 'react'
import { productTypesApi } from '../../services/api/products'

const ProductTypes: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [name, setName] = useState<string>('')

  const fetch = async () => {
    setLoading(true)
    try {
      const data = await productTypesApi.list()
      const arr = Array.isArray(data) ? data : data.items || []
      setItems(arr)
    } catch (err) {
      console.error(err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const openNew = () => {
    setEditing(null)
    setName('')
    setShowForm(true)
  }

  const openEdit = (item: any) => {
    setEditing(item)
    setName(item.name || '')
    setShowForm(true)
  }

  const submit = async () => {
    if (!name.trim()) return alert('El nombre es obligatorio')
    try {
      if (editing) {
        const itemId = editing.id_type || editing.id_product_type || editing.id
        await productTypesApi.update(itemId, { name })
      } else {
        await productTypesApi.create({ name })
      }
      setShowForm(false)
      fetch()
    } catch (err: any) {
      alert(err?.message || 'Error guardando')
    }
  }

  const onDelete = async (item: any) => {
    if (!confirm('¿Eliminar tipo de producto?')) return
    try {
      const itemId = item.id_type || item.id_product_type || item.id
      await productTypesApi.remove(itemId)
      fetch()
    } catch (err: any) {
      alert(err?.message || 'Error eliminando')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Tipos de Productos</h2>
        <button onClick={openNew} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded">Nuevo tipo</button>
      </div>

      {loading ? <div>Cargando...</div> : (
        <div className="bg-white rounded-lg shadow overflow-auto">
          <table className="w-full">
            <thead className="bg-sky-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-center text-sm text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={2} className="p-6 text-center text-gray-500">No hay tipos</td></tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item.id_type || item.id_product_type || item.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button onClick={() => openEdit(item)} className="text-sky-600 hover:text-sky-800 text-sm">Editar</button>
                      <button onClick={() => onDelete(item)} className="text-red-600 hover:text-red-800 text-sm">Eliminar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar tipo' : 'Nuevo tipo'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600">Nombre</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button onClick={submit} className="px-4 py-2 bg-sky-600 text-white rounded">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductTypes
