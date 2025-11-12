import React, { useEffect, useState } from 'react'
import { inventoryApi } from '../../services/api/inventory'
import { productsApi } from '../../services/api/products'

const Exits: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [reason, setReason] = useState<string>('')
  const [showReason, setShowReason] = useState(false)
  const [currentReason, setCurrentReason] = useState<string>('')

  const fetch = async () => {
    setLoading(true)
    try {
      const data = await inventoryApi.exits()
      // normalize and sort by date descending (most recent first)
      const arr = Array.isArray(data) ? data : data.items || []
      const normalized = arr.slice().sort((a: any, b: any) => {
        const da = new Date(a.createdAt || a.date || 0).getTime()
        const db = new Date(b.createdAt || b.date || 0).getTime()
        return db - da
      })
      setItems(normalized)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])
  useEffect(() => {
    // load products for the adjustment form
    productsApi.list().then(d => {
      if (d && Array.isArray(d.data)) setProducts(d.data)
      else if (Array.isArray(d)) setProducts(d)
      else if (d?.items && Array.isArray(d.items)) setProducts(d.items)
      else setProducts([])
    }).catch(() => setProducts([]))
  }, [])

  const openForm = () => {
    setSelectedProduct(products[0]?.id_product ?? products[0]?.id ?? null)
    setQuantity(1)
    setReason('')
    setShowForm(true)
  }

  const submitAdjustment = async () => {
    if (!selectedProduct) return alert('Seleccione un producto')
    if (!reason || reason.trim() === '') return alert('La razón es obligatoria para un ajuste')
    if (!quantity || quantity <= 0) return alert('Cantidad inválida')
    try {
      await inventoryApi.createAdjustment({ id_product: selectedProduct, quantity, unit_price: 0, reason })
      setShowForm(false)
      fetch()
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Error registrando ajuste')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Salidas de producto</h2>
        <button className="bg-sky-600 text-white px-3 py-1 rounded" onClick={openForm}>Registrar salida</button>
      </div>

      {loading ? <div>Cargando...</div> : (
        <div className="bg-white shadow rounded p-4">
          {items.length === 0 ? <div className="text-sm text-gray-500">No hay salidas</div> : (
            <ul className="space-y-2">
              {items.map((e, idx) => (
                <li key={e.id_output ?? e.id ?? idx} className="border p-3 rounded">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-700 font-medium">{e.product?.name ?? e.productName ?? 'Producto'}</div>
                      <div className="text-xs text-gray-500">Precio: {typeof e.product?.price !== 'undefined' ? `$ ${Number(e.product.price).toFixed(2)}` : '-'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-700">Cantidad retirada: <span className="font-semibold">{e.quantity}</span></div>
                      <div className="text-xs text-gray-400">{new Date(e.created_at || e.createdAt || e.date || Date.now()).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => { setCurrentReason(e.reason || ''); setShowReason(true) }} className="px-2 py-1 border rounded text-sm">Ver razón</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showReason && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 max-w-md p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Razón de la salida</h3>
            <div className="border rounded p-3 mb-4">
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{currentReason || 'Sin razón proporcionada'}</div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowReason(false)} className="px-4 py-2 bg-sky-600 text-white rounded">Cerrar</button>
            </div>
          </div>
        </div>
      )}

          {showForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-11/12 max-w-md p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-3">Registrar salida (ajuste)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600">Producto</label>
                    <select value={selectedProduct ?? ''} onChange={e => setSelectedProduct(Number(e.target.value))} className="w-full mt-1 px-3 py-2 border rounded">
                      {products.map(p => <option key={p.id_product ?? p.id} value={p.id_product ?? p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Cantidad</label>
                    <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full mt-1 px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Razón (obligatoria)</label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button className="px-3 py-1 border rounded" onClick={() => setShowForm(false)}>Cancelar</button>
                    <button className="px-3 py-1 bg-sky-600 text-white rounded" onClick={submitAdjustment}>Registrar</button>
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  )
}

export default Exits
