import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
} from '@mui/material'
import {
  Search as SearchIcon,
  History as HistoryIcon,
} from '@mui/icons-material'
import { auditLogsAPI } from '../api/api'

export default function AuditLogList() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [modelFilter, setModelFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter, modelFilter])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        ...(actionFilter !== 'all' && { action: actionFilter }),
        ...(modelFilter !== 'all' && { model_name: modelFilter }),
        ...(searchTerm && { search: searchTerm }),
      }
      const response = await auditLogsAPI.list(params)
      setLogs(response.data.results || response.data || [])
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 20))
      }
    } catch (err) {
      setError('Failed to load audit logs. Please try again.')
      console.error('Error fetching audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    if (e.target.value === '') {
      fetchLogs()
    }
  }

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      fetchLogs()
    }
  }

  const getActionColor = (action) => {
    const colors = {
      create: 'success',
      update: 'info',
      delete: 'error',
      view: 'default',
      login: 'primary',
      logout: 'secondary',
      export: 'warning',
      print: 'warning',
    }
    return colors[action] || 'default'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && logs.length === 0) {
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
          Audit Logs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track all user activities and system changes
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            placeholder="Search logs..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            onKeyPress={handleSearchSubmit}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <TextField
            select
            label="Action"
            variant="outlined"
            size="small"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(1)
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All Actions</MenuItem>
            <MenuItem value="create">Create</MenuItem>
            <MenuItem value="update">Update</MenuItem>
            <MenuItem value="delete">Delete</MenuItem>
            <MenuItem value="view">View</MenuItem>
            <MenuItem value="login">Login</MenuItem>
            <MenuItem value="logout">Logout</MenuItem>
            <MenuItem value="export">Export</MenuItem>
            <MenuItem value="print">Print</MenuItem>
          </TextField>
          <TextField
            select
            label="Model"
            variant="outlined"
            size="small"
            value={modelFilter}
            onChange={(e) => {
              setModelFilter(e.target.value)
              setPage(1)
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All Models</MenuItem>
            <MenuItem value="SalesOrder">Sales Order</MenuItem>
            <MenuItem value="Product">Product</MenuItem>
            <MenuItem value="Customer">Customer</MenuItem>
            <MenuItem value="Invoice">Invoice</MenuItem>
            <MenuItem value="User">User</MenuItem>
            <MenuItem value="InventoryItem">Inventory Item</MenuItem>
          </TextField>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Object</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                      <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                      <Typography color="text.secondary">No audit logs found</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{formatDate(log.timestamp)}</TableCell>
                    <TableCell>{log.user_username || log.user || 'System'}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.action?.toUpperCase() || 'N/A'}
                        color={getActionColor(log.action)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.model_name || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {log.object_repr || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{log.ip_address || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }} color="text.secondary">
                        {log.notes || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>
    </Box>
  )
}

