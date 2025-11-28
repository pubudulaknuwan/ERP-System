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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import { warehousesAPI } from '../api/api'

export default function WarehouseList() {
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    setLoading(true)
    setError('')
    try {
      const params = searchTerm ? { search: searchTerm } : {}
      const response = await warehousesAPI.list(params)
      setWarehouses(response.data.results || response.data || [])
    } catch (err) {
      console.error('Error fetching warehouses:', err)
      setError('Failed to load warehouses. Please try again.')
      setWarehouses([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchWarehouses()
  }

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete warehouse "${code}"?`)) {
      return
    }

    try {
      await warehousesAPI.delete(id)
      setWarehouses(warehouses.filter((w) => w.id !== id))
    } catch (err) {
      console.error('Error deleting warehouse:', err)
      alert('Failed to delete warehouse. Please try again.')
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
            Warehouses
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Manage warehouse locations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/inventory/warehouses/new')}
          sx={{
            backgroundColor: 'white',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
          }}
        >
          New Warehouse
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
        <form onSubmit={handleSearchSubmit}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by code or name..."
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
                <TableCell sx={{ fontWeight: 600, py: 2 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : warehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No warehouses found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                warehouses.map((warehouse) => (
                  <TableRow
                    key={warehouse.id}
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
                        {warehouse.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{warehouse.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {warehouse.address || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={warehouse.is_active ? 'Active' : 'Inactive'}
                        color={warehouse.is_active ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/inventory/warehouses/${warehouse.id}/edit`)}
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
                        onClick={() => handleDelete(warehouse.id, warehouse.code)}
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  )
}

