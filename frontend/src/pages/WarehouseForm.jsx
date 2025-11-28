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
import { warehousesAPI } from '../api/api'

export default function WarehouseForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    is_active: true,
  })

  useEffect(() => {
    if (isEdit) {
      fetchWarehouse()
    }
  }, [id])

  const fetchWarehouse = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await warehousesAPI.get(id)
      const warehouse = response.data
      setFormData({
        code: warehouse.code || '',
        name: warehouse.name || '',
        address: warehouse.address || '',
        is_active: warehouse.is_active !== undefined ? warehouse.is_active : true,
      })
    } catch (err) {
      console.error('Error fetching warehouse:', err)
      setError('Failed to load warehouse. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.code.trim()) {
      setError('Warehouse code is required')
      return false
    }
    if (!formData.name.trim()) {
      setError('Warehouse name is required')
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
      if (isEdit) {
        await warehousesAPI.update(id, formData)
        setSuccess('Warehouse updated successfully!')
      } else {
        await warehousesAPI.create(formData)
        setSuccess('Warehouse created successfully!')
      }

      setTimeout(() => {
        navigate('/inventory/warehouses')
      }, 1500)
    } catch (err) {
      console.error('Error saving warehouse:', err)
      const errorMsg =
        err.response?.data?.code?.[0] ||
        err.response?.data?.name?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to save warehouse. Please try again.'
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
          onClick={() => navigate('/inventory/warehouses')}
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
          {isEdit ? 'Edit Warehouse' : 'Create Warehouse'}
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
                label="Warehouse Code *"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                required
                disabled={isEdit}
                helperText={isEdit ? 'Code cannot be changed' : 'Unique warehouse identifier'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Warehouse Name *"
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
                label="Address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
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
              onClick={() => navigate('/inventory/warehouses')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update Warehouse' : 'Create Warehouse'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  )
}

