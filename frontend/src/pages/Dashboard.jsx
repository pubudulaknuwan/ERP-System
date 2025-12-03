import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Stack,
} from '@mui/material'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import TrendingUp from '@mui/icons-material/TrendingUp'
import ShoppingCart from '@mui/icons-material/ShoppingCart'
import People from '@mui/icons-material/People'
import Inventory from '@mui/icons-material/Inventory'
import AttachMoney from '@mui/icons-material/AttachMoney'
import Receipt from '@mui/icons-material/Receipt'
import LocalShipping from '@mui/icons-material/LocalShipping'
import Warning from '@mui/icons-material/Warning'
import { salesOrdersAPI, customersAPI, productsAPI, inventoryAPI } from '../api/api'
import api from '../api/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#ec4899']

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockItems: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState([])
  const [chartData, setChartData] = useState({
    revenueByMonth: [],
    ordersByStatus: [],
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [ordersRes, customersRes, productsRes, inventoryRes] = await Promise.all([
        salesOrdersAPI.list(),
        customersAPI.list(),
        productsAPI.list(),
        inventoryAPI.list(),
      ])

      const orders = ordersRes.data.results || ordersRes.data || []
      const customers = customersRes.data.results || customersRes.data || []
      const products = productsRes.data.results || productsRes.data || []
      const inventory = inventoryRes.data.results || inventoryRes.data || []

      // Calculate statistics
      const totalOrders = orders.length
      const pendingOrders = orders.filter((o) => o.status === 'draft' || o.status === 'confirmed').length
      const totalRevenue = orders
        .filter((o) => o.status === 'fulfilled' || o.status === 'invoiced')
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
      const lowStockItems = inventory.filter(
        (item) => item.quantity < item.minimum_stock_level
      ).length

      setStats({
        totalOrders,
        pendingOrders,
        totalCustomers: customers.length,
        totalProducts: products.length,
        lowStockItems,
        totalRevenue,
      })

      // Get recent orders (last 5)
      setRecentOrders(orders.slice(0, 5))

      // Process chart data
      processChartData(orders)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processChartData = (orders) => {
    // Revenue by month
    const revenueByMonth = {}
    orders
      .filter((o) => o.status === 'fulfilled' || o.status === 'invoiced')
      .forEach((order) => {
        const date = new Date(order.order_date || order.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!revenueByMonth[monthKey]) {
          revenueByMonth[monthKey] = 0
        }
        revenueByMonth[monthKey] += parseFloat(order.total_amount || 0)
      })

    const revenueByMonthArray = Object.entries(revenueByMonth)
      .map(([month, revenue]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: parseFloat(revenue.toFixed(2)),
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA - dateB
      })
      .slice(-6) // Last 6 months

    // Orders by status
    const ordersByStatus = {}
    orders.forEach((order) => {
      const status = order.status || 'draft'
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1
    })

    const ordersByStatusArray = Object.entries(ordersByStatus).map(([status, count]) => ({
      name: status.toUpperCase(),
      value: count,
    }))

    setChartData({
      revenueByMonth: revenueByMonthArray,
      ordersByStatus: ordersByStatusArray,
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}20`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: `0 10px 25px -5px ${color}40`,
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${color}15`,
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="bold" color={color}>
          {value}
        </Typography>
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
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's an overview of your business.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingCart sx={{ fontSize: 28 }} />}
            color="#3b82f6"
            onClick={() => navigate('/sales-orders')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={<LocalShipping sx={{ fontSize: 28 }} />}
            color="#f59e0b"
            onClick={() => navigate('/sales-orders')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={<People sx={{ fontSize: 28 }} />}
            color="#10b981"
            onClick={() => navigate('/customers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<Inventory sx={{ fontSize: 28 }} />}
            color="#7c3aed"
            onClick={() => navigate('/inventory/products')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={<Warning sx={{ fontSize: 28 }} />}
            color="#ef4444"
            onClick={() => navigate('/inventory/items')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            icon={<AttachMoney sx={{ fontSize: 28 }} />}
            color="#10b981"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            }}
          >
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Revenue Trend (Last 6 Months)
            </Typography>
            {chartData.revenueByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No revenue data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            }}
          >
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Orders by Status
            </Typography>
            {chartData.ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No order data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                Recent Orders
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/sales-orders')}
              >
                View All
              </Button>
            </Box>
            {recentOrders.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No orders yet</Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/sales-orders/new')}
                >
                  Create First Order
                </Button>
              </Box>
            ) : (
              <Box>
                {recentOrders.map((order) => (
                  <Box
                    key={order.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderColor: 'primary.main',
                      },
                    }}
                    onClick={() => navigate(`/sales-orders/${order.id}`)}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight="600">
                        {order.order_number}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.customer_name || order.customer_code} •{' '}
                        {new Date(order.order_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        ${parseFloat(order.total_amount || 0).toFixed(2)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor:
                            order.status === 'fulfilled' || order.status === 'invoiced'
                              ? 'success.light'
                              : order.status === 'confirmed'
                                ? 'info.light'
                                : 'grey.300',
                          color:
                            order.status === 'fulfilled' || order.status === 'invoiced'
                              ? 'success.dark'
                              : order.status === 'confirmed'
                                ? 'info.dark'
                                : 'text.secondary',
                        }}
                      >
                        {order.status?.toUpperCase()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Quick Actions
            </Typography>
            <Stack spacing={2} mt={2}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<ShoppingCart />}
                onClick={() => navigate('/sales-orders/new')}
                sx={{ py: 1.5 }}
              >
                Create Sales Order
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<People />}
                onClick={() => navigate('/customers/new')}
                sx={{ py: 1.5 }}
              >
                Add New Customer
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Inventory />}
                onClick={() => navigate('/inventory/products/new')}
                sx={{ py: 1.5 }}
              >
                Add New Product
              </Button>
              {stats.lowStockItems > 0 && (
                <Button
                  variant="outlined"
                  fullWidth
                  color="warning"
                  startIcon={<Warning />}
                  onClick={() => navigate('/inventory/items')}
                  sx={{ py: 1.5 }}
                >
                  View Low Stock ({stats.lowStockItems})
                </Button>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
