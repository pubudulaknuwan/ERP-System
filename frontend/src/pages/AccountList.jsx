import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  Button,
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
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  AccountTree as AccountTreeIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { accountsAPI } from '../api/api'

export default function AccountList() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await accountsAPI.list()
      setAccounts(response.data.results || response.data || [])
    } catch (err) {
      setError('Failed to load accounts. Please try again.')
      console.error('Error fetching accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  const getAccountTypeColor = (type) => {
    const colors = {
      asset: 'success',
      liability: 'error',
      equity: 'info',
      revenue: 'primary',
      expense: 'warning',
    }
    return colors[type] || 'default'
  }

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || account.account_type === typeFilter
    return matchesSearch && matchesType
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Chart of Accounts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/finance/accounts/new')}
        >
          Add Account
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" gap={2} mb={3}>
          <TextField
            placeholder="Search accounts..."
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
            sx={{ flexGrow: 1 }}
          />
          <TextField
            select
            label="Account Type"
            variant="outlined"
            size="small"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="asset">Asset</MenuItem>
            <MenuItem value="liability">Liability</MenuItem>
            <MenuItem value="equity">Equity</MenuItem>
            <MenuItem value="revenue">Revenue</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
          </TextField>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account Code</TableCell>
                <TableCell>Account Name</TableCell>
                <TableCell>Account Type</TableCell>
                <TableCell>Parent Account</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                      <AccountTreeIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                      <Typography color="text.secondary">No accounts found</Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/finance/accounts/new')}
                      >
                        Create First Account
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{account.code}</Typography>
                    </TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={account.account_type?.toUpperCase() || 'N/A'}
                        color={getAccountTypeColor(account.account_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{account.parent ? `${account.parent.code} - ${account.parent.name}` : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={account.is_active ? 'Active' : 'Inactive'}
                        color={account.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/finance/accounts/${account.id}/edit`)}
                      >
                        Edit
                      </Button>
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

