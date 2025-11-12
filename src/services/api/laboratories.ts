import client from './client'

export const laboratoriesApi = {
  list: (params?: any) => client.get('/laboratories', { params }).then(r => {
    const arr = Array.isArray(r.data) ? r.data : (r.data?.laboratories || r.data?.items || [])
    return arr
  }),
  get: (id: string | number) => client.get(`/laboratories/${id}`).then(r => r.data),
  create: (payload: any) => client.post('/laboratories', payload).then(r => r.data),
  update: (id: string | number, payload: any) => client.put(`/laboratories/${id}`, payload).then(r => r.data),
  remove: (id: string | number) => client.delete(`/laboratories/${id}`).then(r => r.data),
}
