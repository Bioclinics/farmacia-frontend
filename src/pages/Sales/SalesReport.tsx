import React, { useEffect, useMemo, useState } from 'react'
import { salesApi } from '../../services/api/sales'
import { usersApi } from '../../services/api/users'
import { productsApi } from '../../services/api/products'
import { productOutputsApi } from '../../services/api/productOutputs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Eye, BarChart3, CalendarDays, Filter, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react'

const formatDateInput = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getTodayString = (): string => formatDateInput(new Date())

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
  if (payload?.rows && Array.isArray(payload.rows)) return payload.rows
  return []
}

const parseDate = (input: any): Date | null => {
  if (input === null || typeof input === 'undefined') return null
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input
  }
  if (typeof input === 'number') {
    const normalized = String(input).length === 10 ? input * 1000 : input
    const date = new Date(normalized)
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (!trimmed) return null
    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed)
      const normalized = trimmed.length === 10 ? numeric * 1000 : numeric
      const date = new Date(normalized)
      return Number.isNaN(date.getTime()) ? null : date
    }
    const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T')
    const date = new Date(normalized)
    if (!Number.isNaN(date.getTime())) return date
    const fallback = new Date(trimmed)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  return null
}

const formatDateTime = (input: any): string => {
  const date = parseDate(input)
  if (!date) return '-'
  return date
    .toLocaleString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(',', '')
}

const formatCurrency = (value: number): string =>
  `Bs ${toNumber(value).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatShortDate = (value: string): string => {
  const date = parseDate(value)
  if (!date) return value
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatMonthLabel = (value: string): string => {
  const date = parseDate(value)
  if (!date) return value
  return date.toLocaleDateString('es-BO', {
    month: 'long',
    year: 'numeric',
  })
}

const deriveMonthStart = (value: string): string => {
  const base = parseDate(value) ?? new Date()
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1))
  return formatDateInput(start)
}

const deriveMonthEnd = (value: string): string => {
  const base = parseDate(value) ?? new Date()
  const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0))
  return formatDateInput(end)
}

const INITIAL_LIMIT = 15

type ReportProductItem = {
  idOutput: number
  productId: number
  productName: string
  brandName?: string | null
  typeName?: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

type ReportSaleUser = {
  id: number
  name: string
  username: string
  roleName?: string
}

type ReportSale = {
  id: number
  total: number
  createdAt: any
  notes: string | null
  user: ReportSaleUser | null
  items: ReportProductItem[]
}

type ReportSummary = {
  dayTotal: number
  monthTotal: number
  totalCount: number
  targetDate: string
  monthStart: string
  monthEnd: string
  daySales?: ReportSale[]
}

type ReportState = {
  summary: ReportSummary
  data: ReportSale[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

const mapProductItemFromResponse = (item: any): ReportProductItem => ({
  idOutput: Number(item?.idOutput ?? item?.id_output ?? item?.id ?? 0),
  productId: Number(item?.productId ?? item?.id_product ?? item?.productId ?? 0),
  productName: item?.productName ?? item?.product_name ?? item?.name ?? 'Producto',
  brandName: item?.brandName ?? item?.brand_name ?? item?.brand ?? null,
  typeName: item?.typeName ?? item?.type_name ?? item?.type ?? null,
  quantity: Number(item?.quantity ?? 0),
  unitPrice: toNumber(item?.unitPrice ?? item?.unit_price ?? 0),
  subtotal: toNumber(item?.subtotal ?? 0),
})

const mapSaleFromResponse = (sale: any): ReportSale => {
  if (!sale) {
    return {
      id: 0,
      total: 0,
      createdAt: null,
      notes: null,
      user: null,
      items: [],
    }
  }

  const userData = sale.user ?? null
  const fallbackUser = sale.userName
    ? {
        id: Number(sale.userId ?? 0),
        name: sale.userName,
        username: sale.userUsername ?? '',
        roleName: sale.userRole ?? undefined,
      }
    : null

  const user: ReportSaleUser | null = userData
    ? {
        id: Number(userData.id ?? userData.id_user ?? userData.userId ?? 0),
        name: userData.name ?? userData.userName ?? '',
        username: userData.username ?? userData.userUsername ?? '',
        roleName: userData.role?.name ?? userData.roleName ?? undefined,
      }
    : fallbackUser

  const rawItems = Array.isArray(sale.items)
    ? sale.items
    : Array.isArray(sale.products)
    ? sale.products
    : Array.isArray(sale.outputs)
    ? sale.outputs
    : []

  const items: ReportProductItem[] = rawItems.map(mapProductItemFromResponse)

  return {
    id: Number(sale.id ?? sale.id_sale ?? sale.saleId ?? 0),
    total: toNumber(sale.total ?? sale.amount ?? sale.sum ?? 0),
    createdAt: sale.createdAt ?? sale.created_at ?? sale.date ?? null,
    notes: sale.notes ?? null,
    user,
    items,
  }
}

const SalesReport: React.FC = () => {
  const [filters, setFilters] = useState({
    summaryDate: getTodayString(),
    startDate: '',
    endDate: '',
    userId: 'all',
    productId: 'all',
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(INITIAL_LIMIT)
  const [report, setReport] = useState<ReportState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [selectedSale, setSelectedSale] = useState<ReportSale | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [daySalesOpen, setDaySalesOpen] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const { summaryDate, startDate, endDate, userId, productId } = filters

  useEffect(() => {
    let active = true
    const loadOptions = async () => {
      try {
        const [usersResp, productsResp] = await Promise.all([
          usersApi.list(),
          productsApi.list(),
        ])
        if (!active) return
        setUsers(normaliseArray(usersResp))
        setProducts(normaliseArray(productsResp))
      } catch {
        if (!active) return
        setUsers([])
        setProducts([])
      }
    }
    loadOptions()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    const fetchReport = async () => {
      setLoading(true)
      setError(null)
      try {
        const params: any = { page, limit }
        if (summaryDate) params.targetDate = summaryDate
        if (startDate) params.startDate = startDate
        if (endDate) params.endDate = endDate
        if (userId !== 'all') params.userId = userId
        if (productId !== 'all') params.productId = productId

        const response = await salesApi.report(params)
        if (!active) return

        const summaryRaw = response?.summary ?? {}
        const dataRaw = Array.isArray(response?.data)
          ? response.data
          : normaliseArray(response?.data ?? response)
        const paginationRaw = response?.pagination ?? {}

        const mappedData: ReportSale[] = dataRaw.map(mapSaleFromResponse)

        const summaryTarget = summaryRaw.targetDate ?? (summaryDate || getTodayString())
        const summary: ReportSummary = {
          dayTotal: toNumber(summaryRaw.dayTotal ?? 0),
          monthTotal: toNumber(summaryRaw.monthTotal ?? 0),
          totalCount: Number(summaryRaw.totalCount ?? paginationRaw.total ?? mappedData.length ?? 0),
          targetDate: summaryTarget,
          monthStart: summaryRaw.monthStart ?? deriveMonthStart(summaryTarget),
          monthEnd: summaryRaw.monthEnd ?? deriveMonthEnd(summaryTarget),
        }

        // Map server-provided daySales into frontend shape if present
        const daySalesRaw = summaryRaw.daySales ?? []
        const daySalesMapped: ReportSale[] = Array.isArray(daySalesRaw)
          ? daySalesRaw.map(mapSaleFromResponse)
          : []

        // attach daySalesMapped into summary object for UI use
        summary.daySales = daySalesMapped

        const pagination = {
          page: Number(paginationRaw.page ?? page),
          limit: Number(paginationRaw.limit ?? limit),
          total: Number(paginationRaw.total ?? mappedData.length ?? 0),
        }

        setReport({ summary, data: mappedData, pagination })

        if (pagination.page !== page) {
          setPage(pagination.page)
        }
        if (pagination.limit !== limit) {
          setLimit(pagination.limit)
        }
      } catch (err: any) {
        if (!active) return
        console.error('[SalesReport] fetch error', err)
        setError(err?.response?.data?.message ?? 'No se pudo cargar el reporte de ventas.')
        const fallbackDate = summaryDate || getTodayString()
        setReport({
          summary: {
            dayTotal: 0,
            monthTotal: 0,
            totalCount: 0,
            targetDate: fallbackDate,
            monthStart: deriveMonthStart(fallbackDate),
            monthEnd: deriveMonthEnd(fallbackDate),
            daySales: [],
          },
          data: [],
          pagination: { page: 1, limit, total: 0 },
        })
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchReport()
    return () => {
      active = false
    }
  }, [summaryDate, startDate, endDate, userId, productId, page, limit, reloadToken])

  useEffect(() => {
    if (!selectedSale || !report?.data) return
    if (selectedSale.items.length > 0) return
    const updated = report.data.find(item => item.id === selectedSale.id)
    if (updated && updated !== selectedSale && updated.items.length > 0) {
      setSelectedSale(updated)
    }
  }, [report, selectedSale])

  useEffect(() => {
    if (!selectedSale) return
    if (selectedSale.items.length > 0) return

    let ignore = false
    const fetchDetail = async () => {
      try {
        setDetailLoading(true)
        const outputsResponse = await productOutputsApi.findBySale(selectedSale.id)
        if (ignore) return

        const mappedItems: ReportProductItem[] = normaliseArray(outputsResponse).map(mapProductItemFromResponse)

        setReport(prev => {
          if (!prev) return prev

          const updatedData = prev.data.map(item =>
            item.id === selectedSale.id ? { ...item, items: mappedItems } : item,
          )

          const summaryDaySales = prev.summary.daySales ?? []
          const daySalesUpdated = summaryDaySales.map(item =>
            item.id === selectedSale.id ? { ...item, items: mappedItems } : item,
          )

          return {
            summary: {
              ...prev.summary,
              daySales: daySalesUpdated,
            },
            data: updatedData,
            pagination: prev.pagination,
          }
        })

        setSelectedSale(current =>
          current && current.id === selectedSale.id ? { ...current, items: mappedItems } : current,
        )
      } catch (detailError) {
        console.error('[SalesReport] detail fetch error', detailError)
      } finally {
        if (!ignore) setDetailLoading(false)
      }
    }

    fetchDetail()
    return () => {
      ignore = true
    }
  }, [selectedSale])

  const userOptions = useMemo(() => {
    return users
      .filter((user: any) => !(user.isDeleted ?? user.is_deleted))
      .map((user: any) => ({
        id: String(user.id ?? user.id_user ?? user.userId ?? ''),
        label: user.name ?? user.username ?? 'Sin nombre',
      }))
  }, [users])

  const productOptions = useMemo(() => {
    return products.map((product: any) => ({
      id: String(product.id_product ?? product.id ?? ''),
      name: product.name ?? 'Producto',
      brand: product.brand?.name ?? product.brandName ?? null,
      type: product.productType?.name ?? product.typeName ?? null,
    }))
  }, [products])

  const summary = report?.summary ?? {
    dayTotal: 0,
    monthTotal: 0,
    totalCount: 0,
    targetDate: summaryDate || getTodayString(),
    monthStart: deriveMonthStart(summaryDate || getTodayString()),
    monthEnd: deriveMonthEnd(summaryDate || getTodayString()),
    daySales: [],
  }

  const daySales = summary.daySales ?? []

  const totalPages = useMemo(() => {
    if (!report) return 1
    const perPage = report.pagination.limit || limit
    if (perPage <= 0) return 1
    return Math.max(1, Math.ceil(report.pagination.total / perPage))
  }, [report, limit])

  const totalItems = report?.pagination.total ?? report?.data.length ?? 0
  const hasActiveFilters = userId !== 'all' || productId !== 'all' || !!startDate || !!endDate

  const updateFilters = (changes: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...changes }))
    setPage(1)
  }

  const handleLimitChange = (value: string) => {
    const parsed = Number(value)
    if (Number.isNaN(parsed) || parsed <= 0) return
    setLimit(parsed)
    setPage(1)
  }

  const handlePrevPage = () => {
    setPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setPage(prev => Math.min(totalPages, prev + 1))
  }

  const handleRefresh = () => setReloadToken(prev => prev + 1)

  const handleClearFilters = () => {
    const today = getTodayString()
    setFilters({
      summaryDate: today,
      startDate: '',
      endDate: '',
      userId: 'all',
      productId: 'all',
    })
    setPage(1)
    setLimit(INITIAL_LIMIT)
    setReloadToken(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporte de ventas</h1>
          <p className="text-muted-foreground mt-1">
            Analiza el desempeño de tus ventas y filtra por usuario, producto o fecha.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={loading}>
            <RefreshCcw className="w-4 h-4" />
            Actualizar
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleClearFilters}
            disabled={loading && !hasActiveFilters}
          >
            <Filter className="w-4 h-4" />
            Limpiar filtros
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total vendido (día)</CardTitle>
              <CardDescription>{formatShortDate(summary.targetDate)}</CardDescription>
            </div>
            <CalendarDays className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(summary.dayTotal)}</div>
              <p className="text-xs text-muted-foreground mt-1">Sumatoria del día seleccionado.</p>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => setDaySalesOpen(true)}>
                  Ver ventas del día
                </Button>
              </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total vendido (mes)</CardTitle>
              <CardDescription>{formatMonthLabel(summary.monthStart)}</CardDescription>
            </div>
            <BarChart3 className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(summary.monthTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Del {formatShortDate(summary.monthStart)} al {formatShortDate(summary.monthEnd)}.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">Ventas registradas</CardTitle>
              <CardDescription>Coincidentes con filtros</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {summary.monthStart.slice(0, 7)}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{summary.totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Incluye filtros aplicados.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Filtros</CardTitle>
          <CardDescription>Combina filtros para analizar tus ventas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="summary-date">Resumen del día</Label>
              <Input
                id="summary-date"
                type="date"
                value={summaryDate}
                max={getTodayString()}
                onChange={(event) => updateFilters({ summaryDate: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="start-date">Desde</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => updateFilters({ startDate: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="end-date">Hasta</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => updateFilters({ endDate: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Usuario</Label>
              <Select value={userId} onValueChange={(value) => updateFilters({ userId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {userOptions.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Producto</Label>
              <Select value={productId} onValueChange={(value) => updateFilters({ productId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los productos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  {productOptions.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex flex-col gap-1">
                        <span>{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {[product.brand, product.type].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="border border-border/70">
        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Ventas registradas</CardTitle>
            <CardDescription>Muestra resultados paginados.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="per-page" className="text-xs text-muted-foreground">
              Por página
            </Label>
            <Select value={String(limit)} onValueChange={handleLimitChange}>
              <SelectTrigger id="per-page" className="h-8 w-[80px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 15, 20, 30, 50].map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-primary/40 border-t-primary" />
              <p className="text-sm text-muted-foreground">Cargando reporte...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead># Venta</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!report || report.data.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        No se encontraron ventas con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.data.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-semibold">#{sale.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-foreground">{sale.user?.name ?? 'Sin usuario'}</span>
                            {sale.user?.username && (
                              <span className="text-xs text-muted-foreground">@{sale.user.username}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(sale.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {sale.items.slice(0, 3).map((item) => (
                              <Badge key={`${sale.id}-${item.idOutput}`} variant="secondary" className="text-xs">
                                {item.productName}
                              </Badge>
                            ))}
                            {sale.items.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{sale.items.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(sale.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setSelectedSale(sale)}
                          >
                            <Eye className="w-4 h-4" />
                            Ver detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex flex-col gap-3 border-t border-border/70 p-4 lg:flex-row lg:items-center lg:justify-between">
                <span className="text-xs text-muted-foreground">
                  Página {report?.pagination.page ?? page} de {totalPages} · {totalItems} venta(s)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={handlePrevPage}
                    disabled={(report?.pagination.page ?? page) <= 1 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={handleNextPage}
                    disabled={(report?.pagination.page ?? page) >= totalPages || loading}
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedSale} onOpenChange={(open) => { if (!open) setSelectedSale(null) }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Venta #{selectedSale?.id ?? ''}</DialogTitle>
            <CardDescription>{formatDateTime(selectedSale?.createdAt)}</CardDescription>
          </DialogHeader>
          {selectedSale ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
                <div>
                  <p className="font-medium">Registrado por</p>
                  <p className="text-muted-foreground">
                    {selectedSale.user?.name ?? 'Sin usuario'}
                    {selectedSale.user?.username ? ` · @${selectedSale.user.username}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-base font-semibold text-primary">{formatCurrency(selectedSale.total)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Productos</h4>
                <div className="divide-y rounded-lg border border-border/60">
                  {detailLoading ? (
                    <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
                      Cargando detalle de la venta...
                    </div>
                  ) : selectedSale.items.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Esta venta no tiene productos asociados.
                    </div>
                  ) : (
                    selectedSale.items.map((item) => (
                      <div key={`${selectedSale.id}-${item.idOutput}`} className="flex items-start justify-between gap-4 p-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-foreground">{item.productName}</span>
                          <div className="flex flex-wrap gap-1">
                            {item.brandName && (
                              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                                {item.brandName}
                              </Badge>
                            )}
                            {item.typeName && (
                              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                                {item.typeName}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                          </span>
                        </div>
                        <div className="text-right text-sm font-semibold text-primary">
                          {formatCurrency(item.subtotal)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {selectedSale.notes && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
                  Nota: {selectedSale.notes}
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSale(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={daySalesOpen} onOpenChange={setDaySalesOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Ventas del {formatShortDate(summary.targetDate)}</DialogTitle>
            <CardDescription>{daySales.length} venta(s) registradas ese día.</CardDescription>
          </DialogHeader>
          <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
            {daySales.length === 0 ? (
              <div className="rounded-md border border-border/60 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                No se registraron ventas en la fecha seleccionada.
              </div>
            ) : (
              daySales.map((sale) => (
                <div
                  key={`day-${sale.id}`}
                  className="rounded-lg border border-border/60 bg-background p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Venta #{sale.id}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(sale.createdAt)}</p>
                    </div>
                    <div className="text-sm font-semibold text-primary">{formatCurrency(sale.total)}</div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {sale.items.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        La venta no tiene productos registrados.
                      </p>
                    ) : (
                      sale.items.map((item) => (
                        <div
                          key={`day-${sale.id}-${item.idOutput}`}
                          className="flex flex-col gap-1 rounded-md border border-border/40 bg-muted/30 p-3 text-xs text-foreground md:flex-row md:items-center md:justify-between"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.productName}</p>
                            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                              {item.brandName && (
                                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                                  {item.brandName}
                                </Badge>
                              )}
                              {item.typeName && (
                                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                                  {item.typeName}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right md:ml-4">
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} x {formatCurrency(item.unitPrice)}
                            </p>
                            <p className="text-sm font-semibold text-primary">{formatCurrency(item.subtotal)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      Registrado por {sale.user?.name ?? 'Sin usuario'}
                      {sale.user?.username ? ` · @${sale.user.username}` : ''}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setSelectedSale(sale)
                        setDaySalesOpen(false)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      Ver detalle
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDaySalesOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SalesReport
