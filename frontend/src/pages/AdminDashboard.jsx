import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import { usersAPI, salesOrdersAPI, productsAPI, customersAPI } from '../api/api'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    adminUsers: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [usersRes, ordersRes, productsRes, customersRes] = await Promise.all([
        usersAPI.list().catch(() => ({ data: { results: [] } })),
        salesOrdersAPI.list().catch(() => ({ data: { results: [] } })),
        productsAPI.list().catch(() => ({ data: { results: [] } })),
        customersAPI.list().catch(() => ({ data: { results: [] } })),
      ])

      const users = usersRes.data.results || usersRes.data || []
      const orders = ordersRes.data.results || ordersRes.data || []
      const products = productsRes.data.results || productsRes.data || []
      const customers = customersRes.data.results || customersRes.data || []

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.is_active).length,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalCustomers: customers.length,
        adminUsers: users.filter((u) => u.role === 'admin').length,
      })
    } catch (err) {
      setError('Failed to load dashboard statistics')
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} color={color || 'primary.main'}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${color || 'primary.main'}15`,
              color: color || 'primary.main',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of system users and key metrics
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<PeopleIcon sx={{ fontSize: 32 }} />}
            color="#2563eb"
            onClick={() => navigate('/admin/users')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={<SecurityIcon sx={{ fontSize: 32 }} />}
            color="#10b981"
            onClick={() => navigate('/admin/users')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Administrators"
            value={stats.adminUsers}
            icon={<SecurityIcon sx={{ fontSize: 32 }} />}
            color="#ef4444"
            onClick={() => navigate('/admin/users')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingCartIcon sx={{ fontSize: 32 }} />}
            color="#f59e0b"
            onClick={() => navigate('/sales-orders')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<CategoryIcon sx={{ fontSize: 32 }} />}
            color="#7c3aed"
            onClick={() => navigate('/inventory/products')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={<PeopleIcon sx={{ fontSize: 32 }} />}
            color="#3b82f6"
            onClick={() => navigate('/customers')}
          />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>
            Quick Actions
          </Typography>
        </Box>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/admin/users/new')}
          >
            Create New User
          </Button>
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/admin/users')}
          >
            Manage Users
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate('/sales-orders')}
          >
            View Orders
          </Button>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => navigate('/inventory/products')}
          >
            Manage Products
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

