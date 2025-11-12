import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { RolesEnum } from '../../constants/roles'
import { salesApi } from '../../services/api/sales'
import { productsApi } from '../../services/api/products'

const CreateSale: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    productsApi.list().then(d => {
      if (d && Array.isArray(d.data)) setProducts(d.data)
      else if (Array.isArray(d)) setProducts(d)
      else if (d?.items && Array.isArray(d.items)) setProducts(d.items)
      else setProducts([])
    }).catch(() => setProducts([]))
  }, [])

  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  useEffect(() => {
    // if not staff or admin, redirect to sales history
    if (user && user.idRole !== RolesEnum.STAFF && user.idRole !== RolesEnum.ADMIN) {
      navigate('/ventas')
    }
  }, [user])

  const addItem = (p: any) => {
    const id = p.id_product ?? p.id
    const price = p.price ?? p.unit_price ?? p.cost ?? 0
    const stock = Number(p.stock ?? 0)
    if (stock <= 0) {
      alert('Producto no disponible (sin stock)')
      return
    }
    setItems(prev => {
      // if already present, increase quantity but don't exceed stock
      const existingIndex = prev.findIndex(it => it.id_product === id || it.productId === id)
      if (existingIndex >= 0) {
        const newItems = [...prev]
        const currentQty = Number(newItems[existingIndex].quantity || 0)
        if (currentQty + 1 > stock) {
          alert(`No hay suficiente stock. Máximo ${stock} unidades disponibles.`)
          return prev
        }
        newItems[existingIndex].quantity = currentQty + 1
        return newItems
      }
      return [...prev, { productId: id, idProduct: id, id_product: id, quantity: 1, price, unit_price: price }]
    })
  }

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const updateItemQuantity = (idx: number, qty: number) => {
    setItems(prev => {
      const newItems = [...prev]
      const target = newItems[idx]
      const prod = products.find(p => (p.id_product ?? p.id) === (target.productId ?? target.idProduct ?? target.id_product))
      const maxStock = Number(prod?.stock ?? 0)
      let desired = Number(qty)
      if (Number.isNaN(desired) || desired < 1) desired = 1
      if (maxStock <= 0) {
        alert('Producto no disponible (sin stock)')
        desired = 1
      }
      if (desired > maxStock) {
        alert(`No hay suficiente stock. Máximo ${maxStock} unidades disponibles.`)
        desired = maxStock
      }
      newItems[idx].quantity = desired
      return newItems
    })
  }

  const submit = async () => {
    if (items.length === 0) return
    setLoading(true)
    try {
      // Validate stock before sending
      for (const it of items) {
        const prod = products.find(p => (p.id_product ?? p.id) === (it.id_product ?? it.productId ?? it.idProduct))
        const available = Number(prod?.stock ?? 0)
        if (available <= 0) throw new Error(`El producto ${prod?.name ?? it.id_product} no está disponible`)
        if ((it.quantity ?? 0) > available) throw new Error(`Cantidad solicitada para ${prod?.name ?? it.id_product} supera el stock disponible (${available})`)
      }
      const total = items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0)
      console.log('[CreateSale] Items array:', items)
      console.log('[CreateSale] Total calculated:', total)
      let userId: any = null
      try {
        const u = localStorage.getItem('bioclinics_user')
        if (u) {
          const parsed = JSON.parse(u)
          userId = parsed?.id || parsed?.id_user || parsed?.userId || null
        }
      } catch {}

      const payload = {
        idUser: userId,
        total,
        items: items.map(it => ({ 
          id_product: it.id_product, 
          idProduct: it.id_product,
          quantity: it.quantity, 
          unit_price: it.price,
          subtotal: it.price * it.quantity
        }))
      }

      console.log('[CreateSale] Final payload being sent:', JSON.stringify(payload, null, 2))
      console.log('[CreateSale] Items in payload - count:', payload.items.length)

      await salesApi.create(payload)
      setItems([])
      alert('Venta registrada con éxito')
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Error registrando venta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-sky-700">Crear venta</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow">
          <h3 className="font-medium mb-3">Productos disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-auto">
            {products.map((p: any) => {
              const stock = Number(p.stock ?? 0)
              const unavailable = stock <= 0
              return (
                <div key={p.id_product ?? p.id} className={`flex items-center justify-between border rounded-md p-3 hover:shadow-md transition ${unavailable ? 'bg-red-50/60' : ''}`}>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm" style={{ color: unavailable ? 'rgba(185, 28, 28, 0.9)' : undefined }}>{unavailable ? 'No disponible' : `Stock: ${p.stock ?? '-'}`}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sky-700 font-semibold">{p.price ? `$ ${Number(p.price).toFixed(2)}` : '-'}</div>
                    <button disabled={unavailable} className={`text-sm px-3 py-1 rounded ${unavailable ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-sky-600 text-white hover:bg-sky-700'}`} onClick={() => addItem(p)}>{unavailable ? 'Agotado' : 'Agregar'}</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-medium mb-3">Items en venta ({items.length})</h3>
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">No hay items</div>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-auto">
              {items.map((it, idx) => {
                const productName = products.find(p => (p.id_product ?? p.id) === it.productId)?.name ?? it.productId
                return (
                  <li key={idx} className="flex justify-between items-center border rounded-md p-2 bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{productName}</div>
                      <div className="text-xs text-gray-500">
                        <input 
                          type="number" 
                          min="1"
                          value={it.quantity} 
                          onChange={e => updateItemQuantity(idx, parseInt(e.target.value))}
                          className="w-12 px-1 py-0 border rounded"
                        />
                        x ${Number(it.price).toFixed(2)} = ${Number(it.price * it.quantity).toFixed(2)}
                      </div>
                    </div>
                    <button onClick={() => removeItem(idx)} className="text-red-600 text-xs hover:text-red-800">Quitar</button>
                  </li>
                )
              })}
              </ul>
          )}
          <div className="mt-4 pt-3 border-t">
            <div className="text-sm text-gray-600 mb-2">
              Total: <span className="font-bold text-lg text-sky-700">${items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0).toFixed(2)}</span>
            </div>
            <button onClick={submit} className="w-full bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded" disabled={loading || items.length===0}>
              {loading ? 'Registrando...' : 'Registrar venta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateSale
