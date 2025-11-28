import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { productsAPI, warehousesAPI, customersAPI, salesOrdersAPI } from '../api/api'

export default function SalesOrderForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    customer: location.state?.customerId || '',
    order_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  // Dropdown options
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])

  // Order items
  const [items, setItems] = useState([
    {
      product: '',
      warehouse: '',
      quantity: 1,
      unit_price: 0,
    },
  ])

  useEffect(() => {
    fetchDropdownData()
  }, [])

  // Helper function to extract error message from nested structures
  const extractNestedError = (errorObj, prefix = '') => {
    if (typeof errorObj === 'string') return errorObj
    if (Array.isArray(errorObj) && errorObj.length > 0) {
      // If it's an array of strings, return the first one
      if (typeof errorObj[0] === 'string') return errorObj[0]
      // If it's an array of objects, recursively extract
      return extractNestedError(errorObj[0], prefix)
    }
    if (typeof errorObj === 'object' && errorObj !== null) {
      // Try to find string error messages in the object
      for (const key in errorObj) {
        const value = errorObj[key]
        if (typeof value === 'string') {
          return prefix ? `${prefix}.${key}: ${value}` : `${key}: ${value}`
        }
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
          return prefix ? `${prefix}.${key}: ${value[0]}` : `${key}: ${value[0]}`
        }
        // Recursively check nested objects
        if (typeof value === 'object' && value !== null) {
          const nested = extractNestedError(value, prefix ? `${prefix}.${key}` : key)
          if (nested) return nested
        }
      }
    }
    return null
  }

  // Helper function to extract error message from various response formats
  const extractErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred'
    
    // If it's already a string, return it
    if (typeof error === 'string') return error
    
    // If it's an object, try to extract meaningful error messages
    if (typeof error === 'object') {
      const data = error.response?.data || error
      
      // Log the error structure for debugging
      console.error('Error response data:', JSON.stringify(data, null, 2))
      
      // Try common error message locations first
      if (data.detail && typeof data.detail === 'string') return data.detail
      if (data.message && typeof data.message === 'string') return data.message
      if (data.error && typeof data.error === 'string') return data.error
      
      // Handle non_field_errors
      if (data.non_field_errors && Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
        return typeof data.non_field_errors[0] === 'string' 
          ? data.non_field_errors[0] 
          : extractNestedError(data.non_field_errors[0]) || 'Validation error'
      }
      
      // Special handling for items array (common case)
      if (data.items) {
        if (Array.isArray(data.items) && data.items.length > 0) {
          const itemError = extractNestedError(data.items[0], 'Item')
          if (itemError) return itemError
        } else if (typeof data.items === 'object') {
          // Handle case where items is an object with numeric keys (DRF format)
          const itemError = extractNestedError(data.items, 'Item')
          if (itemError) return itemError
        }
      }
      
      // Handle nested errors (like items array with nested objects)
      const nestedError = extractNestedError(data)
      if (nestedError) return nestedError
      
      // Handle simple field errors (e.g., {field: ["error"]})
      for (const key in data) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          const firstError = data[key][0]
          if (typeof firstError === 'string') {
            return `${key}: ${firstError}`
          }
          // If it's an object, extract nested error
          const nested = extractNestedError(firstError, key)
          if (nested) return nested
        }
        if (typeof data[key] === 'string') {
          return `${key}: ${data[key]}`
        }
      }
      
      // Last resort: try to format the error object nicely
      try {
        const errorStr = JSON.stringify(data, null, 2)
        // If it's too long, truncate it
        if (errorStr.length > 500) {
          return `Validation error: ${errorStr.substring(0, 500)}...`
        }
        return `Validation error: ${errorStr}`
      } catch {
        return 'An error occurred. Please check the console for details.'
      }
    }
    
    return 'An error occurred'
  }

  const fetchDropdownData = async () => {
    setLoading(true)
    setError('')
    try {
      const [customersRes, productsRes, warehousesRes] = await Promise.all([
        customersAPI.list(),
        productsAPI.list(),
        warehousesAPI.list(),
      ])
      setCustomers(customersRes.data.results || customersRes.data || [])
      setProducts(productsRes.data.results || productsRes.data || [])
      setWarehouses(warehousesRes.data.results || warehousesRes.data || [])
    } catch (err) {
      console.error('Error fetching dropdown data:', err)
      const errorMsg = extractErrorMessage(err) || 'Failed to load form data. Please check your connection.'
      setError(errorMsg)
      // Set empty arrays to prevent rendering errors
      setCustomers([])
      setProducts([])
      setWarehouses([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: value }

      // Auto-fill unit price from product
      if (field === 'product') {
        const product = products.find((p) => p.id === parseInt(value))
        if (product) {
          newItems[index].unit_price = parseFloat(product.unit_price)
        }
      }

      return newItems
    })
  }

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product: '',
        warehouse: '',
        quantity: 1,
        unit_price: 0,
      },
    ])
  }

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const calculateLineTotal = (item) => {
    return (item.quantity || 0) * (item.unit_price || 0)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateLineTotal(item), 0)
  }

  const validateForm = () => {
    if (!formData.customer) {
      setError('Please select a customer')
      return false
    }

    if (items.length === 0) {
      setError('Please add at least one item')
      return false
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.product || !item.warehouse || !item.quantity || item.quantity <= 0) {
        setError(`Please complete all fields for item ${i + 1}`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const orderData = {
        ...formData,
        customer: parseInt(formData.customer),
        items: items.map((item) => ({
          product: parseInt(item.product),
          warehouse: parseInt(item.warehouse),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
        })),
      }

      const response = await salesOrdersAPI.create(orderData)
      setSuccess(true)
      setTimeout(() => {
        navigate('/sales-orders')
      }, 1500)
    } catch (err) {
      console.error('Error creating sales order:', err)
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading form data...
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box
        mb={4}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 3,
          borderRadius: 3,
          color: 'white',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Create Sales Order
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Create a new sales order for your customer
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {typeof error === 'string' ? error : String(error)}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Sales order created successfully! Redirecting...
        </Alert>
      )}

      <Paper
        sx={{
          p: 4,
          borderRadius: 3,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Customer"
                value={formData.customer}
                onChange={(e) => handleInputChange('customer', e.target.value)}
                required
                disabled={customers.length === 0}
                helperText={customers.length === 0 ? 'No customers available. Please create customers first.' : ''}
              >
                {customers.length === 0 ? (
                  <MenuItem disabled>No customers available</MenuItem>
                ) : (
                  customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.code} - {customer.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Order Date"
                value={formData.order_date}
                onChange={(e) => handleInputChange('order_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Order Items</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addItem}
                size="small"
              >
                Add Item
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Line Total</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={item.product}
                          onChange={(e) =>
                            handleItemChange(index, 'product', e.target.value)
                          }
                          required
                          disabled={products.length === 0}
                          sx={{ minWidth: 200 }}
                        >
                          {products.length === 0 ? (
                            <MenuItem disabled>No products available</MenuItem>
                          ) : (
                            products.map((product) => (
                              <MenuItem key={product.id} value={product.id}>
                                {product.sku} - {product.name}
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={item.warehouse}
                          onChange={(e) =>
                            handleItemChange(index, 'warehouse', e.target.value)
                          }
                          required
                          disabled={warehouses.length === 0}
                          sx={{ minWidth: 150 }}
                        >
                          {warehouses.length === 0 ? (
                            <MenuItem disabled>No warehouses available</MenuItem>
                          ) : (
                            warehouses.map((warehouse) => (
                              <MenuItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.code}
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', e.target.value)
                          }
                          inputProps={{ min: 1 }}
                          required
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleItemChange(index, 'unit_price', e.target.value)
                          }
                          inputProps={{ min: 0, step: 0.01 }}
                          required
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        ${calculateLineTotal(item).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="h6">
                Total: ${calculateTotal().toFixed(2)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/sales-orders')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Order'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  )
}

