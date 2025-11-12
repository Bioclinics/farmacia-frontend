import client from './client'

export const salesApi = {
  create: (payload: any) => client.post('/sales', payload).then(r => r.data),
  list: (params?: any) => client.get('/sales', { params }).then(r => r.data),
  get: (id: string | number) => client.get(`/sales/${id}`).then(r => r.data),
}
