import React, { useEffect, useState } from 'react'
import { productsApi } from '../../services/api/products'

const ProductList: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)

  const fetch = async (q = query, p = page, l = limit) => {
    setLoading(true)
    try {
      const data = await productsApi.list({ q, page: p, limit: l })
      // backend returns paginated { data, total, page, limit, pages }
      if (data && Array.isArray(data.data)) {
        setItems(data.data)
        setTotal(data.total ?? 0)
        setPages(data.pages ?? 1)
        setPage(data.page ?? p)
        setLimit(data.limit ?? l)
      } else if (Array.isArray(data)) {
        setItems(data)
        setTotal(data.length)
        setPages(1)
        setPage(1)
      } else if (data?.items && Array.isArray(data.items)) {
        setItems(data.items)
        setTotal(data.total ?? 0)
        setPages(data.pages ?? 1)
      } else {
        setItems([])
        setTotal(0)
        setPages(1)
      }
    } catch (err) {
      console.error(err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // initial load
    fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // debounce for search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      fetch(query, 1, limit)
    }, 450)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  useEffect(() => {
    fetch(query, page, limit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit])

  const onDelete = async (id: number | string) => {
    if (!confirm('¿Eliminar producto?')) return
    try {
      await productsApi.remove(id)
      fetch()
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Error eliminando')
    }
  }

  const toggleActive = async (p: any) => {
    try {
      await productsApi.update(p.id_product ?? p.id, { is_active: !p.is_active })
      fetch()
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Error actualizando')
    }
  }

  const openNew = () => {
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (p: any) => {
    setEditing(p)
    setShowForm(true)
  }

  const submitForm = async (payload: any) => {
    try {
      if (editing) {
        await productsApi.update(editing.id_product ?? editing.id, payload)
      } else {
        await productsApi.create(payload)
      }
      setShowForm(false)
      fetch()
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Error guardando')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-sky-700">Productos</h2>
          <p className="text-sm text-gray-500">Administra productos: buscar, paginar y acciones rápidas.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre..."
            className="px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
          <button onClick={openNew} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg shadow">Nuevo producto</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-sky-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm text-gray-600">Nombre</th>
              <th className="px-4 py-3 text-left text-sm text-gray-600">Tipo</th>
              <th className="px-4 py-3 text-right text-sm text-gray-600">Precio</th>
              <th className="px-4 py-3 text-right text-sm text-gray-600">Stock</th>
              <th className="px-4 py-3 text-center text-sm text-gray-600">Estado</th>
              <th className="px-4 py-3 text-center text-sm text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center">Cargando...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">No se encontraron productos</td>
              </tr>
            ) : (
              items.map((p: any) => (
                <tr key={p.id_product ?? p.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sky-700">{p.name || p.description || p.nombre}</div>
                    <div className="text-xs text-gray-500">{p.sku ? `SKU: ${p.sku}` : ''}</div>
                  </td>
                  <td className="px-4 py-3">{p.productType?.name ?? p.typeName ?? '-'}</td>
                  <td className="px-4 py-3 text-right">{typeof p.price !== 'undefined' ? `Bs ${Number(p.price).toFixed(2)}` : '-'}</td>
                  <td className="px-4 py-3 text-right">{p.stock ?? p.quantity ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-sky-600 hover:text-sky-800">Editar</button>
                      <button onClick={() => toggleActive(p)} className="text-sm px-2 py-1 rounded-full border text-sky-600">{p.is_active ? 'Desactivar' : 'Activar'}</button>
                      <button onClick={() => onDelete(p.id_product ?? p.id)} className="text-red-600 hover:text-red-800">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">Total: {total}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded">Prev</button>
          <div className="px-3 py-1">{page} / {pages}</div>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-1 border rounded">Next</button>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="ml-2 px-2 py-1 border rounded">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* Simple modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Editar producto' : 'Nuevo producto'}</h3>
            <ProductForm initial={editing} onCancel={() => setShowForm(false)} onSave={submitForm} />
          </div>
        </div>
      )}
    </div>
  )
}

const ProductForm: React.FC<{ initial?: any | null; onCancel: () => void; onSave: (payload: any) => void }> = ({ initial, onCancel, onSave }) => {
  const [name, setName] = useState(initial?.name ?? '')
  const [price, setPrice] = useState(initial?.price ?? '')
  const [stock, setStock] = useState(initial?.stock ?? '')
  const [typeName, setTypeName] = useState(initial?.productType?.name ?? initial?.typeName ?? '')

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const payload: any = { name, price: Number(price || 0), stock: Number(stock || 0) }
    if (typeName) payload.typeName = typeName
    onSave(payload)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm text-gray-600">Nombre</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600">Precio</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Stock</label>
          <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600">Tipo</label>
        <input value={typeName} onChange={e => setTypeName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
      </div>

      <div className="flex items-center justify-end gap-2 pt-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded">Guardar</button>
      </div>
    </form>
  )
}

export default ProductList
