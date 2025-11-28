import axios from 'axios'

// Use relative URLs to leverage Vite proxy, or absolute URL if specified
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL: API_BASE_URL, // Empty string uses relative URLs (proxy)
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        const refreshUrl = API_BASE_URL ? `${API_BASE_URL}/api/v1/auth/refresh/` : '/api/v1/auth/refresh/'
        const response = await axios.post(refreshUrl, {
          refresh: refreshToken,
        })

        const { access } = response.data
        localStorage.setItem('access_token', access)
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

// API endpoints
export const productsAPI = {
  list: (params) => api.get('/api/v1/inventory/products/', { params }),
  get: (id) => api.get(`/api/v1/inventory/products/${id}/`),
  create: (data) => api.post('/api/v1/inventory/products/', data),
  update: (id, data) => api.put(`/api/v1/inventory/products/${id}/`, data),
  delete: (id) => api.delete(`/api/v1/inventory/products/${id}/`),
}

export const warehousesAPI = {
  list: (params) => api.get('/api/v1/inventory/warehouses/', { params }),
  get: (id) => api.get(`/api/v1/inventory/warehouses/${id}/`),
  create: (data) => api.post('/api/v1/inventory/warehouses/', data),
  update: (id, data) => api.put(`/api/v1/inventory/warehouses/${id}/`, data),
  delete: (id) => api.delete(`/api/v1/inventory/warehouses/${id}/`),
}

export const customersAPI = {
  list: (params) => api.get('/api/v1/sales/customers/', { params }),
  get: (id) => api.get(`/api/v1/sales/customers/${id}/`),
  create: (data) => api.post('/api/v1/sales/customers/', data),
  update: (id, data) => api.put(`/api/v1/sales/customers/${id}/`, data),
  delete: (id) => api.delete(`/api/v1/sales/customers/${id}/`),
}

export const salesOrdersAPI = {
  list: (params) => api.get('/api/v1/sales/orders/', { params }),
  get: (id) => api.get(`/api/v1/sales/orders/${id}/`),
  create: (data) => api.post('/api/v1/sales/orders/', data),
  update: (id, data) => api.put(`/api/v1/sales/orders/${id}/`, data),
  confirm: (id) => api.post(`/api/v1/sales/orders/${id}/confirm/`),
  fulfill: (id) => api.post(`/api/v1/sales/orders/${id}/fulfill/`),
  cancel: (id, data) => api.patch(`/api/v1/sales/orders/${id}/`, data),
}

export const inventoryAPI = {
  list: (params) => api.get('/api/v1/inventory/inventory-items/', { params }),
  get: (id) => api.get(`/api/v1/inventory/inventory-items/${id}/`),
  getInventoryItem: (productId, warehouseId) =>
    api.get('/api/v1/inventory/inventory-items/', {
      params: { product: productId, warehouse: warehouseId },
    }),
  create: (data) => api.post('/api/v1/inventory/inventory-items/', data),
  update: (id, data) => api.put(`/api/v1/inventory/inventory-items/${id}/`, data),
  delete: (id) => api.delete(`/api/v1/inventory/inventory-items/${id}/`),
}

