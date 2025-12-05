import React, { useEffect, useState, useContext } from 'react'
import { salesApi } from '../../services/api/sales'
import { inventoryApi } from '../../services/api/inventory'
import { AuthContext } from '../../context/AuthContext'
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
import { Eye } from 'lucide-react'

const SalesHistory: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filterDate, setFilterDate] = useState<string | null>(null)
  const [selectedSale, setSelectedSale] = useState<any | null>(null)
  const [saleOutputs, setSaleOutputs] = useState<any[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const { } = useContext(AuthContext)

  const fetch = async (date?: string | null) => {
    setLoading(true)
    try {
      const params: any = {}
      if (date) params.date = date
      const data = await salesApi.list(params)
      const arr = Array.isArray(data) ? data : data.items || []
      // Ordenar por más recientes primero (descendente)
      const sorted = arr.slice().sort((a: any, b: any) => {
        const daDate = parseDate(a.createdAt ?? a.created_at ?? null)
        const dbDate = parseDate(b.createdAt ?? b.created_at ?? null)
        const da = daDate ? daDate.getTime() : 0
        const db = dbDate ? dbDate.getTime() : 0
        return db - da // db - da para orden descendente (más recientes primero)
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

  const formatCurrency = (value: number | string) => {
    return `Bs ${Number(value).toFixed(2)}`
  }

  const formatDate = (date: any) => {
    const d = parseDate(date)
    if (!d) return '-' 
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const parseDate = (input: any): Date | null => {
    if (input === null || typeof input === 'undefined') return null
    // If already a Date
    if (input instanceof Date) {
      return isNaN(input.getTime()) ? null : input
    }
    // Numbers (timestamp seconds or ms)
    if (typeof input === 'number') {
      // if looks like seconds (10 digits) convert to ms
      if (String(input).length === 10) return new Date(input * 1000)
      return new Date(input)
    }
    if (typeof input === 'string') {
      const s = input.trim()
      if (!s) return null
      // pure numeric string -> timestamp
      if (/^\d+$/.test(s)) {
        const n = Number(s)
        if (s.length === 10) return new Date(n * 1000)
        return new Date(n)
      }
      // common DB format 'YYYY-MM-DD HH:mm:ss' -> replace space with 'T'
      const replaced = s.replace(' ', 'T')
      const d = new Date(replaced)
      if (!isNaN(d.getTime())) return d
      // fallback: try Date constructor directly
      const d2 = new Date(s)
      return isNaN(d2.getTime()) ? null : d2
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de ventas</h1>
          <p className="text-muted-foreground mt-1">Consulta todas tus ventas registradas</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filterDate ?? ''}
            onChange={e => setFilterDate(e.target.value || null)}
            className="max-w-xs"
          />
          <Button onClick={applyDateFilter}>Filtrar</Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
            <p className="mt-4 text-muted-foreground">Cargando ventas...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#Venta</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay ventas registradas
                  </TableCell>
                </TableRow>
              ) : (
                items.map(s => (
                  <TableRow key={s.id ?? s.id_sale ?? s.created_at}>
                    <TableCell className="font-semibold">#{s.id ?? s.id_sale}</TableCell>
                    <TableCell>{s.userName || s.user?.name || s.staffName || '-'}</TableCell>
                    <TableCell className="text-sm">{formatDate(s.createdAt || s.created_at)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(s.total ?? s.amount ?? 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewDetails(s)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Venta #{selectedSale?.id ?? selectedSale?.id_sale}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {formatDate(selectedSale?.createdAt || selectedSale?.created_at)}
            </p>
          </DialogHeader>

          {detailsLoading ? (
            <div className="py-8 text-center">
              <div className="inline-block animate-spin">
                <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Cargando detalles...</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-semibold mb-3">Productos:</h4>
                <div className="border rounded-lg">
                  {saleOutputs.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No hay productos en esta venta
                    </div>
                  ) : (
                    <div className="divide-y">
                      {saleOutputs.map((o, idx) => (
                        <div
                          key={o.id_output ?? idx}
                          className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {o.product_name ?? o.productName ?? 'Producto'}
                            </p>
                            {o.laboratory_name && (
                              <p className="text-xs text-muted-foreground">
                                Lab: {o.laboratory_name}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">
                              Qty: {o.quantity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedSale && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="font-semibold">
                      {formatCurrency(selectedSale.total ?? selectedSale.amount ?? 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedSale(null)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SalesHistory
