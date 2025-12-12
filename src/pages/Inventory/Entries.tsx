import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { inventoryApi } from '../../services/api/inventory'
import { productsApi } from '../../services/api/products'
import { laboratoriesApi } from '../../services/api/laboratories'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { showError, showLoading, closeLoading, showSuccess } from '../../lib/sweet-alert'
import {
  Plus,
  Package,
  Loader2,
  Filter,
  RefreshCcw,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
} from 'lucide-react'

const initialFilters = {
  startDate: '',
  endDate: '',
  productId: 'all',
  laboratoryId: 'all',
  isAdjustment: 'all',
}

const defaultSummary = {
  period: {
    startDate: null as string | null,
    endDate: null as string | null,
  },
  entries: {
    count: 0,
    totalBoxes: 0,
    totalUnits: 0,
    totalSubtotal: 0,
  },
  outputs: {
    count: 0,
    totalQuantity: 0,
    totalSubtotal: 0,
  },
}

const toNumber = (value: any): number => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? 0 : value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

const normaliseArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.productInputs)) return payload.productInputs
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
  return parsed
    .toLocaleString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(',', '')
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

const formatCurrency = (value: number | string): string => {
  return `Bs ${toNumber(value).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const Entries: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(defaultSummary)
  const [filters, setFilters] = useState(initialFilters)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [laboratories, setLaboratories] = useState<any[]>([])
  const [selectedLab, setSelectedLab] = useState<string>('')
  const [products, setProducts] = useState<any[]>([])
  const [productQuery, setProductQuery] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [unitsPerBox, setUnitsPerBox] = useState<number>(1)
  const [unitCost, setUnitCost] = useState<number>(0)
  const [reason, setReason] = useState<string>('')

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {}
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate
      if (filters.productId !== 'all') params.productId = filters.productId
      if (filters.laboratoryId !== 'all') params.laboratoryId = filters.laboratoryId
      if (filters.isAdjustment !== 'all') params.isAdjustment = filters.isAdjustment === 'adjustments'

      const response = await inventoryApi.entries(params)
      const list = normaliseArray(response?.data ?? response)

      const mapped = list
        .slice()
        .sort((a: any, b: any) => {
          const da = parseDate(a.createdAt ?? a.created_at)?.getTime() ?? 0
          const db = parseDate(b.createdAt ?? b.created_at)?.getTime() ?? 0
          return db - da
        })
        .map((item: any) => {
          const unitsPerBoxValue = toNumber(item.unitsPerBox ?? item.units_per_box ?? item.units ?? 0) || 1
          const boxes = toNumber(item.quantityBoxes ?? item.quantity ?? 0)
          const totalUnits = toNumber(item.totalUnits ?? boxes * unitsPerBoxValue)
          const unitCostValue = toNumber(item.unitCost ?? item.unit_cost ?? 0)
          const subtotalValue = toNumber(item.subtotal ?? unitCostValue * totalUnits)

          const productData = item.product ?? item.productInfo ?? null
          const laboratoryData = item.laboratory ?? item.laboratoryInfo ?? null
          const responsibleData = item.responsible ?? null

          return {
            id: item.id ?? item.id_input ?? item.idInput ?? Math.random(),
            productName:
              productData?.name ?? item.product_name ?? item.productName ?? 'Producto',
            brandName:
              productData?.brandName ?? productData?.brand?.name ?? item.brand_name ?? null,
            typeName:
              productData?.typeName ?? productData?.type?.name ?? item.type_name ?? null,
            laboratoryName:
              laboratoryData?.name ?? item.laboratory_name ?? item.laboratoryName ?? 'Sin laboratorio',
            laboratoryId:
              laboratoryData?.id ?? laboratoryData?.id_laboratory ?? item.laboratoryId ?? null,
            responsible: responsibleData
              ? {
                  name: responsibleData.name ?? 'Responsable',
                  type: responsibleData.type ?? 'laboratory',
                }
              : null,
            boxes,
            unitsPerBox: unitsPerBoxValue,
            totalUnits,
            unitCost: unitCostValue,
            subtotal: subtotalValue,
            isAdjustment: Boolean(item.isAdjustment ?? item.is_adjustment ?? false),
            reason: item.reason ?? '',
            createdAt: item.createdAt ?? item.created_at ?? null,
          }
        })

      setItems(mapped)

      const summaryRaw = response?.summary ?? defaultSummary
      const nextSummary = {
        period: {
          startDate: summaryRaw?.period?.startDate ?? (filters.startDate || null),
          endDate: summaryRaw?.period?.endDate ?? (filters.endDate || null),
        },
        entries: {
          count: toNumber(summaryRaw?.entries?.count ?? summaryRaw?.entriesCount ?? 0),
          totalBoxes: toNumber(summaryRaw?.entries?.totalBoxes ?? summaryRaw?.entriesBoxes ?? 0),
          totalUnits: toNumber(summaryRaw?.entries?.totalUnits ?? summaryRaw?.entriesQuantity ?? 0),
          totalSubtotal: toNumber(summaryRaw?.entries?.totalSubtotal ?? summaryRaw?.entriesSubtotal ?? 0),
        },
        outputs: {
          count: toNumber(summaryRaw?.outputs?.count ?? summaryRaw?.outputsCount ?? 0),
          totalQuantity: toNumber(summaryRaw?.outputs?.totalQuantity ?? summaryRaw?.outputsQuantity ?? 0),
          totalSubtotal: toNumber(summaryRaw?.outputs?.totalSubtotal ?? summaryRaw?.outputsSubtotal ?? 0),
        },
      }
      setSummary(nextSummary)
    } catch (error) {
      console.error('[Entries] fetch error', error)
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
        const [laboratoriesResp, productsResp] = await Promise.all([
          laboratoriesApi.list(),
          productsApi.list(),
        ])
        if (!active) return

        const labs = normaliseArray(laboratoriesResp)
        setLaboratories(labs)
        if (labs.length > 0 && !selectedLab) {
          setSelectedLab(String(labs[0]?.id_laboratory ?? labs[0]?.id ?? ''))
        }

        setProducts(normaliseArray(productsResp))
      } catch (error) {
        console.error('[Entries] options load error', error)
        if (!active) return
        setLaboratories([])
        setProducts([])
      }
    }

    loadOptions()
    return () => {
      active = false
    }
  }, [selectedLab])

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
    if (!unitsPerBox || unitsPerBox <= 0) {
      showError('Validación', 'Las unidades por caja deben ser mayores a 0')
      return
    }

    setFormLoading(true)
    showLoading()

    try {
      const subtotalCalc = Number(unitCost) * Number(quantity) * Number(unitsPerBox)
      await inventoryApi.createEntry({
        idProduct: Number(selectedProduct),
        idLaboratory: Number(selectedLab),
        quantity,
        unitsPerBox,
        unitCost,
        subtotal: subtotalCalc,
        isAdjustment: false,
        reason,
      })
      closeLoading()
      setShowForm(false)
      setProductQuery('')
      setSelectedProduct('')
      setQuantity(1)
      setUnitsPerBox(1)
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

  const filteredProducts = useMemo(() => {
    return products
      .filter((p: any) => p.name?.toLowerCase()?.includes(productQuery.toLowerCase()))
      .slice(0, 50)
  }, [products, productQuery])

  const selectedProductData = useMemo(() => {
    return products.find((p: any) => String(p.id_product ?? p.id) === selectedProduct)
  }, [products, selectedProduct])

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
      filters.isAdjustment !== 'all'
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

  const laboratoryOptions = useMemo(() => {
    return laboratories.map((lab: any) => ({
      id: String(lab.id_laboratory ?? lab.id ?? ''),
      name: lab.name ?? 'Laboratorio',
    }))
  }, [laboratories])

  const netUnits = summary.entries.totalUnits - summary.outputs.totalQuantity
  const netSubtotal = summary.entries.totalSubtotal - summary.outputs.totalSubtotal

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" />
            Entradas de inventario
          </h1>
          <p className="text-muted-foreground mt-1">
            Consulta compras, devoluciones y ajustes de inventario
          </p>
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
          <Button onClick={() => setShowForm(true)} size="lg" className="gap-2">
            <Plus className="w-4 h-4" />
            Registrar entrada
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Periodo analizado: {periodLabel}</p>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Entradas</p>
              <h3 className="text-xl font-semibold">{summary.entries.totalUnits} unidades</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {summary.entries.count} movimientos · {summary.entries.totalBoxes} cajas
              </p>
            </div>
            <ArrowDownCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-emerald-600 mt-3">
            {formatCurrency(summary.entries.totalSubtotal)} invertidos
          </p>
        </Card>

        <Card className="border-border/70 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Salidas</p>
              <h3 className="text-xl font-semibold">{summary.outputs.totalQuantity} unidades</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {summary.outputs.count} movimientos registrados
              </p>
            </div>
            <ArrowUpCircle className="w-10 h-10 text-rose-500" />
          </div>
          <p className="text-sm font-medium text-rose-600 mt-3">
            {formatCurrency(summary.outputs.totalSubtotal)} comprometidos
          </p>
        </Card>

        <Card className="border-border/70 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Balance</p>
              <h3 className={`text-xl font-semibold ${netUnits >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netUnits >= 0 ? '+' : ''}{netUnits} unidades
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Comparativo entradas - salidas</p>
            </div>
            <Scale className="w-10 h-10 text-primary" />
          </div>
          <p className={`text-sm font-medium mt-3 ${netSubtotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netSubtotal >= 0 ? '+' : ''}{formatCurrency(netSubtotal)}
          </p>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <div className="border-b border-border/60 bg-muted/30 px-6 py-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtros
          </h2>
        </div>
        <div className="px-6 py-4 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-2">
            <Label>Fecha inicio</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) => handleFilterChange({ startDate: event.target.value })}
              max={filters.endDate || undefined}
              disabled={loading}
            />
          </div>
          <div className="lg:col-span-2 space-y-2">
            <Label>Fecha fin</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(event) => handleFilterChange({ endDate: event.target.value })}
              min={filters.startDate || undefined}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de movimiento</Label>
            <Select
              value={filters.isAdjustment}
              onValueChange={(value) => handleFilterChange({ isAdjustment: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="standard">Compras / devoluciones</SelectItem>
                <SelectItem value="adjustments">Ajustes de inventario</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Producto</Label>
            <Select
              value={filters.productId}
              onValueChange={(value) => handleFilterChange({ productId: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {productOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Laboratorio</Label>
            <Select
              value={filters.laboratoryId}
              onValueChange={(value) => handleFilterChange({ laboratoryId: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {laboratoryOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <div className="border-b border-border/60 bg-muted/30 px-6 py-4">
          <h2 className="text-lg font-semibold">Historial de entradas</h2>
          <p className="text-sm text-muted-foreground">{items.length} registros encontrados</p>
        </div>
        <div className="px-4 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Cargando entradas...
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              No hay movimientos en el rango seleccionado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Laboratorio</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead className="text-right">Cajas</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Costo unitario</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((entry) => (
                    <TableRow key={entry.id} className={entry.isAdjustment ? 'bg-amber-50/70' : ''}>
                      <TableCell>
                        <div className="font-medium">{entry.productName}</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {entry.typeName && (
                            <Badge variant="outline" className="text-xs">{entry.typeName}</Badge>
                          )}
                          {entry.brandName && (
                            <Badge variant="secondary" className="text-xs">{entry.brandName}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.laboratoryName}</Badge>
                      </TableCell>
                      <TableCell>
                        {entry.responsible ? (
                          <div className="flex flex-col text-sm">
                            <span className="font-medium">{entry.responsible.name}</span>
                            <span className="text-muted-foreground text-xs">
                              {entry.isAdjustment ? 'Ajuste interno' : 'Proveedor asignado'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sin responsable</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{entry.boxes}</TableCell>
                      <TableCell className="text-right">{entry.totalUnits}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.unitCost)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(entry.subtotal)}
                      </TableCell>
                      <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                      <TableCell>
                        {entry.reason ? (
                          <span className="text-xs text-muted-foreground">{entry.reason}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar entrada de producto</DialogTitle>
            <DialogDescription>Completa los datos para registrar una nueva entrada</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Laboratorio</Label>
              <Select value={selectedLab} onValueChange={setSelectedLab}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un laboratorio" />
                </SelectTrigger>
                <SelectContent>
                  {laboratoryOptions.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>
                      {lab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label htmlFor="product-search">Producto</Label>
              <Input
                id="product-search"
                placeholder="Buscar producto..."
                value={productQuery}
                onChange={(event) => setProductQuery(event.target.value)}
                disabled={formLoading}
              />
              {productQuery && filteredProducts.length > 0 && (
                <div className="border border-border rounded-lg max-h-48 overflow-auto bg-background/95">
                  {filteredProducts.map((prod: any) => (
                    <button
                      type="button"
                      key={prod.id_product ?? prod.id}
                      onClick={() => {
                        setSelectedProduct(String(prod.id_product ?? prod.id))
                        setUnitCost(Number(prod.price ?? 0))
                        setProductQuery('')
                      }}
                      className={`w-full text-left p-3 border-b transition ${
                        String(prod.id_product ?? prod.id) === selectedProduct
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div>{prod.name}</div>
                          <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                            {prod.productType?.name && (
                              <Badge variant="outline" className="text-xs">{prod.productType?.name}</Badge>
                            )}
                            {prod.brand?.name && (
                              <Badge variant="secondary" className="text-xs">{prod.brand?.name}</Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">Stock: {prod.stock ?? 0}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedProductData && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                  <div className="font-medium text-primary">✓ {selectedProductData.name}</div>
                  <div className="text-muted-foreground text-xs mt-1 flex gap-2">
                    {selectedProductData.productType?.name && (
                      <Badge variant="outline" className="text-xs">{selectedProductData.productType?.name}</Badge>
                    )}
                    {selectedProductData.brand?.name && (
                      <Badge variant="secondary" className="text-xs">{selectedProductData.brand?.name}</Badge>
                    )}
                    <span className="ml-auto">Stock actual: {selectedProductData.stock ?? 0}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qty">Cantidad de cajas</Label>
                <Input
                  id="qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value) || 1)}
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="units">Unidades por caja</Label>
                <Input
                  id="units"
                  type="number"
                  min={1}
                  value={unitsPerBox}
                  onChange={(event) => setUnitsPerBox(Number(event.target.value) || 1)}
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Costo por unidad</Label>
                <Input
                  id="cost"
                  type="number"
                  min={0}
                  step={0.01}
                  value={unitCost}
                  onChange={(event) => setUnitCost(Number(event.target.value) || 0)}
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Razón (opcional)</Label>
              <Input
                id="reason"
                placeholder="Ej: Compra a proveedor, devolución, ajuste"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={formLoading}
              />
            </div>

            <div className="p-3 bg-muted/40 border border-border/60 rounded-md">
              <div className="text-xs text-muted-foreground uppercase">Resumen</div>
              <div className="text-lg font-semibold text-primary">
                {formatCurrency(quantity * unitsPerBox * unitCost)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total unidades: {quantity * unitsPerBox}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={formLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={formLoading || !selectedProduct}>
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
