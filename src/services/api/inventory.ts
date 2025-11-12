import client from './client'

export const inventoryApi = {
  entries: (params?: any) => client.get('/product-inputs', { params }).then(r => r.data),
  createEntry: (payload: any) => client.post('/product-inputs', payload).then(r => r.data),
  listLaboratories: (params?: any) => client.get('/laboratories', { params }).then(r => r.data),
  exits: (params?: any) => client.get('/product-outputs', { params }).then(r => r.data),
  createExit: (payload: any) => client.post('/product-outputs', payload).then(r => r.data),
  createAdjustment: (payload: any) => client.post('/product-outputs/adjustment', payload).then(r => r.data),
}
