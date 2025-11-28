import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CancelIcon from '@mui/icons-material/Cancel'
import { salesOrdersAPI } from '../api/api'

const statusColors = {
  draft: 'default',
  confirmed: 'info',
  fulfilled: 'success',
  invoiced: 'primary',
  cancelled: 'error',
}

export default function SalesOrderDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [fulfillDialogOpen, setFulfillDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await salesOrdersAPI.get(id)
      setOrder(response.data)
    } catch (err) {
      console.error('Error fetching order:', err)
      setError('Failed to load order details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await salesOrdersAPI.confirm(id)
      setSuccess('Order confirmed successfully!')
      setConfirmDialogOpen(false)
      fetchOrder() // Refresh order data
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to confirm order. Please try again.'
      setError(errorMsg)
      setConfirmDialogOpen(false)
    } finally {
      setActionLoading(false)
    }
  }

  const handleFulfill = async () => {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await salesOrdersAPI.fulfill(id)
      setSuccess('Order fulfilled successfully! Inventory has been updated.')
      setFulfillDialogOpen(false)
      fetchOrder() // Refresh order data
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to fulfill order. Please try again.'
      setError(errorMsg)
      setFulfillDialogOpen(false)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await salesOrdersAPI.cancel(id, { status: 'cancelled' })
      setSuccess('Order cancelled successfully!')
      setCancelDialogOpen(false)
      fetchOrder() // Refresh order data
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to cancel order. Please try again.'
      setError(errorMsg)
      setCancelDialogOpen(false)
    } finally {
      setActionLoading(false)
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

  if (!order) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Order not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sales-orders')} sx={{ mt: 2 }}>
          Back to Orders
        </Button>
      </Container>
    )
  }

  const canConfirm = order.status === 'draft'
  const canFulfill = order.status === 'confirmed'
  const canCancel = order.status === 'draft' || order.status === 'confirmed'

  return (
    <Container maxWidth="lg">
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
          onClick={() => navigate('/sales-orders')}
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
        <Typography variant="h4" fontWeight="bold" sx={{ flex: 1 }}>
          Order Details
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Order Number
            </Typography>
            <Typography variant="h6" gutterBottom>
              {order.order_number}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Box>
              <Chip
                label={order.status?.toUpperCase()}
                color={statusColors[order.status] || 'default'}
                size="medium"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Customer
            </Typography>
            <Typography variant="body1">
              {order.customer_name || order.customer_code}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Order Date
            </Typography>
            <Typography variant="body1">
              {new Date(order.order_date).toLocaleDateString()}
            </Typography>
          </Grid>
          {order.notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Notes
              </Typography>
              <Typography variant="body1">{order.notes}</Typography>
            </Grid>
          )}
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Created By
            </Typography>
            <Typography variant="body1">
              {order.created_by_username || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Created At
            </Typography>
            <Typography variant="body1">
              {new Date(order.created_at).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Order Items
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Warehouse</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Line Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {item.product_sku || item.product} - {item.product_name || 'N/A'}
                    </TableCell>
                    <TableCell>{item.warehouse_name || item.warehouse}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">
                      ${parseFloat(item.unit_price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        ${parseFloat(item.line_total || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Typography variant="h6">
            Total: ${parseFloat(order.total_amount || 0).toFixed(2)}
          </Typography>
        </Box>
      </Paper>

      {(canConfirm || canFulfill || canCancel) && (
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          }}
        >
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {canConfirm && (
              <Button
                variant="contained"
                color="info"
                startIcon={<CheckCircleIcon />}
                onClick={() => setConfirmDialogOpen(true)}
                disabled={actionLoading}
              >
                Confirm Order
              </Button>
            )}
            {canFulfill && (
              <Button
                variant="contained"
                color="success"
                startIcon={<LocalShippingIcon />}
                onClick={() => setFulfillDialogOpen(true)}
                disabled={actionLoading}
              >
                Fulfill Order
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setCancelDialogOpen(true)}
                disabled={actionLoading}
              >
                Cancel Order
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to confirm this order? This will validate inventory availability
            and change the order status to "Confirmed".
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} color="primary" variant="contained" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fulfill Dialog */}
      <Dialog open={fulfillDialogOpen} onClose={() => setFulfillDialogOpen(false)}>
        <DialogTitle>Fulfill Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to fulfill this order? This will decrease inventory quantities
            and change the order status to "Fulfilled". This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFulfillDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={handleFulfill} color="success" variant="contained" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : 'Fulfill'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this order? This will change the order status to
            "Cancelled". This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={actionLoading}>
            No
          </Button>
          <Button onClick={handleCancel} color="error" variant="contained" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

