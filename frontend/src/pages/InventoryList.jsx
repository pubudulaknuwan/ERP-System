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
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import WarningIcon from '@mui/icons-material/Warning'
import { inventoryAPI, productsAPI, warehousesAPI } from '../api/api'

export default function InventoryList() {
  const navigate = useNavigate()
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])

  useEffect(() => {
    fetchDropdownData()
    fetchInventory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Only refetch if filters have been set (not on initial mount)
    if (productFilter || warehouseFilter) {
      fetchInventory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productFilter, warehouseFilter])

  const fetchDropdownData = async () => {
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        productsAPI.list(),
        warehousesAPI.list(),
      ])
      setProducts(productsRes.data.results || productsRes.data || [])
      setWarehouses(warehousesRes.data.results || warehousesRes.data || [])
    } catch (err) {
      console.error('Error fetching dropdown data:', err)
    }
  }

  const fetchInventory = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (productFilter) params.product = productFilter
      if (warehouseFilter) params.warehouse = warehouseFilter
      if (searchTerm) params.search = searchTerm

      const response = await inventoryAPI.list(params)
      setInventory(response.data.results || response.data || [])
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError('Failed to load inventory. Please try again.')
      setInventory([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchInventory()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory record?')) {
      return
    }

    try {
      await inventoryAPI.delete(id)
      setInventory(inventory.filter((item) => item.id !== id))
    } catch (err) {
      console.error('Error deleting inventory:', err)
      alert('Failed to delete inventory record. Please try again.')
    }
  }

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
            Inventory
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Track stock levels and manage inventory
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/inventory/items/new')}
          sx={{
            backgroundColor: 'white',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
          }}
        >
          New Inventory Record
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
        <Box display="flex" gap={2} flexWrap="wrap">
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: 200 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
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
            label="Product"
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value)
            }}
            onBlur={fetchInventory}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Products</MenuItem>
            {products.map((product) => (
              <MenuItem key={product.id} value={product.id}>
                {product.sku} - {product.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Warehouse"
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value)
            }}
            onBlur={fetchInventory}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Warehouses</MenuItem>
            {warehouses.map((warehouse) => (
              <MenuItem key={warehouse.id} value={warehouse.id}>
                {warehouse.code}
              </MenuItem>
            ))}
          </TextField>
        </Box>
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
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Warehouse</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Quantity
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Min Stock
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Reorder Qty
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : inventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No inventory records found
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map((item) => {
                  const needsReorder = item.quantity < item.minimum_stock_level
                  return (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        '&:last-child td': { border: 0 },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {item.product_sku || item.product} - {item.product_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.warehouse_code || item.warehouse}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color={needsReorder ? 'error.main' : 'success.main'}
                        >
                          {item.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {item.minimum_stock_level}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {item.reorder_quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {needsReorder ? (
                          <Chip
                            icon={<WarningIcon />}
                            label="Low Stock"
                            color="warning"
                            size="small"
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        ) : (
                          <Chip
                            label="In Stock"
                            color="success"
                            size="small"
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/inventory/items/${item.id}/edit`)}
                          title="Edit"
                          sx={{
                            color: 'primary.main',
                            '&:hover': {
                              backgroundColor: 'primary.light',
                              color: 'white',
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(item.id)}
                          title="Delete"
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'white',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  )
}

