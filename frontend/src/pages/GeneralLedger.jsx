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
  Autocomplete,
} from '@mui/material'
import {
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material'
import { ledgerAPI, accountsAPI } from '../api/api'

export default function GeneralLedger() {
  const [entries, setEntries] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [accountFilter, setAccountFilter] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAccounts()
    fetchLedgerEntries()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await accountsAPI.list()
      setAccounts(response.data.results || response.data || [])
    } catch (err) {
      console.error('Error fetching accounts:', err)
    }
  }

  const fetchLedgerEntries = async () => {
    try {
      setLoading(true)
      const params = {}
      if (accountFilter) {
        params.account = accountFilter.id
      }
      if (typeFilter !== 'all') {
        params.transaction_type = typeFilter
      }
      const response = await ledgerAPI.list({ params })
      setEntries(response.data.results || response.data || [])
    } catch (err) {
      setError('Failed to load ledger entries. Please try again.')
      console.error('Error fetching ledger entries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLedgerEntries()
  }, [accountFilter, typeFilter])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.account_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

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
          General Ledger
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View all accounting transactions and ledger entries
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
            placeholder="Search ledger entries..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <Autocomplete
            options={accounts}
            getOptionLabel={(option) => `${option.code} - ${option.name}`}
            value={accountFilter}
            onChange={(e, newValue) => setAccountFilter(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filter by Account"
                size="small"
                variant="outlined"
                sx={{ minWidth: 250 }}
              />
            )}
          />
          <TextField
            select
            label="Transaction Type"
            variant="outlined"
            size="small"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="debit">Debit</MenuItem>
            <MenuItem value="credit">Credit</MenuItem>
          </TextField>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                      <AccountBalanceIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                      <Typography color="text.secondary">No ledger entries found</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>{formatDate(entry.transaction_date)}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography fontWeight={600}>
                          {entry.account_code || entry.account}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {entry.account_name || ''}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{entry.description || '-'}</TableCell>
                    <TableCell>
                      {entry.invoice_number ? (
                        <Chip label={entry.invoice_number} size="small" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {entry.transaction_type === 'debit' ? (
                        <Typography fontWeight={600} color="success.main">
                          {formatCurrency(entry.amount)}
                        </Typography>
                      ) : (
                        <Typography color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {entry.transaction_type === 'credit' ? (
                        <Typography fontWeight={600} color="error.main">
                          {formatCurrency(entry.amount)}
                        </Typography>
                      ) : (
                        <Typography color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

