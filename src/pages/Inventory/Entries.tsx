import React, { useEffect, useState } from 'react'
import { inventoryApi } from '../../services/api/inventory'
import { productsApi } from '../../services/api/products'

const Entries: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [laboratories, setLaboratories] = useState<any[]>([])
  const [selectedLab, setSelectedLab] = useState<number | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [productQuery, setProductQuery] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [unitCost, setUnitCost] = useState<number>(0)
  const [reason, setReason] = useState<string>('')

  const fetch = async () => {
    setLoading(true)
    try {
      const data = await inventoryApi.entries()
      // Handle both array and wrapped response
      const arr = Array.isArray(data) ? data : (data?.productInputs || data?.items || [])
      setItems(arr)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])
  useEffect(() => {
    // load laboratories
    inventoryApi.listLaboratories().then(d => {
      const arr = Array.isArray(d) ? d : d.laboratories || d.items || []
      setLaboratories(arr)
      setSelectedLab(arr[0]?.id_laboratory ?? arr[0]?.id ?? null)
    }).catch(() => setLaboratories([]))

    // load products for product selector
    productsApi.list().then(d => {
      const arr = Array.isArray(d) ? d : d.data || d.items || []
      setProducts(arr)
    }).catch(() => setProducts([]))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Entradas de producto</h2>
        <button className="bg-sky-600 text-white px-3 py-1 rounded" onClick={() => setShowForm(true)}>Registrar entrada</button>
      </div>

      {loading ? <div>Cargando...</div> : (
        <div className="bg-white shadow rounded p-4">
          {items.length === 0 ? <div className="text-sm text-gray-500">No hay entradas</div> : (
            <ul className="space-y-2">
              {items.map(e => (
                <li key={e.id_input ?? e.id ?? e.id_input} className="border p-3 rounded">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-700 font-medium">{e.product?.name ?? e.productName ?? 'Producto'}</div>
                      <div className="text-xs text-gray-500">Laboratorio: {e.laboratory?.name ?? e.laboratoryName ?? '-'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-700">Cantidad entrante: <span className="font-semibold">{e.quantity}</span></div>
                      <div className="text-xs text-gray-400">{new Date(e.created_at || e.createdAt || Date.now()).toLocaleString()}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 max-w-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Registrar entrada</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm text-gray-600">Laboratorio</label>
                <select value={selectedLab ?? ''} onChange={e => setSelectedLab(Number(e.target.value))} className="w-full mt-1 px-3 py-2 border rounded">
                  {laboratories.map(l => <option key={l.id_laboratory ?? l.id} value={l.id_laboratory ?? l.id}>{l.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600">Producto (buscar por nombre)</label>
                <input value={productQuery} onChange={e => setProductQuery(e.target.value)} placeholder="Buscar producto..." className="w-full mt-1 px-3 py-2 border rounded" />
                <div className="mt-2 max-h-40 overflow-auto border rounded">
                  {products.filter(p => p.name?.toLowerCase().includes(productQuery.toLowerCase())).slice(0,50).map(p => (
                    <div key={p.id_product ?? p.id} className={`p-2 border-b cursor-pointer transition ${selectedProduct === (p.id_product ?? p.id) ? 'bg-sky-500 text-white font-semibold' : 'bg-white hover:bg-gray-50'}`} onClick={() => { setSelectedProduct(p.id_product ?? p.id); setUnitCost(Number(p.price ?? 0)) }}>{p.name} <span className={`text-xs ${selectedProduct === (p.id_product ?? p.id) ? 'text-sky-100' : 'text-gray-400'}`}>({p.stock ?? 0})</span></div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">Cantidad</label>
                  <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full mt-1 px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Costo unitario</label>
                  <input type="number" min={0} value={unitCost} onChange={e => setUnitCost(Number(e.target.value))} className="w-full mt-1 px-3 py-2 border rounded" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600">Razón (opcional)</label>
                <input value={reason} onChange={e => setReason(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button className="px-3 py-1 border rounded" onClick={() => setShowForm(false)}>Cancelar</button>
                <button className="px-3 py-1 bg-sky-600 text-white rounded" onClick={async () => {
                  if (!selectedProduct) return alert('Seleccione un producto')
                  if (!selectedLab) return alert('Seleccione un laboratorio')
                  if (!quantity || quantity <= 0) return alert('Cantidad invalida')
                  try {
                    const subtotal = Number(unitCost) * Number(quantity)
                    await inventoryApi.createEntry({ idProduct: selectedProduct, idLaboratory: selectedLab, quantity, unitCost, subtotal, isAdjustment: false, reason })
                    setShowForm(false)
                    fetch()
                  } catch (err: any) {
                    console.error(err)
                    alert(err?.message || 'Error registrando entrada')
                  }
                }}>Registrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Entries
