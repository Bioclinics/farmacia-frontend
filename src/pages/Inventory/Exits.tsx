import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { inventoryApi } from '../../services/api/inventory'
import { productsApi, brandsApi } from '../../services/api/products'
import { usersApi } from '../../services/api/users'
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
import { Plus, Eye, RefreshCcw, Filter } from 'lucide-react'

const initialFilters = {
  startDate: '',
  endDate: '',
  productId: 'all',
  laboratoryId: 'all',
  userId: 'all',
}

const defaultSummary = {
  period: {
    startDate: null as string | null,
    endDate: null as string | null,
  },
  outputs: {
    count: 0,
    totalQuantity: 0,
    totalSubtotal: 0,
  },
  entries: {
    count: 0,
    totalQuantity: 0,
    totalSubtotal: 0,
  },
}

const toNumber = (value: any): number => {
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

const normaliseArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  if (payload?.items && Array.isArray(payload.items)) return payload.items
  return []
}

const parseDate = (input: any): Date | null => {
  if (input === null || typeof input === 'undefined') return null
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input
  if (typeof input === 'number') {
    const str = String(input)
    if (str.length === 10) return new Date(input * 1000)
    return new Date(input)
  }
  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (!trimmed) return null
    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed)
      if (trimmed.length === 10) return new Date(numeric * 1000)
      return new Date(numeric)
    }
    const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
    const direct = new Date(normalized)
    if (!Number.isNaN(direct.getTime())) return direct
    const fallback = new Date(trimmed)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  return null
}

const formatDateTime = (value: any): string => {
  const parsed = parseDate(value)
  if (!parsed) return '-'
  return parsed.toLocaleString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', '')
}

const formatCurrency = (value: number | string): string => {
  return `Bs ${toNumber(value).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatShortDate = (value: string | null): string => {
  if (!value) return '-'
  const parsed = parseDate(value)
  if (!parsed) return '-'
  return parsed.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const Exits: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(defaultSummary)
  const [filters, setFilters] = useState(initialFilters)
  const [showForm, setShowForm] = useState(false)
  const [showReason, setShowReason] = useState(false)
  const [currentReason, setCurrentReason] = useState<string>('')
  const [products, setProducts] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [reason, setReason] = useState<string>('')

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {}
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate
      if (filters.productId !== 'all') params.productId = filters.productId
      if (filters.laboratoryId !== 'all') params.laboratoryId = filters.laboratoryId
      if (filters.userId !== 'all') params.userId = filters.userId

      const response = await inventoryApi.exits(params)
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : normaliseArray(response)

      const mapped = list
        .slice()
        .sort((a: any, b: any) => {
          const da = parseDate(a.createdAt ?? a.created_at ?? a.date)?.getTime() ?? 0
          const db = parseDate(b.createdAt ?? b.created_at ?? b.date)?.getTime() ?? 0
          return db - da
        })
        .map((item: any) => {
          const productData = item.product ?? item.productInfo ?? null
          const productId = productData?.id ?? productData?.id_product ?? item.id_product ?? item.productId ?? null
          const responsibleData = item.responsible ?? item.user ?? item.sale?.user ?? null
          const idOutput = item.id_output ?? item.id ?? item.outputId ?? item.id_output ?? productId ?? Math.random()

          return {
            id: idOutput,
            id_output: idOutput,
            id_sale: item.id_sale ?? item.sale_id ?? null,
            productName: productData?.name ?? item.product_name ?? item.productName ?? 'Producto',
            brandName:
              productData?.brand?.name ??
              productData?.brandName ??
              item.brandName ??
              item.brand_name ??
              item.laboratory_name ??
              null,
            typeName: productData?.typeName ?? item.typeName ?? item.type_name ?? null,
            quantity: toNumber(item.quantity ?? item.qty ?? 0),
            unitPrice: toNumber(item.unitPrice ?? item.unit_price ?? productData?.price ?? 0),
            subtotal: toNumber(item.subtotal ?? item.total ?? item.amount ?? 0),
            reason: item.reason ?? null,
            isAdjustment: Boolean(item.is_adjustment ?? item.isAdjustment ?? false),
            createdAt: item.createdAt ?? item.created_at ?? item.date ?? null,
            responsible: responsibleData
              ? {
                  id: toNumber(responsibleData.id ?? responsibleData.id_user ?? responsibleData.userId ?? 0),
                  name: responsibleData.name ?? 'Sin nombre',
                  username: responsibleData.username ?? responsibleData.userName ?? undefined,
                }
              : null,
          }
        })

      setItems(mapped)

      const summaryRaw = response?.summary ?? defaultSummary
      const nextSummary = {
        period: {
          startDate: summaryRaw?.period?.startDate ?? (filters.startDate || null),
          endDate: summaryRaw?.period?.endDate ?? (filters.endDate || null),
        },
        outputs: {
          count: toNumber(summaryRaw?.outputs?.count ?? summaryRaw?.outputsCount ?? 0),
          totalQuantity: toNumber(summaryRaw?.outputs?.totalQuantity ?? summaryRaw?.outputsQuantity ?? 0),
          totalSubtotal: toNumber(summaryRaw?.outputs?.totalSubtotal ?? summaryRaw?.outputsSubtotal ?? 0),
        },
        entries: {
          count: toNumber(summaryRaw?.entries?.count ?? summaryRaw?.entriesCount ?? 0),
          totalQuantity: toNumber(summaryRaw?.entries?.totalQuantity ?? summaryRaw?.entriesQuantity ?? 0),
          totalSubtotal: toNumber(summaryRaw?.entries?.totalSubtotal ?? summaryRaw?.entriesSubtotal ?? 0),
        },
      }
      setSummary(nextSummary)
    } catch (error) {
      console.error('[Exits] fetch error', error)
      setItems([])
      setSummary({
        ...defaultSummary,
        period: {
          startDate: filters.startDate || null,
          endDate: filters.endDate || null,
        },
      })
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetch()
  }, [fetch])
  useEffect(() => {
    let active = true
    const loadOptions = async () => {
      try {
        const [productsResp, brandsResp, usersResp] = await Promise.all([
          productsApi.list(),
          brandsApi.list(),
          usersApi.list(),
        ])
        if (!active) return

        setProducts(normaliseArray(productsResp))
        setBrands(normaliseArray(brandsResp))
        setUsers(normaliseArray(usersResp))
      } catch (error) {
        console.error('[Exits] options load error', error)
        if (!active) return
        setProducts([])
        setBrands([])
        setUsers([])
      }
    }

    loadOptions()
    return () => {
      active = false
    }
  }, [])

  const openForm = () => {
    setSelectedProduct(String(products[0]?.id_product ?? products[0]?.id ?? ''))
    setQuantity(1)
    setReason('')
    setShowForm(true)
  }

  const handleFilterChange = (changes: Partial<typeof initialFilters>) => {
    setFilters(prev => ({ ...prev, ...changes }))
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
  }

  const filtersActive = useMemo(() => {
    return (
      !!filters.startDate ||
      !!filters.endDate ||
      filters.productId !== 'all' ||
      filters.laboratoryId !== 'all' ||
      filters.userId !== 'all'
    )
  }, [filters])

  const periodLabel = useMemo(() => {
    if (summary.period.startDate && summary.period.endDate) {
      if (summary.period.startDate === summary.period.endDate) {
        return `Día ${formatShortDate(summary.period.startDate)}`
      }
      return `${formatShortDate(summary.period.startDate)} - ${formatShortDate(summary.period.endDate)}`
    }
    if (summary.period.startDate) {
      return `Desde ${formatShortDate(summary.period.startDate)}`
    }
    if (summary.period.endDate) {
      return `Hasta ${formatShortDate(summary.period.endDate)}`
    }
    return 'Todo el histórico'
  }, [summary.period.startDate, summary.period.endDate])

  const productOptions = useMemo(() => {
    return products.map((product: any) => ({
      id: String(product.id_product ?? product.id ?? ''),
      name: product.name ?? 'Producto',
    }))
  }, [products])

  const brandOptions = useMemo(() => {
    return brands.map((brand: any) => ({
      id: String(brand.id_brand ?? brand.id ?? ''),
      name: brand.name ?? 'Marca',
    }))
  }, [brands])

  const userOptions = useMemo(() => {
    return users
      .filter((user: any) => !(user.isDeleted ?? user.is_deleted))
      .map((user: any) => ({
        id: String(user.id ?? user.id_user ?? user.userId ?? ''),
        name: user.name ?? user.username ?? 'Responsable',
      }))
  }, [users])

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
      await fetch()
    } catch (err: any) {
      showError('Error', err?.message || 'Error registrando salida')
    }
  }

  const formatCurrency = (value: number | string) => {
    return `Bs ${Number(value).toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salidas de producto</h1>
          <p className="text-muted-foreground mt-1">Registro de salidas y ajustes de inventario</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={fetch}
            disabled={loading}
          >
            <RefreshCcw className="w-4 h-4" />
            Actualizar
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleClearFilters}
            disabled={!filtersActive || loading}
          >
            <Filter className="w-4 h-4" />
            Limpiar filtros
          </Button>
          <Button onClick={openForm} size="lg" className="gap-2">
            <Plus className="w-4 h-4" />
            Registrar salida
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Periodo analizado: {periodLabel}</p>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 shadow-sm">
          <div className="space-y-1 p-4">
            <p className="text-xs uppercase text-muted-foreground">Salidas</p>
            <h2 className="text-sm font-semibold text-foreground">Movimientos registrados</h2>
            <p className="text-3xl font-bold text-foreground">{summary.outputs.count}</p>
            <p className="text-xs text-muted-foreground">Documentos en el rango seleccionado</p>
          </div>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <div className="space-y-1 p-4">
            <p className="text-xs uppercase text-muted-foreground">Salidas</p>
            <h2 className="text-sm font-semibold text-foreground">Totales del período</h2>
            <p className="text-2xl font-bold text-foreground">{summary.outputs.totalQuantity.toLocaleString('es-BO')} unidad(es)</p>
            <p className="text-sm font-semibold text-primary">{formatCurrency(summary.outputs.totalSubtotal)}</p>
            <p className="text-xs text-muted-foreground">Cantidad y monto liberado</p>
          </div>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <div className="space-y-1 p-4">
            <p className="text-xs uppercase text-muted-foreground">Entradas</p>
            <h2 className="text-sm font-semibold text-foreground">Totales del período</h2>
            <p className="text-2xl font-bold text-foreground">{summary.entries.totalQuantity.toLocaleString('es-BO')} unidad(es)</p>
            <p className="text-sm font-semibold text-primary">{formatCurrency(summary.entries.totalSubtotal)}</p>
            <p className="text-xs text-muted-foreground">Ingresos vinculados al filtro</p>
          </div>
        </Card>
      </div>

      <Card className="border border-border/70">
        <div className="border-b border-border/60 px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
          <p className="text-xs text-muted-foreground">Combina filtros por fecha, producto, laboratorio o responsable.</p>
        </div>
        <div className="grid gap-4 px-4 py-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Desde</label>
            <Input
              type="date"
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={(event) => handleFilterChange({ startDate: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Hasta</label>
            <Input
              type="date"
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={(event) => handleFilterChange({ endDate: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Producto</label>
            <Select
              value={filters.productId}
              onValueChange={(value) => handleFilterChange({ productId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los productos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                {productOptions.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Laboratorio / Marca</label>
            <Select
              value={filters.laboratoryId}
              onValueChange={(value) => handleFilterChange({ laboratoryId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los laboratorios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los laboratorios</SelectItem>
                {brandOptions.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Responsable</label>
            <Select
              value={filters.userId}
              onValueChange={(value) => handleFilterChange({ userId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los responsables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los responsables</SelectItem>
                {userOptions.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

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
                <TableHead>Laboratorio / Marca</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay salidas registradas
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id_output ?? item.id}>
                    <TableCell className="font-medium">
                      {item.productName}
                      {item.typeName && (
                        <span className="ml-2 text-xs text-muted-foreground">({item.typeName})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.brandName ?? 'Sin laboratorio'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.responsible ? (
                        <span>
                          {item.responsible.name}
                          {item.responsible.username ? ` · @${item.responsible.username}` : ''}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Ajuste manual</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={item.isAdjustment ? 'outline' : 'secondary'}>{item.quantity}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.subtotal || item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.reason && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentReason(item.reason || '')
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
