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
  Switch,
  FormControlLabel,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { productsAPI } from '../api/api'

export default function ProductForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    unit_price: '',
    unit_of_measure: 'pcs',
    category: '',
    is_active: true,
  })

  useEffect(() => {
    if (isEdit) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await productsAPI.get(id)
      const product = response.data
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        description: product.description || '',
        unit_price: product.unit_price || '',
        unit_of_measure: product.unit_of_measure || 'pcs',
        category: product.category || '',
        is_active: product.is_active !== undefined ? product.is_active : true,
      })
    } catch (err) {
      console.error('Error fetching product:', err)
      setError('Failed to load product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.sku.trim()) {
      setError('SKU is required')
      return false
    }
    if (!formData.name.trim()) {
      setError('Product name is required')
      return false
    }
    if (!formData.unit_price || parseFloat(formData.unit_price) < 0) {
      setError('Unit price must be a valid positive number')
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
        ...formData,
        unit_price: parseFloat(formData.unit_price),
      }

      if (isEdit) {
        await productsAPI.update(id, submitData)
        setSuccess('Product updated successfully!')
      } else {
        await productsAPI.create(submitData)
        setSuccess('Product created successfully!')
      }

      setTimeout(() => {
        navigate('/inventory/products')
      }, 1500)
    } catch (err) {
      console.error('Error saving product:', err)
      const errorMsg =
        err.response?.data?.sku?.[0] ||
        err.response?.data?.name?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to save product. Please try again.'
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
          onClick={() => navigate('/inventory/products')}
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
          {isEdit ? 'Edit Product' : 'Create Product'}
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
                label="SKU *"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                required
                disabled={isEdit}
                helperText={isEdit ? 'SKU cannot be changed' : 'Unique product identifier'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unit of Measure"
                value={formData.unit_of_measure}
                onChange={(e) => handleInputChange('unit_of_measure', e.target.value)}
                helperText="e.g., pcs, kg, m, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Unit Price *"
                value={formData.unit_price}
                onChange={(e) => handleInputChange('unit_price', e.target.value)}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                helperText="Optional product category"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/inventory/products')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  )
}

