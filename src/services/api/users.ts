import client from './client'

export const usersApi = {
  list: () => client.get('/users').then(r => r.data),
  get: (id: number) => client.get(`/users/${id}`).then(r => r.data),
  create: (payload: any) => client.post('/users', payload).then(r => r.data),
  update: (id: number, payload: any) => client.patch(`/users/${id}`, payload).then(r => r.data),
  remove: (id: number) => client.delete(`/users/${id}`).then(r => r.data),
  activate: (id: number) => client.patch(`/users/${id}/activate`).then(r => r.data),
  deactivate: (id: number) => client.patch(`/users/${id}/deactivate`).then(r => r.data),
  listFiltered: (params: any) => client.get('/users', { params }).then(r => r.data),
}

export default usersApi
