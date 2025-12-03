import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  TextField,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { invoicesAPI, salesOrdersAPI } from '../api/api'

export default function InvoiceDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [salesOrder, setSalesOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    fetchInvoice()
  }, [id])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const response = await invoicesAPI.get(id)
      setInvoice(response.data)
      
      // Fetch sales order details if available
      if (response.data.sales_order) {
        try {
          const orderResponse = await salesOrdersAPI.get(response.data.sales_order)
          setSalesOrder(orderResponse.data)
        } catch (err) {
          console.error('Error fetching sales order:', err)
        }
      }
    } catch (err) {
      setError('Failed to load invoice. Please try again.')
      console.error('Error fetching invoice:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    try {
      await invoicesAPI.update(id, { status: newStatus })
      setSuccess('Invoice status updated successfully')
      fetchInvoice()
      setStatusDialogOpen(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update invoice status')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      sent: 'info',
      paid: 'success',
      cancelled: 'error',
    }
    return colors[status] || 'default'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isOverdue = () => {
    if (!invoice?.due_date || invoice.status === 'paid') return false
    return new Date(invoice.due_date) < new Date()
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!invoice) {
    return (
      <Box>
        <Alert severity="error">Invoice not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/finance/invoices')} sx={{ mt: 2 }}>
          Back to Invoices
        </Button>
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
          Invoice Details
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
              <Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {invoice.invoice_number}
                </Typography>
                <Chip
                  label={invoice.status?.toUpperCase() || 'DRAFT'}
                  color={getStatusColor(invoice.status)}
                  sx={{ mt: 1 }}
                />
                {isOverdue() && (
                  <Chip
                    label="OVERDUE"
                    color="error"
                    sx={{ mt: 1, ml: 1 }}
                  />
                )}
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={() => {
                    window.print()
                  }}
                >
                  Print
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/finance/invoices/${id}/edit`)}
                >
                  Edit
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Invoice Date
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatDate(invoice.invoice_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Due Date
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatDate(invoice.due_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Sales Order
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {invoice.sales_order_number || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Customer
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {invoice.customer_name || '-'}
                </Typography>
              </Grid>
            </Grid>

            {salesOrder && salesOrder.items && salesOrder.items.length > 0 && (
              <>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Items
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product_name || item.product || '-'}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.quantity * item.unit_price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {invoice.notes && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" fontWeight={600} mb={1}>
                  Notes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoice.notes}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Summary
            </Typography>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography fontWeight={600}>
                  {formatCurrency(invoice.total_amount - (invoice.tax_amount || 0))}
                </Typography>
              </Box>
              {invoice.tax_amount > 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography color="text.secondary">Tax</Typography>
                  <Typography fontWeight={600}>{formatCurrency(invoice.tax_amount)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6" fontWeight={700}>
                  Total
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {formatCurrency(invoice.total_amount)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight={600} mb={2}>
              Actions
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {invoice.status === 'draft' && (
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={() => {
                    setNewStatus('sent')
                    setStatusDialogOpen(true)
                  }}
                >
                  Mark as Sent
                </Button>
              )}
              {invoice.status === 'sent' && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => {
                    setNewStatus('paid')
                    setStatusDialogOpen(true)
                  }}
                >
                  Mark as Paid
                </Button>
              )}
              {invoice.status !== 'cancelled' && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setNewStatus('cancelled')
                    setStatusDialogOpen(true)
                  }}
                >
                  Cancel Invoice
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Invoice Status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to change the invoice status to "{newStatus.toUpperCase()}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

