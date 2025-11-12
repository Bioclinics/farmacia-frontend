import React, { useEffect, useState } from 'react'
import { productTypesApi } from '../../services/api/products'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { confirmDelete, showError, showToast, showSuccess } from '../../lib/sweet-alert'
import { Trash2, Edit2, Plus } from 'lucide-react'

const ProductTypes: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [name, setName] = useState<string>('')

  const fetch = async () => {
    setLoading(true)
    try {
      const data = await productTypesApi.list()
      const arr = Array.isArray(data) ? data : data.items || []
      setItems(arr)
    } catch (err) {
      console.error(err)
      setItems([])
      showError('Error', 'No se pudieron cargar los tipos de productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const openNew = () => {
    setEditing(null)
    setName('')
    setShowForm(true)
  }

  const openEdit = (item: any) => {
    setEditing(item)
    setName(item.name || '')
    setShowForm(true)
  }

  const submit = async () => {
    if (!name.trim()) {
      showError('Campo requerido', 'El nombre es obligatorio')
      return
    }
    try {
      if (editing) {
        const itemId = editing.id_type || editing.id_product_type || editing.id
        await productTypesApi.update(itemId, { name })
        showSuccess('Tipo de producto actualizado')
      } else {
        await productTypesApi.create({ name })
        showSuccess('Tipo de producto creado')
      }
      setShowForm(false)
      fetch()
    } catch (err: any) {
      showError('Error', err?.message || 'Error guardando tipo de producto')
    }
  }

  const onDelete = async (item: any) => {
    const result = await confirmDelete('¿Eliminar tipo de producto?')
    if (!result.isConfirmed) return

    try {
      const itemId = item.id_type || item.id_product_type || item.id
      await productTypesApi.remove(itemId)
      showSuccess('Tipo de producto eliminado')
      fetch()
    } catch (err: any) {
      showError('Error', err?.message || 'Error eliminando tipo de producto')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tipos de Productos</h1>
          <p className="text-muted-foreground mt-1">Administra los tipos de productos disponibles</p>
        </div>
        <Button onClick={openNew} size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo tipo
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
            <p className="mt-4 text-muted-foreground">Cargando...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                    No hay tipos de productos
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item: any) => (
                  <TableRow key={item.id_type || item.id_product_type || item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(item)}
                          className="gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(item)}
                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar tipo de producto' : 'Nuevo tipo de producto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ej: Antibióticos"
                onKeyPress={(e) => e.key === 'Enter' && submit()}
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
            <Button onClick={submit} className="bg-primary">
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductTypes
