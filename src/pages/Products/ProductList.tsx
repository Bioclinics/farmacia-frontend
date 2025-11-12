import React, { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { productsApi, productTypesApi } from '../../services/api/products'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { showError, showToast, confirmDelete, showLoading, closeLoading, showSuccess } from '../../lib/sweet-alert'
import { Package, Plus, Edit2, Trash2, CheckCircle2, XCircle, Loader2, Search } from 'lucide-react'

const ProductList: React.FC = () => {
	const [items, setItems] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [query, setQuery] = useState('')
	const [page, setPage] = useState(1)
	const [limit, setLimit] = useState(10)
	const [total, setTotal] = useState(0)
	const [pages, setPages] = useState(1)
	const [editing, setEditing] = useState<any | null>(null)
	const [showForm, setShowForm] = useState(false)
	const { user } = useContext(AuthContext)
	const isAdmin = user?.idRole === 2

	const fetchProducts = async (pageNum: number, limitNum: number, queryStr: string) => {
		try {
			setLoading(true)
			const params = { q: queryStr, page: pageNum, limit: limitNum }
			const data = await productsApi.list(params)

			const itemsData = data?.data || data?.items || data || []
			const totalItems = data?.total ?? (Array.isArray(itemsData) ? itemsData.length : 0)
			const pagesCount = limitNum > 0 ? Math.max(1, Math.ceil(totalItems / limitNum)) : 1

			setItems(Array.isArray(itemsData) ? itemsData : [])
			setTotal(totalItems)
			setPages(pagesCount)
		} catch (error) {
			showError('Error', 'No se pudo cargar los productos')
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchProducts(1, limit, '')
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// debounce for search
	useEffect(() => {
		const timer = setTimeout(() => {
			setPage(1)
			fetchProducts(1, limit, query)
		}, 450)
		return () => clearTimeout(timer)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query])

	useEffect(() => {
		fetchProducts(page, limit, query)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, limit])

	const toggleActive = async (p: any) => {
		try {
			const idProd = p.id_product ?? p.id
			const newState = !p.is_active
			const endpoint = newState ? `/products/${idProd}/activate` : `/products/${idProd}/deactivate`
			const url = `${import.meta.env.VITE_API_URL}${endpoint}`
			showLoading()
			const response = await window.fetch(url, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('bioclinics_token')}`,
					'Content-Type': 'application/json'
				}
			})
			if (!response.ok) {
				const data = await response.json()
				closeLoading()
				showError('Error', data.message || 'Error actualizando estado')
				return
			}
			closeLoading()
			showToast('success', newState ? 'Producto activado' : 'Producto desactivado')
			fetchProducts(page, limit, query)
		} catch (err: any) {
			closeLoading()
			showError('Error', err?.message || 'Error actualizando estado')
			console.error('[toggleActive] Error:', err)
		}
	}

	const onDelete = async (productId: any) => {
		const result = await confirmDelete('¿Eliminar producto?')
		if (!result.isConfirmed) return
		try {
			showLoading()
			await productsApi.remove(productId)
			closeLoading()
			showSuccess('Producto eliminado')
			fetchProducts(page, limit, query)
		} catch (err: any) {
			closeLoading()
			showError('Error', err?.message || 'Error eliminando producto')
			console.error('[onDelete] Error:', err)
		}
	}

	const openNew = () => {
		setEditing(null)
		setShowForm(true)
	}

	const openEdit = (p: any) => {
		setEditing(p)
		setShowForm(true)
	}

	const submitForm = async (payload: any) => {
		try {
			showLoading()
			if (editing) {
				const editId = editing.id_product ?? editing.id
				await productsApi.update(editId, payload)
				showSuccess('Producto actualizado')
			} else {
				await productsApi.create(payload)
				showSuccess('Producto creado')
			}
			closeLoading()
			setShowForm(false)
			fetchProducts(page, limit, query)
		} catch (err: any) {
			closeLoading()
			showError('Error', err?.message || 'Error guardando producto')
			console.error('[submitForm] Error:', err)
		}
	}

	return (
		<div className="space-y-6">
			<Card className="border-l-4 border-l-primary">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Package className="w-6 h-6 text-primary" />
							<div>
								<CardTitle>Productos</CardTitle>
								<CardDescription>Administra productos: buscar, paginar y acciones rápidas.</CardDescription>
							</div>
						</div>
						{isAdmin && (
							<Button onClick={openNew} className="gap-2">
								<Plus className="w-4 h-4" />
								Nuevo producto
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-2">
						<Search className="w-4 h-4 text-foreground/60" />
						<Input
							placeholder="Buscar por nombre, SKU..."
							value={query}
							onChange={e => setQuery(e.target.value)}
							className="max-w-sm"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Lista de Productos</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="border rounded-lg overflow-auto">
						<Table>
							<TableHeader>
								<TableRow className="bg-primary/5">
									<TableHead>Nombre</TableHead>
									<TableHead>Tipo</TableHead>
									<TableHead className="text-right">Precio</TableHead>
									<TableHead className="text-right">Stock</TableHead>
									<TableHead className="text-center">Estado</TableHead>
									<TableHead className="text-center">Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-8">
											<div className="flex items-center justify-center gap-2">
												<Loader2 className="w-4 h-4 animate-spin" />
												<span>Cargando productos...</span>
											</div>
										</TableCell>
									</TableRow>
								) : items.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-8 text-foreground/60">
											No se encontraron productos
										</TableCell>
									</TableRow>
								) : (
									items.map((p: any) => {
										const idProd = p.id_product ?? p.id
										const prodName = p.name || p.description || p.nombre || 'Sin nombre'
										const prodType = p.productType?.name ?? p.typeName ?? '-'
										const prodPrice = typeof p.price !== 'undefined' ? `$ ${Number(p.price).toFixed(2)}` : '-'
										const prodStock = p.stock ?? p.quantity ?? 0
										const isActive = p.is_active

										return (
											<TableRow key={idProd} className="hover:bg-primary/5">
												<TableCell>
													<div className="font-medium">{prodName}</div>
													{p.sku && <div className="text-xs text-foreground/60">SKU: {p.sku}</div>}
												</TableCell>
												<TableCell>{prodType}</TableCell>
												<TableCell className="text-right font-medium">{prodPrice}</TableCell>
												<TableCell className="text-right">
													<Badge variant={prodStock > 0 ? 'default' : 'destructive'}>
														{prodStock} unid.
													</Badge>
												</TableCell>
												<TableCell className="text-center">
													<Badge variant={isActive ? 'default' : 'secondary'}>
														{isActive ? <CheckCircle2 className="w-3 h-3 mr-1 inline" /> : <XCircle className="w-3 h-3 mr-1 inline" />}
														{isActive ? 'Activo' : 'Inactivo'}
													</Badge>
												</TableCell>
												<TableCell className="text-center">
													{isAdmin ? (
														<div className="flex items-center justify-center gap-2">
															<Button size="sm" variant="outline" onClick={() => openEdit(p)} title="Editar">
																<Edit2 className="w-4 h-4" />
															</Button>
															<Button size="sm" variant={isActive ? 'default' : 'secondary'} onClick={() => toggleActive(p)} title={isActive ? 'Desactivar' : 'Activar'}>
																{isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
															</Button>
															<Button size="sm" variant="destructive" onClick={() => onDelete(idProd)} title="Eliminar">
																<Trash2 className="w-4 h-4" />
															</Button>
														</div>
													) : (
														<span className="text-xs text-foreground/60">-</span>
													)}
												</TableCell>
											</TableRow>
										)
									})
								)}
							</TableBody>
						</Table>
					</div>

					<div className="mt-6 flex items-center justify-between">
						<div className="text-sm text-foreground/60">
							Total: <span className="font-medium">{total}</span> productos
						</div>
						<div className="flex items-center gap-3">
							<Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
								Anterior
							</Button>
							<div className="text-sm font-medium px-3 py-1 rounded-md bg-primary/10">
								{page} / {pages}
							</div>
							<Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
								Siguiente
							</Button>
							<Select value={String(limit)} onValueChange={val => { setLimit(Number(val)); setPage(1) }}>
								<SelectTrigger className="w-20">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="5">5</SelectItem>
									<SelectItem value="10">10</SelectItem>
									<SelectItem value="20">20</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			<Dialog open={showForm} onOpenChange={setShowForm}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{editing ? 'Editar producto' : 'Crear producto'}</DialogTitle>
						<DialogDescription>
							{editing ? 'Actualiza los datos del producto.' : 'Ingresa los datos del nuevo producto.'}
						</DialogDescription>
					</DialogHeader>
					<ProductForm initial={editing} onCancel={() => setShowForm(false)} onSave={submitForm} />
				</DialogContent>
			</Dialog>
		</div>
	)
}

interface ProductFormProps {
	initial?: any | null
	onCancel: () => void
	onSave: (payload: any) => void
}

const ProductForm: React.FC<ProductFormProps> = ({ initial, onCancel, onSave }) => {
	const [name, setName] = useState(initial?.name ?? '')
	const [price, setPrice] = useState(initial?.price ?? '')
	const [stock, setStock] = useState(initial?.stock ?? '')
	const [typeId, setTypeId] = useState(String(initial?.id_type ?? initial?.idType ?? ''))
	const [types, setTypes] = useState<any[]>([])
	const [typesLoading, setTypesLoading] = useState(false)
	const [formLoading, setFormLoading] = useState(false)

	useEffect(() => {
		setTypesLoading(true)
		productTypesApi.list()
			.then(d => {
				if (Array.isArray(d)) setTypes(d)
				else if (d?.data && Array.isArray(d.data)) setTypes(d.data)
				else setTypes([])
			})
			.catch(err => {
				showError('Error', 'No se pudieron cargar los tipos de producto')
				console.error(err)
			})
			.finally(() => setTypesLoading(false))
	}, [])

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!name.trim()) {
			showError('Campo requerido', 'Por favor ingresa el nombre del producto')
			return
		}

		const numPrice = Number(price || 0)
		if (isNaN(numPrice) || numPrice < 0) {
			showError('Precio inválido', 'El precio debe ser un número positivo')
			return
		}

		const numStock = Number(stock || 0)
		if (isNaN(numStock) || numStock < 0) {
			showError('Stock inválido', 'El stock debe ser un número no negativo')
			return
		}

		if (!typeId) {
			showError('Campo requerido', 'Por favor selecciona un tipo de producto')
			return
		}

		const payload = {
			name: name.trim(),
			price: numPrice,
			stock: numStock,
			idType: Number(typeId)
		}

		setFormLoading(true)
		try {
			await onSave(payload)
		} finally {
			setFormLoading(false)
		}
	}

	return (
		<form onSubmit={submit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">Nombre del producto *</Label>
				<Input id="name" placeholder="Ej: Amoxicilina 500mg" value={name} onChange={e => setName(e.target.value)} disabled={formLoading} />
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="price">Precio ($) *</Label>
					<Input id="price" type="number" step="0.01" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} disabled={formLoading} />
				</div>
				<div className="space-y-2">
					<Label htmlFor="stock">Stock (unidades) *</Label>
					<Input id="stock" type="number" step="1" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} disabled={formLoading} />
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="type">Tipo de Producto *</Label>
				{typesLoading ? (
					<div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-foreground/5">
						<Loader2 className="w-4 h-4 animate-spin" />
						<span className="text-sm">Cargando tipos...</span>
					</div>
				) : (
					<Select value={typeId} onValueChange={setTypeId} disabled={formLoading}>
						<SelectTrigger id="type">
							<SelectValue placeholder="Selecciona un tipo" />
						</SelectTrigger>
						<SelectContent>
							{types.length === 0 ? (
								<div className="p-2 text-sm text-foreground/60">No hay tipos disponibles</div>
							) : (
								types.map((t: any) => {
									const typeIdVal = t.id_type ?? t.id
									return (
										<SelectItem key={typeIdVal} value={String(typeIdVal)}>
											{t.name}
										</SelectItem>
									)
								})
							)}
						</SelectContent>
					</Select>
				)}
			</div>

			<DialogFooter className="pt-4">
				<Button type="button" variant="outline" onClick={onCancel} disabled={formLoading}>
					Cancelar
				</Button>
				<Button type="submit" disabled={formLoading} className="gap-2">
					{formLoading ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							Guardando...
						</>
					) : (
						'Guardar'
					)}
				</Button>
			</DialogFooter>
		</form>
	)
}

export default ProductList

