import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export const analyzeText = (text, autonomousMode = false) =>
  api.post('/analyze', { text, autonomous_mode: autonomousMode }).then(r => r.data)

export const executeItems = (items, autonomousMode = false) =>
  api.post('/execute', { items, autonomous_mode: autonomousMode }).then(r => r.data)

export const runPipeline = (text, autonomousMode = false) =>
  api.post('/pipeline', { text, autonomous_mode: autonomousMode }).then(r => r.data)

export const getAssets = () =>
  api.get('/assets').then(r => r.data)

export const simulateForward = (days = 30) =>
  api.post(`/simulate/forward?days=${days}`).then(r => r.data)

export const resetSimulation = () =>
  api.post('/simulate/reset').then(r => r.data)

export const sendTransactionReceiptEmail = (item, tx_hash) =>
  api.post('/simulate/email_receipt', { item, tx_hash }).then(r => r.data)

export default api
