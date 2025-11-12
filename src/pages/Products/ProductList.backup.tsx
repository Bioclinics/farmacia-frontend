// backup of previous ProductList - created by assistant

import React, { useEffect, useState } from 'react'
import { productsApi } from '../../services/api/products'

const ProductList: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const data = await productsApi.list()
      // backend returns paginated { data, total, page, limit, pages }
      if (data && Array.isArray(data.data)) {
        setItems(data.data)
      } else if (Array.isArray(data)) {
        setItems(data)
      } else if (data?.items && Array.isArray(data.items)) {
        setItems(data.items)
      } else {
        setItems([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Productos</h2>
        <button className="bg-sky-600 text-white px-3 py-1 rounded">Nuevo producto</button>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 p-6 bg-white rounded shadow">No hay productos</div>
          ) : (
            items.map((p: any) => (
              <div key={p.id_product ?? p.id} className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-sky-700">{p.name || p.description || p.nombre}</h3>
                  <div className="text-sm text-gray-500 mt-1">Tipo: {p.productType?.name ?? p.typeName ?? '-'}</div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Stock: <span className="font-medium text-gray-800">{p.stock ?? p.quantity ?? '-'}</span></div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Precio</div>
                    <div className="text-lg font-bold text-sky-700">{typeof p.price !== 'undefined' ? `$ ${Number(p.price).toFixed(2)}` : '-'}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default ProductList
