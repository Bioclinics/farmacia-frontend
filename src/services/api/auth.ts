import client from './client'

export type LoginPayload = { username: string; password: string }

export type RegisterPayload = {
  idRole: number
  name: string
  email: string
  username: string
  password: string
}

export async function login(payload: LoginPayload) {
  const res = await client.post('/auth/login', payload)
  return res.data
}

export async function register(payload: RegisterPayload) {
  const res = await client.post('/auth/register', payload)
  return res.data
}
