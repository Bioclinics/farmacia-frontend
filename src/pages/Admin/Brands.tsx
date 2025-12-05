import React, { useEffect, useState } from 'react'
import { brandsApi } from '../../services/api/products'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { confirmDelete, showError, showSuccess } from '../../lib/sweet-alert'
import { Edit2, Plus, Tags, Trash2 } from 'lucide-react'

interface BrandItem {
  id_brand?: number
  id?: number
  name: string
}

const Brands: React.FC = () => {
  const [items, setItems] = useState<BrandItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BrandItem | null>(null)
  const [name, setName] = useState('')

  const loadBrands = async () => {
    setLoading(true)
    try {
      const data = await brandsApi.list()
      const collection = Array.isArray(data) ? data : data.items || []
      setItems(collection)
    } catch (error) {
      console.error(error)
      setItems([])
      showError('Error', 'No se pudieron cargar las marcas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBrands()
  }, [])

  const openNew = () => {
    setEditing(null)
    setName('')
    setShowForm(true)
  }

  const openEdit = (brand: BrandItem) => {
    setEditing(brand)
    setName(brand.name || '')
    setShowForm(true)
  }

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      showError('Campo requerido', 'El nombre es obligatorio')
      return
    }

    try {
      if (editing) {
        const id = editing.id_brand ?? editing.id
        await brandsApi.update(id!, { name: trimmed })
        showSuccess('Marca actualizada')
      } else {
        await brandsApi.create({ name: trimmed })
        showSuccess('Marca creada')
      }
      setShowForm(false)
      loadBrands()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Error guardando la marca'
      showError('Error', message)
    }
  }

  const handleDelete = async (brand: BrandItem) => {
    const result = await confirmDelete('¿Eliminar marca?')
    if (!result.isConfirmed) return

    try {
      const id = brand.id_brand ?? brand.id
      await brandsApi.remove(id!)
      showSuccess('Marca eliminada')
      loadBrands()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Error eliminando la marca'
      showError('Error', message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Tags className="w-7 h-7 text-primary" />
            Marcas
          </h1>
          <p className="text-muted-foreground mt-1">Administra las marcas disponibles para vincular a los productos</p>
        </div>
        <Button onClick={openNew} size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva marca
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
                    No hay marcas registradas
                  </TableCell>
                </TableRow>
              ) : (
                items.map(brand => (
                  <TableRow key={brand.id_brand ?? brand.id}>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(brand)}
                          className="gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(brand)}
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar marca' : 'Nueva marca'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ej: Marca Genérica"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="bg-primary">
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Brands
