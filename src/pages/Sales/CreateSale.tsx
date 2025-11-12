import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { RolesEnum } from '../../constants/roles'
import { salesApi } from '../../services/api/sales'
import { productsApi } from '../../services/api/products'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { showError, showLoading, closeLoading, showSuccess } from '../../lib/sweet-alert'
import { Plus, Trash2, ShoppingCart, AlertCircle } from 'lucide-react'

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
    if (user && user.idRole !== RolesEnum.STAFF && user.idRole !== RolesEnum.ADMIN) {
      navigate('/ventas')
    }
  }, [user])

  const addItem = (p: any) => {
    const id = p.id_product ?? p.id
    const price = p.price ?? p.unit_price ?? p.cost ?? 0
    const stock = Number(p.stock ?? 0)
    if (stock <= 0) {
      showError('Producto no disponible', 'Este producto no tiene stock disponible')
      return
    }
    setItems(prev => {
      const existingIndex = prev.findIndex(it => it.id_product === id || it.productId === id)
      if (existingIndex >= 0) {
        const newItems = [...prev]
        const currentQty = Number(newItems[existingIndex].quantity || 0)
        if (currentQty + 1 > stock) {
          showError('Stock insuficiente', `Máximo ${stock} unidades disponibles`)
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
        showError('Producto no disponible', 'Este producto no tiene stock')
        desired = 1
      }
      if (desired > maxStock) {
        showError('Stock insuficiente', `Máximo ${maxStock} unidades disponibles`)
        desired = maxStock
      }
      newItems[idx].quantity = desired
      return newItems
    })
  }

  const submit = async () => {
    if (items.length === 0) return
    setLoading(true)
    showLoading()
    try {
      for (const it of items) {
        const prod = products.find(p => (p.id_product ?? p.id) === (it.id_product ?? it.productId ?? it.idProduct))
        const available = Number(prod?.stock ?? 0)
        if (available <= 0) throw new Error(`El producto ${prod?.name ?? it.id_product} no está disponible`)
        if ((it.quantity ?? 0) > available) throw new Error(`Cantidad solicitada para ${prod?.name ?? it.id_product} supera el stock disponible (${available})`)
      }
      const total = items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0)
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

      await salesApi.create(payload)
      closeLoading()
      setItems([])
      showSuccess('Venta registrada con éxito')
    } catch (err: any) {
      closeLoading()
      setLoading(false)
      showError('Error', err?.message || 'Error registrando venta')
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="w-8 h-8 text-primary" />
          Nueva Venta
        </h2>
        <p className="text-foreground/60 text-sm mt-1">Selecciona productos y registra la venta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos disponibles */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/2">
              <CardTitle className="text-lg">Productos disponibles</CardTitle>
              <CardDescription>{products.length} productos en catálogo</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {products.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-foreground/50">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <p>No hay productos disponibles</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-auto pr-2">
                  {products.map((p: any) => {
                    const stock = Number(p.stock ?? 0)
                    const unavailable = stock <= 0
                    return (
                      <div
                        key={p.id_product ?? p.id}
                        className={`flex items-center justify-between border rounded-lg p-3 transition-all hover:shadow-md ${
                          unavailable ? 'bg-destructive/5 border-destructive/30' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm text-foreground">{p.name}</div>
                          <div className={`text-xs mt-1 ${unavailable ? 'text-destructive font-medium' : 'text-foreground/60'}`}>
                            {unavailable ? 'Sin stock' : `Stock: ${p.stock ?? '-'}`}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-primary font-semibold text-sm">${Number(p.price || 0).toFixed(2)}</div>
                          <Button
                            disabled={unavailable || loading}
                            size="sm"
                            variant={unavailable ? 'outline' : 'default'}
                            className="h-8 text-xs"
                            onClick={() => addItem(p)}
                          >
                            {unavailable ? 'Agotado' : (
                              <>
                                <Plus className="w-3 h-3 mr-1" />
                                Agregar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Carrito de venta */}
        <div>
          <Card className="sticky top-6">
            <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-white rounded-t-lg">
              <CardTitle className="text-lg">Carrito de venta</CardTitle>
              <CardDescription className="text-white/80">{items.length} item{items.length !== 1 ? 's' : ''}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {items.length === 0 ? (
                <div className="text-center py-8 text-foreground/50">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay items en el carrito</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-auto">
                  {items.map((it, idx) => {
                    const productName = products.find(p => (p.id_product ?? p.id) === it.productId)?.name ?? it.productId
                    const subtotal = Number(it.price) * Number(it.quantity)
                    return (
                      <div key={idx} className="border border-border rounded-lg p-3 bg-secondary/30">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-foreground">{productName}</div>
                            <Badge variant="outline" className="mt-1 text-xs">
                              ${Number(it.price).toFixed(2)} c/u
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => removeItem(idx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={e => updateItemQuantity(idx, parseInt(e.target.value) || 1)}
                            className="w-16 h-8 text-center"
                            disabled={loading}
                          />
                          <div className="text-sm text-foreground/70">=</div>
                          <div className="text-sm font-semibold text-primary">${subtotal.toFixed(2)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Total y botón */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="mb-4">
                  <p className="text-sm text-foreground/70">Total a cobrar</p>
                  <p className="text-3xl font-bold text-primary">${total.toFixed(2)}</p>
                </div>
                <Button
                  onClick={submit}
                  disabled={loading || items.length === 0}
                  className="w-full h-10 bg-primary hover:bg-primary/90 text-white"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Registrar venta
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CreateSale
