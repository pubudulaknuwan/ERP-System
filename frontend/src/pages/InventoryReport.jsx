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
  Chip,
} from '@mui/material'
import {
  BarChart,
  Bar,
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
  Inventory as InventoryIcon,
} from '@mui/icons-material'
import { inventoryAPI, productsAPI, warehousesAPI } from '../api/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#ec4899']

export default function InventoryReport() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inventory, setInventory] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [reportData, setReportData] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: [],
    stockByWarehouse: [],
    stockByProduct: [],
    stockDistribution: [],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [inventoryRes, productsRes, warehousesRes] = await Promise.all([
        inventoryAPI.list(),
        productsAPI.list(),
        warehousesAPI.list(),
      ])

      const inventoryData = inventoryRes.data.results || inventoryRes.data || []
      const productsData = productsRes.data.results || productsRes.data || []
      const warehousesData = warehousesRes.data.results || warehousesRes.data || []

      setInventory(inventoryData)
      setProducts(productsData)
      setWarehouses(warehousesData)

      processReportData(inventoryData, productsData, warehousesData)
    } catch (err) {
      setError('Failed to load report data. Please try again.')
      console.error('Error fetching report data:', err)
    } finally {
      setLoading(false)
    }
  }

  const processReportData = (inventoryData, productsData, warehousesData) => {
    // Calculate totals
    let totalValue = 0
    const lowStockItems = []
    const stockByWarehouse = {}
    const stockByProduct = {}
    const stockDistribution = {
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
    }

    inventoryData.forEach((item) => {
      const product = productsData.find((p) => p.id === item.product)
      const warehouse = warehousesData.find((w) => w.id === item.warehouse)
      const unitPrice = product?.unit_price || 0
      const itemValue = (item.quantity || 0) * unitPrice
      totalValue += itemValue

      // Low stock items
      if (item.quantity < item.minimum_stock_level) {
        lowStockItems.push({
          ...item,
          product_name: product?.name || 'Unknown',
          warehouse_name: warehouse?.name || 'Unknown',
          unit_price: unitPrice,
          value: itemValue,
        })
      }

      // Stock by warehouse
      const warehouseName = warehouse?.name || 'Unknown'
      if (!stockByWarehouse[warehouseName]) {
        stockByWarehouse[warehouseName] = { quantity: 0, value: 0 }
      }
      stockByWarehouse[warehouseName].quantity += item.quantity || 0
      stockByWarehouse[warehouseName].value += itemValue

      // Stock by product
      const productName = product?.name || 'Unknown'
      if (!stockByProduct[productName]) {
        stockByProduct[productName] = { quantity: 0, value: 0 }
      }
      stockByProduct[productName].quantity += item.quantity || 0
      stockByProduct[productName].value += itemValue

      // Stock distribution
      if (item.quantity === 0) {
        stockDistribution.outOfStock++
      } else if (item.quantity < item.minimum_stock_level) {
        stockDistribution.lowStock++
      } else {
        stockDistribution.inStock++
      }
    })

    const stockByWarehouseArray = Object.entries(stockByWarehouse)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        value: parseFloat(data.value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)

    const stockByProductArray = Object.entries(stockByProduct)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        value: parseFloat(data.value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 products

    const stockDistributionArray = [
      { name: 'In Stock', value: stockDistribution.inStock },
      { name: 'Low Stock', value: stockDistribution.lowStock },
      { name: 'Out of Stock', value: stockDistribution.outOfStock },
    ]

    setReportData({
      totalItems: inventoryData.length,
      totalValue,
      lowStockItems: lowStockItems.sort((a, b) => a.quantity - b.quantity),
      stockByWarehouse: stockByWarehouseArray,
      stockByProduct: stockByProductArray,
      stockDistribution: stockDistributionArray,
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  const exportToCSV = () => {
    const headers = ['Product', 'Warehouse', 'Quantity', 'Min Level', 'Unit Price', 'Value', 'Status']
    const rows = reportData.lowStockItems.map((item) => [
      item.product_name,
      item.warehouse_name,
      item.quantity,
      item.minimum_stock_level,
      item.unit_price.toFixed(2),
      item.value.toFixed(2),
      item.quantity < item.minimum_stock_level ? 'Low Stock' : 'OK',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`
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
          Inventory Report
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={exportToCSV}
        >
          Export CSV
        </Button>
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
                Total Items
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                {reportData.totalItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Inventory Value
              </Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">
                {formatCurrency(reportData.totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Low Stock Items
              </Typography>
              <Typography variant="h5" fontWeight={700} color="error.main">
                {reportData.lowStockItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Warehouses
              </Typography>
              <Typography variant="h5" fontWeight={700} color="info.main">
                {warehouses.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Stock Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.stockDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.stockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Inventory Value by Warehouse
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.stockByWarehouse}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Value" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Top Products by Value
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.stockByProduct}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="value" fill="#10b981" name="Value" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Low Stock Items
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Min Level</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.lowStockItems.slice(0, 5).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.warehouse_name}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{item.minimum_stock_level}</TableCell>
                      <TableCell>
                        <Chip
                          label="Low Stock"
                          color="error"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

