import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material'
import { salesOrdersAPI, customersAPI } from '../api/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#ec4899']

export default function SalesReport() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('month')
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    revenueByMonth: [],
    revenueByCustomer: [],
    ordersByStatus: [],
  })

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ordersRes, customersRes] = await Promise.all([
        salesOrdersAPI.list(),
        customersAPI.list(),
      ])

      const ordersData = ordersRes.data.results || ordersRes.data || []
      const customersData = customersRes.data.results || customersRes.data || []

      setOrders(ordersData)
      setCustomers(customersData)

      processReportData(ordersData, customersData)
    } catch (err) {
      setError('Failed to load report data. Please try again.')
      console.error('Error fetching report data:', err)
    } finally {
      setLoading(false)
    }
  }

  const processReportData = (ordersData, customersData) => {
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate = new Date(0) // All time
    }

    const filteredOrders = ordersData.filter((order) => {
      const orderDate = new Date(order.order_date || order.created_at)
      return orderDate >= startDate && (order.status === 'fulfilled' || order.status === 'invoiced')
    })

    // Calculate totals
    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + parseFloat(order.total_amount || 0),
      0
    )
    const totalOrders = filteredOrders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Revenue by month
    const revenueByMonth = {}
    filteredOrders.forEach((order) => {
      const date = new Date(order.order_date || order.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!revenueByMonth[monthKey]) {
        revenueByMonth[monthKey] = 0
      }
      revenueByMonth[monthKey] += parseFloat(order.total_amount || 0)
    })

    const revenueByMonthArray = Object.entries(revenueByMonth)
      .map(([month, revenue]) => ({
        month,
        revenue: parseFloat(revenue.toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Revenue by customer
    const revenueByCustomer = {}
    filteredOrders.forEach((order) => {
      const customerId = order.customer || order.customer_name
      const customerName =
        customersData.find((c) => c.id === customerId)?.name || order.customer_name || 'Unknown'
      if (!revenueByCustomer[customerName]) {
        revenueByCustomer[customerName] = 0
      }
      revenueByCustomer[customerName] += parseFloat(order.total_amount || 0)
    })

    const revenueByCustomerArray = Object.entries(revenueByCustomer)
      .map(([name, revenue]) => ({
        name,
        value: parseFloat(revenue.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 customers

    // Orders by status
    const ordersByStatus = {}
    ordersData.forEach((order) => {
      const status = order.status || 'draft'
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1
    })

    const ordersByStatusArray = Object.entries(ordersByStatus).map(([status, count]) => ({
      status: status.toUpperCase(),
      count,
    }))

    setReportData({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueByMonth: revenueByMonthArray,
      revenueByCustomer: revenueByCustomerArray,
      ordersByStatus: ordersByStatusArray,
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  const exportToCSV = () => {
    const headers = ['Month', 'Revenue']
    const rows = reportData.revenueByMonth.map((item) => [
      item.month,
      item.revenue.toFixed(2),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-report-${period}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Sales Report
        </Typography>
        <Box display="flex" gap={2}>
          <TextField
            select
            label="Period"
            variant="outlined"
            size="small"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToCSV}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                {formatCurrency(reportData.totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h5" fontWeight={700} color="info.main">
                {reportData.totalOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Average Order Value
              </Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">
                {formatCurrency(reportData.averageOrderValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Conversion Rate
              </Typography>
              <Typography variant="h5" fontWeight={700} color="warning.main">
                {orders.length > 0
                  ? ((reportData.totalOrders / orders.length) * 100).toFixed(1)
                  : 0}
                %
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Revenue Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.revenueByMonth}>
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
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Orders by Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {reportData.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Top Customers by Revenue
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.revenueByCustomer}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="value" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

