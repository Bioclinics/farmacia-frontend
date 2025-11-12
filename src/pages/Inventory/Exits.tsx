import React, { useEffect, useState } from 'react'
import { inventoryApi } from '../../services/api/inventory'

const Exits: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const data = await inventoryApi.exits()
      setItems(Array.isArray(data) ? data : data.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Salidas de producto</h2>
        <button className="bg-sky-600 text-white px-3 py-1 rounded">Registrar salida</button>
      </div>

      {loading ? <div>Cargando...</div> : (
        <div className="bg-white shadow rounded p-4">
          {items.length === 0 ? <div className="text-sm text-gray-500">No hay salidas</div> : (
            <ul className="space-y-2">
              {items.map(e => (
                <li key={e.id} className="border p-3 rounded">
                  <div className="text-sm text-gray-700">{e.productName || e.product?.name}</div>
                  <div className="text-xs text-gray-500">Cantidad: {e.quantity}</div>
                  <div className="text-xs text-gray-400">{new Date(e.createdAt || e.date || Date.now()).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default Exits
