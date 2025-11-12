import client from './client'

export const productsApi = {
  list: (params?: any) => client.get('/products', { params }).then(r => r.data),
  get: (id: string | number) => client.get(`/products/${id}`).then(r => r.data),
  create: (payload: any) => client.post('/products', payload).then(r => r.data),
  update: (id: string | number, payload: any) => client.put(`/products/${id}`, payload).then(r => r.data),
  remove: (id: string | number) => client.delete(`/products/${id}`).then(r => r.data),
}

export const productTypesApi = {
  list: (params?: any) => client.get('/product-types', { params }).then(r => r.data),
  get: (id: string | number) => client.get(`/product-types/${id}`).then(r => r.data),
}

