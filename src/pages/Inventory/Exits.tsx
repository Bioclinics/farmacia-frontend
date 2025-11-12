import React, { useEffect, useState } from 'react'
import { inventoryApi } from '../../services/api/inventory'
import { productsApi } from '../../services/api/products'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { showError, showSuccess } from '../../lib/sweet-alert'
import { Plus, Eye } from 'lucide-react'

const Exits: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showReason, setShowReason] = useState(false)
  const [currentReason, setCurrentReason] = useState<string>('')
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [reason, setReason] = useState<string>('')

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
    setSelectedProduct(String(products[0]?.id_product ?? products[0]?.id ?? ''))
    setQuantity(1)
    setReason('')
    setShowForm(true)
  }

  const submitAdjustment = async () => {
    if (!selectedProduct) {
      showError('Campo requerido', 'Seleccione un producto')
      return
    }
    if (!reason || reason.trim() === '') {
      showError('Campo requerido', 'La razón es obligatoria para un ajuste')
      return
    }
    if (!quantity || quantity <= 0) {
      showError('Valor inválido', 'Cantidad debe ser mayor a 0')
      return
    }
    try {
      await inventoryApi.createAdjustment({
        id_product: Number(selectedProduct),
        quantity,
        unit_price: 0,
        reason,
      })
      showSuccess('Salida registrada correctamente')
      setShowForm(false)
      fetch()
    } catch (err: any) {
      showError('Error', err?.message || 'Error registrando salida')
    }
  }

  const formatCurrency = (value: number | string) => {
    return `$${Number(value).toFixed(2)}`
  }

  const formatDate = (date: any) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salidas de producto</h1>
          <p className="text-muted-foreground mt-1">Registro de salidas y ajustes de inventario</p>
        </div>
        <Button onClick={openForm} size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          Registrar salida
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
            <p className="mt-4 text-muted-foreground">Cargando salidas...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Laboratorio</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay salidas registradas
                  </TableCell>
                </TableRow>
              ) : (
                items.map((e, idx) => (
                  <TableRow key={e.id_output ?? e.id ?? idx}>
                    <TableCell className="font-medium">
                      {e.product?.name ?? e.productName ?? 'Producto'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {e.product?.laboratory_name ?? e.laboratory_name ?? 'Sin laboratorio'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge>{e.quantity}</Badge>
                    </TableCell>
                    <TableCell>
                      {typeof e.product?.price !== 'undefined'
                        ? formatCurrency(e.product.price)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(e.created_at || e.createdAt || e.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      {e.reason && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentReason(e.reason || '')
                            setShowReason(true)
                          }}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Ver razón
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Reason Dialog */}
      <Dialog open={showReason} onOpenChange={setShowReason}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Razón de la salida</DialogTitle>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">
              {currentReason || 'Sin razón proporcionada'}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowReason(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjustment Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Registrar salida (ajuste)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Producto</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem
                      key={p.id_product ?? p.id}
                      value={String(p.id_product ?? p.id)}
                    >
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad</label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Razón (obligatoria)</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="ej: Medicamento vencido, devolución del cliente..."
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
            <Button onClick={submitAdjustment} className="bg-primary">
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Exits
