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
  IconButton,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { customersAPI, salesOrdersAPI } from '../api/api'

const statusColors = {
  draft: 'default',
  confirmed: 'info',
  fulfilled: 'success',
  invoiced: 'primary',
  cancelled: 'error',
}

export default function CustomerDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCustomer()
    fetchOrders()
  }, [id])

  const fetchCustomer = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await customersAPI.get(id)
      setCustomer(response.data)
    } catch (err) {
      console.error('Error fetching customer:', err)
      setError('Failed to load customer details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const response = await salesOrdersAPI.list({ customer: id })
      setOrders(response.data.results || response.data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setOrdersLoading(false)
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

  if (!customer) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Customer not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')} sx={{ mt: 2 }}>
          Back to Customers
        </Button>
      </Container>
    )
  }

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
          onClick={() => navigate('/customers')}
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
          Customer Details
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/customers/${id}/edit`)}
          sx={{
            backgroundColor: 'white',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
          }}
        >
          Edit
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
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
              Customer Code
            </Typography>
            <Typography variant="h6" gutterBottom>
              {customer.code}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Box>
              <Chip
                label={customer.is_active ? 'Active' : 'Inactive'}
                color={customer.is_active ? 'success' : 'default'}
                size="medium"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Customer Name
            </Typography>
            <Typography variant="body1">{customer.name}</Typography>
          </Grid>
          {customer.email && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">{customer.email}</Typography>
            </Grid>
          )}
          {customer.phone && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Phone
              </Typography>
              <Typography variant="body1">{customer.phone}</Typography>
            </Grid>
          )}
          {customer.address && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Address
              </Typography>
              <Typography variant="body1">{customer.address}</Typography>
            </Grid>
          )}
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Created At
            </Typography>
            <Typography variant="body1">
              {new Date(customer.created_at).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Updated At
            </Typography>
            <Typography variant="body1">
              {new Date(customer.updated_at).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Order History
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate('/sales-orders/new', { state: { customerId: id } })}
          >
            New Order
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order Number</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total Amount</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordersLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No orders found for this customer
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {order.order_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status?.toUpperCase()}
                        color={statusColors[order.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${parseFloat(order.total_amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/sales-orders/${order.id}`)}
                        title="View Order"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  )
}

