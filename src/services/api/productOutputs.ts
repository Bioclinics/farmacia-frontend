import client from './client'

export const productOutputsApi = {
  list: (params?: any) => client.get('/product-outputs', { params }).then(r => r.data),
  findBySale: (saleId: number | string) => client.get('/product-outputs', { params: { saleId } }).then(r => r.data),
}
