import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  TextField,
  MenuItem,
  InputAdornment,
  Pagination,
  Alert,
  Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import SearchIcon from '@mui/icons-material/Search'
import { salesOrdersAPI } from '../api/api'

const statusColors = {
  draft: 'default',
  confirmed: 'info',
  fulfilled: 'success',
  invoiced: 'primary',
  cancelled: 'error',
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function SalesOrderList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [nextPage, setNextPage] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter])

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page: page,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      }
      const response = await salesOrdersAPI.list(params)
      const data = response.data
      
      setOrders(data.results || data)
      setCount(data.count || (Array.isArray(data) ? data.length : (data.results?.length || 0)))
      setNextPage(data.next)
      setPreviousPage(data.previous)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load sales orders. Please try again.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1) // Reset to first page on new search
    fetchOrders()
  }

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value)
    setPage(1) // Reset to first page on filter change
  }

  const handlePageChange = (event, value) => {
    setPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  // Use orders directly (server-side filtering via API)
  const displayOrders = orders

  return (
    <Container maxWidth="xl">
      <Box
        display="flex"
        justifyContent="space-between"
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
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Sales Orders
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Manage and track all your sales orders
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/sales-orders/new')}
          sx={{
            backgroundColor: 'white',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
          }}
        >
          New Order
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by order number, customer name..."
              value={searchTerm}
              onChange={handleSearch}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </form>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <Paper
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Order Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Order Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Total Amount
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : displayOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No orders found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      '&:last-child td': { border: 0 },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="600" color="primary">
                        {order.order_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.customer_name || order.customer_code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.order_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status?.toUpperCase()}
                        color={statusColors[order.status] || 'default'}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="600" color="success.main">
                        ${parseFloat(order.total_amount || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/sales-orders/${order.id}`)}
                        title="View Details"
                        sx={{
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                            color: 'white',
                          },
                        }}
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

        {count > 0 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={Math.ceil(count / 10)} // Assuming 10 items per page
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Paper>
    </Container>
  )
}

