import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  Autocomplete,
} from '@mui/material'
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material'
import { invoicesAPI, salesOrdersAPI } from '../api/api'

export default function InvoiceForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState(null)
  const [salesOrders, setSalesOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [formData, setFormData] = useState({
    sales_order: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    tax_amount: 0,
    notes: '',
  })

  useEffect(() => {
    if (isEdit) {
      fetchInvoice()
    } else {
      fetchFulfilledOrders()
    }
  }, [id])

  const fetchFulfilledOrders = async () => {
    try {
      const response = await salesOrdersAPI.list({ status: 'fulfilled' })
      const orders = response.data.results || response.data || []
      // Filter out orders that already have invoices
      const availableOrders = orders.filter((order) => !order.invoice)
      setSalesOrders(availableOrders)
    } catch (err) {
      console.error('Error fetching sales orders:', err)
    }
  }

  const fetchInvoice = async () => {
    try {
      setFetching(true)
      const response = await invoicesAPI.get(id)
      const invoice = response.data
      setFormData({
        sales_order: invoice.sales_order || '',
        invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: invoice.status || 'draft',
        tax_amount: invoice.tax_amount || 0,
        notes: invoice.notes || '',
      })
    } catch (err) {
      setError('Failed to load invoice. Please try again.')
      console.error('Error fetching invoice:', err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (selectedOrder) {
      setFormData((prev) => ({
        ...prev,
        sales_order: selectedOrder.id,
      }))
    }
  }, [selectedOrder])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const extractErrorMessage = (error) => {
    if (typeof error === 'string') return error
    if (error?.response?.data) {
      const data = error.response.data
      if (typeof data === 'string') return data
      if (data.detail) return data.detail
      if (data.message) return data.message
      const fieldErrors = Object.entries(data)
        .map(([field, messages]) => {
          if (Array.isArray(messages)) {
            return `${field}: ${messages.join(', ')}`
          }
          return `${field}: ${messages}`
        })
        .join('; ')
      if (fieldErrors) return fieldErrors
    }
    return 'An error occurred. Please try again.'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isEdit) {
        await invoicesAPI.update(id, formData)
      } else {
        await invoicesAPI.create(formData)
      }
      navigate('/finance/invoices')
    } catch (err) {
      const errorMsg = extractErrorMessage(err)
      setError(errorMsg)
      console.error('Error saving invoice:', err)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/finance/invoices')}
          sx={{ minWidth: 'auto' }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight={700}>
          {isEdit ? 'Edit Invoice' : 'Create New Invoice'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {!isEdit && (
              <Grid item xs={12}>
                <Autocomplete
                  options={salesOrders}
                  getOptionLabel={(option) =>
                    `${option.order_number} - ${option.customer_name || option.customer || 'N/A'} - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(option.total_amount || 0)}`
                  }
                  value={selectedOrder}
                  onChange={(e, newValue) => setSelectedOrder(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Fulfilled Sales Order"
                      required
                      helperText="Only fulfilled orders without invoices are shown"
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Invoice Date"
                name="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date"
                name="due_date"
                type="date"
                value={formData.due_date}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                variant="outlined"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax Amount"
                name="tax_amount"
                type="number"
                value={formData.tax_amount}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>

            {selectedOrder && !isEdit && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Order Summary:
                  </Typography>
                  <Typography variant="body2">
                    Order Number: {selectedOrder.order_number}
                  </Typography>
                  <Typography variant="body2">
                    Customer: {selectedOrder.customer_name || selectedOrder.customer || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Total Amount:{' '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(selectedOrder.total_amount || 0)}
                  </Typography>
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/finance/invoices')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

