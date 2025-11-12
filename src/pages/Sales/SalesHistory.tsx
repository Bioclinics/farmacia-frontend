import React, { useEffect, useState, useContext } from 'react'
import { salesApi } from '../../services/api/sales'
import { inventoryApi } from '../../services/api/inventory'
import { AuthContext } from '../../context/AuthContext'

const SalesHistory: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filterDate, setFilterDate] = useState<string | null>(null)
  const [selectedSale, setSelectedSale] = useState<any | null>(null)
  const [saleOutputs, setSaleOutputs] = useState<any[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const { user } = useContext(AuthContext)

  const fetch = async (date?: string | null) => {
    setLoading(true)
    try {
      const params: any = {}
      if (date) params.date = date
      const data = await salesApi.list(params)
      const arr = Array.isArray(data) ? data : data.items || []
      // Ordenar por más recientes primero (descendente)
      const sorted = arr.slice().sort((a: any, b: any) => {
        const da = new Date(a.createdAt || a.created_at || 0).getTime()
        const db = new Date(b.createdAt || b.created_at || 0).getTime()
        return db - da  // db - da para orden descendente (más recientes primero)
      })
      setItems(sorted)
    } catch (err) {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load persistent filter date from localStorage (permanent until changed)
    try {
      const saved = localStorage.getItem('sales_filter_date')
      if (saved) setFilterDate(saved)
    } catch {}
    fetch(localStorage.getItem('sales_filter_date'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyDateFilter = () => {
    if (filterDate) {
      try { localStorage.setItem('sales_filter_date', filterDate) } catch {}
      fetch(filterDate)
    } else {
      // if user clears input and clicks filter, remove saved filter
      try { localStorage.removeItem('sales_filter_date') } catch {}
      fetch(null)
    }
  }

  const viewDetails = async (sale: any) => {
    setSelectedSale(sale)
    setSaleOutputs([])
    setDetailsLoading(true)
    try {
      const outputs = await inventoryApi.exits({ saleId: sale.id ?? sale.id_sale })
      const arr = Array.isArray(outputs) ? outputs : outputs.items || outputs
      setSaleOutputs(arr)
    } catch (err) {
      setSaleOutputs([])
    } finally {
      setDetailsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Historial de ventas</h2>
        <div className="flex items-center gap-3">
          <input type="date" value={filterDate ?? ''} onChange={e => setFilterDate(e.target.value || null)} className="px-2 py-1 border rounded" />
          <button onClick={applyDateFilter} className="px-3 py-1 bg-sky-600 text-white rounded text-sm">Filtrar</button>
          <div className="text-sm text-gray-600">{user?.username || ''}</div>
        </div>
      </div>

      {loading ? <div>Cargando...</div> : (
        <div className="bg-white shadow rounded p-4">
          {items.length === 0 ? <div className="text-sm text-gray-500">No hay ventas</div> : (
            <ul className="space-y-2">
              {items.map(s => (
                <li key={s.id ?? s.id_sale ?? s.created_at} className="border p-3 rounded">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">Venta #{s.id ?? s.id_sale}</div>
                      <div className="text-xs text-gray-500">Usuario: {s.userName || s.user?.name || s.staffName || '-'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${Number(s.total ?? s.amount ?? 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-400">{new Date(s.createdAt || s.created_at || Date.now()).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => viewDetails(s)} className="px-2 py-1 bg-sky-600 text-white rounded text-sm">Ver detalles</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedSale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 max-w-md p-6 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Venta #{selectedSale.id ?? selectedSale.id_sale}</h3>
                <div className="text-xs text-gray-500">{new Date(selectedSale.createdAt || selectedSale.created_at || Date.now()).toLocaleString()}</div>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-sm text-gray-600 hover:text-gray-800">✕</button>
            </div>

            {detailsLoading ? <div className="text-center py-4">Cargando medicamentos...</div> : (
              <div className="border rounded p-3">
                {saleOutputs.length === 0 ? (
                  <div className="text-sm text-gray-500">No hay medicamentos registrados</div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Medicamentos:</h4>
                    {saleOutputs.map((o, idx) => (
                      <div key={o.id_output ?? idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <span className="text-sm font-semibold text-black">{o.product_name ?? o.productName ?? o.id_product ?? 'Producto'}</span>
                        <span className="text-sm font-semibold">Cantidad: {o.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button onClick={() => setSelectedSale(null)} className="px-4 py-2 bg-sky-600 text-white rounded text-sm hover:bg-sky-700">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesHistory
