import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { inventoryAPI, productsAPI, warehousesAPI } from '../api/api'

export default function InventoryForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])

  const [formData, setFormData] = useState({
    product: '',
    warehouse: '',
    quantity: 0,
    minimum_stock_level: 0,
    reorder_quantity: 0,
  })

  useEffect(() => {
    fetchDropdownData()
    if (isEdit) {
      fetchInventory()
    }
  }, [id])

  const fetchDropdownData = async () => {
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        productsAPI.list(),
        warehousesAPI.list(),
      ])
      setProducts(productsRes.data.results || productsRes.data || [])
      setWarehouses(warehousesRes.data.results || warehousesRes.data || [])
    } catch (err) {
      console.error('Error fetching dropdown data:', err)
      setError('Failed to load form data. Please try again.')
    }
  }

  const fetchInventory = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await inventoryAPI.get(id)
      const item = response.data
      setFormData({
        product: item.product || '',
        warehouse: item.warehouse || '',
        quantity: item.quantity || 0,
        minimum_stock_level: item.minimum_stock_level || 0,
        reorder_quantity: item.reorder_quantity || 0,
      })
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError('Failed to load inventory record. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.product) {
      setError('Product is required')
      return false
    }
    if (!formData.warehouse) {
      setError('Warehouse is required')
      return false
    }
    if (parseInt(formData.quantity) < 0) {
      setError('Quantity cannot be negative')
      return false
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
      const submitData = {
        product: parseInt(formData.product),
        warehouse: parseInt(formData.warehouse),
        quantity: parseInt(formData.quantity),
        minimum_stock_level: parseInt(formData.minimum_stock_level),
        reorder_quantity: parseInt(formData.reorder_quantity),
      }

      if (isEdit) {
        await inventoryAPI.update(id, submitData)
        setSuccess('Inventory record updated successfully!')
      } else {
        await inventoryAPI.create(submitData)
        setSuccess('Inventory record created successfully!')
      }

      setTimeout(() => {
        navigate('/inventory/items')
      }, 1500)
    } catch (err) {
      console.error('Error saving inventory:', err)
      const errorMsg =
        err.response?.data?.product?.[0] ||
        err.response?.data?.warehouse?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to save inventory record. Please try again.'
      setError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Box
        display="flex"
        alignItems="center"
        mb={4}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 3,
          borderRadius: 3,
          color: 'white',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/inventory/items')}
          sx={{
            mr: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight="bold">
          {isEdit ? 'Edit Inventory Record' : 'Create Inventory Record'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success} Redirecting...
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
                label="Product *"
                value={formData.product}
                onChange={(e) => handleInputChange('product', e.target.value)}
                required
                disabled={isEdit}
                helperText={isEdit ? 'Product cannot be changed' : ''}
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.sku} - {product.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Warehouse *"
                value={formData.warehouse}
                onChange={(e) => handleInputChange('warehouse', e.target.value)}
                required
                disabled={isEdit}
                helperText={isEdit ? 'Warehouse cannot be changed' : ''}
              >
                {warehouses.map((warehouse) => (
                  <MenuItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Quantity *"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Stock Level"
                value={formData.minimum_stock_level}
                onChange={(e) => handleInputChange('minimum_stock_level', e.target.value)}
                inputProps={{ min: 0 }}
                helperText="Alert when stock falls below this level"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Reorder Quantity"
                value={formData.reorder_quantity}
                onChange={(e) => handleInputChange('reorder_quantity', e.target.value)}
                inputProps={{ min: 0 }}
                helperText="Suggested reorder amount"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/inventory/items')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting
                ? 'Saving...'
                : isEdit
                  ? 'Update Inventory Record'
                  : 'Create Inventory Record'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  )
}

