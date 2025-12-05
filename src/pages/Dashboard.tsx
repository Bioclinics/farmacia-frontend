import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { salesApi } from '../services/api/sales'
import { productsApi } from '../services/api/products'
import { inventoryApi } from '../services/api/inventory'
import { Loader2 } from 'lucide-react'

const sparklinePath = (values: number[], w = 120, h = 32) => {
  if (!values || values.length === 0) return ''
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * w
      const y = h - ((v - min) / range) * h
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const [sResp, pResp, eResp] = await Promise.all([
          salesApi.list(),
          productsApi.list(),
          inventoryApi.entries(),
        ])
        const sArr = Array.isArray(sResp) ? sResp : (sResp?.data || sResp?.items || [])
        const pArr = Array.isArray(pResp) ? pResp : (pResp?.data || pResp?.items || [])
        const eArr = Array.isArray(eResp) ? eResp : (eResp?.productInputs || eResp?.items || [])
        if (!mounted) return
        setSales(sArr)
        setProducts(pArr)
        setEntries(eArr)
      } catch (err) {
        console.error('[Dashboard] load error', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const totalSales = sales.length
  const totalProducts = products.length
  const totalEntries = entries.length

  // low stock count
  const lowStock = useMemo(() => {
    return products.filter(p => Number(p.stock ?? p.quantity ?? 0) <= 5).length
  }, [products])

  // sales per day sparkline (last 10 days)
  const sparkData = useMemo(() => {
    const last10: number[] = []
    if (!sales || sales.length === 0) return last10
    // group by date (day)
    const map = new Map<string, number>()
    sales.forEach(s => {
      const d = new Date(s.createdAt || s.date || s.created_at || Date.now())
      const key = d.toISOString().slice(0,10)
      map.set(key, (map.get(key) || 0) + 1)
    })
    const keys = Array.from(map.keys()).sort()
    keys.slice(-10).forEach(k => last10.push(map.get(k) || 0))
    // pad if less than 10
    while (last10.length < 10) last10.unshift(0)
    return last10
  }, [sales])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel — Estadísticas</h1>
          <p className="text-muted-foreground mt-1">Resumen rápido de ventas, inventario y actividad reciente</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-primary hover:bg-secondary text-white">Exportar reporte</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary animate-scale-in">
          <CardHeader>
            <CardTitle>Total Ventas</CardTitle>
            <CardDescription>Transacciones registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{totalSales}</div>
                <div className="text-sm text-muted-foreground">Ventas totales</div>
              </div>
              <svg width="120" height="40" className="block">
                <path d={sparklinePath(sparkData, 120, 40)} fill="none" stroke="#ffffff" strokeOpacity={0.15} strokeWidth={6} strokeLinecap="round" />
                <path d={sparklinePath(sparkData, 120, 40)} fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary animate-scale-in">
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <CardDescription>Items en catálogo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{totalProducts}</div>
                <div className="text-sm text-muted-foreground">Productos registrados</div>
              </div>
              <div className="text-right">
                <div className="text-sm">Bajo stock</div>
                <div className="text-xl font-semibold text-destructive">{lowStock}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-tertiary animate-scale-in">
          <CardHeader>
            <CardTitle>Entradas</CardTitle>
            <CardDescription>Movimientos recientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{totalEntries}</div>
                <div className="text-sm text-muted-foreground">Entradas registradas</div>
              </div>
              <div>
                <Badge variant="outline">Últimas 24h</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Actividad de Ventas (últimos 10 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-28">
              <svg width="100%" height="100%" viewBox={`0 0 120 40`} preserveAspectRatio="none">
                <path d={sparklinePath(sparkData, 120, 40)} fill="none" stroke="#2e4999" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">Total ventas en periodo: <span className="font-medium">{sparkData.reduce((a,b)=>a+b,0)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top categorías (simulado)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Simple bar chart from product types if present, otherwise simulate */}
            <div className="space-y-2 mt-2">
              {[...Array(4)].map((_,i) => {
                const val = Math.floor((i+1) * 12 + (products.length % 5) * 3)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-muted-foreground">Tipo {i+1}</div>
                    <div className="flex-1 bg-border rounded overflow-hidden h-3">
                      <div className="h-3 bg-primary transition-width" style={{ width: `${Math.min(100, val)}%` }} />
                    </div>
                    <div className="w-12 text-right text-sm">{val}%</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-primary text-white">Crear producto</Button>
            <Button className="w-full bg-secondary text-white">Registrar entrada</Button>
            <Button className="w-full border border-border">Ver reportes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
