import React, { useEffect, useState } from 'react'
import { inventoryApi } from '../../services/api/inventory'
import { productsApi } from '../../services/api/products'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { showError, showLoading, closeLoading, showSuccess } from '../../lib/sweet-alert'
import { Plus, Package, Loader2, AlertCircle } from 'lucide-react'

const Entries: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [laboratories, setLaboratories] = useState<any[]>([])
  const [selectedLab, setSelectedLab] = useState<string>('')
  const [products, setProducts] = useState<any[]>([])
  const [productQuery, setProductQuery] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [unitCost, setUnitCost] = useState<number>(0)
  const [reason, setReason] = useState<string>('')

  const fetch = async () => {
    setLoading(true)
    try {
      const data = await inventoryApi.entries()
      const arr = Array.isArray(data) ? data : (data?.productInputs || data?.items || [])
      setItems(arr)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  useEffect(() => {
    inventoryApi.listLaboratories().then(d => {
      const arr = Array.isArray(d) ? d : d.laboratories || d.items || []
      setLaboratories(arr)
      if (arr.length > 0) {
        setSelectedLab(String(arr[0]?.id_laboratory ?? arr[0]?.id ?? ''))
      }
    }).catch(() => setLaboratories([]))

    productsApi.list().then(d => {
      const arr = Array.isArray(d) ? d : d.data || d.items || []
      setProducts(arr)
    }).catch(() => setProducts([]))
  }, [])

  const handleSubmit = async () => {
    if (!selectedProduct) {
      showError('Validación', 'Selecciona un producto')
      return
    }
    if (!selectedLab) {
      showError('Validación', 'Selecciona un laboratorio')
      return
    }
    if (!quantity || quantity <= 0) {
      showError('Validación', 'La cantidad debe ser mayor a 0')
      return
    }

    setFormLoading(true)
    showLoading()

    try {
      const subtotal = Number(unitCost) * Number(quantity)
      await inventoryApi.createEntry({
        idProduct: Number(selectedProduct),
        idLaboratory: Number(selectedLab),
        quantity,
        unitCost,
        subtotal,
        isAdjustment: false,
        reason
      })
      closeLoading()
      setShowForm(false)
      setProductQuery('')
      setSelectedProduct('')
      setQuantity(1)
      setUnitCost(0)
      setReason('')
      showSuccess('Entrada registrada con éxito')
      fetch()
    } catch (err: any) {
      closeLoading()
      setFormLoading(false)
      showError('Error', err?.message || 'Error registrando entrada')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(productQuery.toLowerCase())
  ).slice(0, 50)

  const selectedProductData = products.find(p => String(p.id_product ?? p.id) === selectedProduct)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-8 h-8 text-primary" />
            Entradas de inventario
          </h2>
          <p className="text-foreground/60 text-sm mt-1">Registra nuevas entradas de productos</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva entrada
        </Button>
      </div>

      <Card>
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/2">
          <CardTitle>Historial de entradas</CardTitle>
          <CardDescription>{items.length} entradas registradas</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
              <p className="text-foreground/70">Cargando entradas...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-foreground/50">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p>No hay entradas registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((entry, idx) => {
                const product = entry.product?.name ?? entry.productName ?? 'Producto'
                const lab = entry.laboratory?.name ?? entry.laboratoryName ?? 'Laboratorio'
                const date = new Date(entry.created_at || entry.createdAt || Date.now())
                return (
                  <div
                    key={entry.id_input ?? entry.id ?? idx}
                    className="border border-border rounded-lg p-4 bg-secondary/30 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{product}</div>
                        <div className="text-sm text-foreground/70 mt-1">
                          Laboratorio: <Badge variant="outline">{lab}</Badge>
                        </div>
                        {entry.reason && (
                          <div className="text-xs text-foreground/60 mt-2">
                            <span className="font-medium">Razón:</span> {entry.reason}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-2">
                          <Badge className="bg-primary/10 text-primary border-primary/30">
                            {entry.quantity} unidad{entry.quantity !== 1 ? 'es' : ''}
                          </Badge>
                        </div>
                        <div className="text-sm text-foreground/60 mt-2">
                          ${(entry.quantity * entry.unitCost).toFixed(2)}
                        </div>
                        <div className="text-xs text-foreground/50 mt-1">
                          {date.toLocaleDateString()} {date.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para registrar entrada */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar entrada de producto</DialogTitle>
            <DialogDescription>
              Completa los datos para registrar una nueva entrada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Laboratorio */}
            <div className="space-y-2">
              <Label htmlFor="lab">Laboratorio</Label>
              <Select value={selectedLab} onValueChange={setSelectedLab}>
                <SelectTrigger id="lab">
                  <SelectValue placeholder="Selecciona un laboratorio" />
                </SelectTrigger>
                <SelectContent>
                  {laboratories.map(lab => (
                    <SelectItem
                      key={lab.id_laboratory ?? lab.id}
                      value={String(lab.id_laboratory ?? lab.id)}
                    >
                      {lab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Producto */}
            <div className="space-y-2">
              <Label htmlFor="product-search">Producto</Label>
              <Input
                id="product-search"
                placeholder="Buscar producto..."
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                disabled={formLoading}
              />
              {productQuery && filteredProducts.length > 0 && (
                <div className="border border-border rounded-lg max-h-40 overflow-auto bg-background/50">
                  {filteredProducts.map(prod => (
                    <div
                      key={prod.id_product ?? prod.id}
                      onClick={() => {
                        setSelectedProduct(String(prod.id_product ?? prod.id))
                        setUnitCost(Number(prod.price ?? 0))
                        setProductQuery('')
                      }}
                      className={`p-3 border-b cursor-pointer transition ${
                        String(prod.id_product ?? prod.id) === selectedProduct
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{prod.name}</span>
                        <Badge variant="outline" className="text-xs">
                          Stock: {prod.stock ?? 0}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedProductData && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                  <div className="font-medium text-primary">
                    ✓ {selectedProductData.name}
                  </div>
                  <div className="text-foreground/60 text-xs mt-1">
                    Stock actual: {selectedProductData.stock ?? 0}
                  </div>
                </div>
              )}
            </div>

            {/* Cantidad y Costo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qty">Cantidad</Label>
                <Input
                  id="qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Costo unitario</Label>
                <Input
                  id="cost"
                  type="number"
                  min={0}
                  step={0.01}
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value) || 0)}
                  disabled={formLoading}
                />
              </div>
            </div>

            {/* Razón */}
            <div className="space-y-2">
              <Label htmlFor="reason">Razón (opcional)</Label>
              <Input
                id="reason"
                placeholder="Ej: Compra a proveedor, devolución, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={formLoading}
              />
            </div>

            {/* Subtotal preview */}
            {quantity && unitCost && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="text-sm text-foreground/70">Subtotal estimado</div>
                <div className="text-xl font-bold text-primary">
                  ${(quantity * unitCost).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={formLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={formLoading || !selectedProduct}
              className="bg-primary hover:bg-primary/90"
            >
              {formLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar entrada
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Entries
