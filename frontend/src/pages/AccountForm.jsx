import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  Autocomplete,
} from '@mui/material'
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material'
import { accountsAPI } from '../api/api'

export default function AccountForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState(null)
  const [parentAccounts, setParentAccounts] = useState([])
  const [selectedParent, setSelectedParent] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    account_type: 'asset',
    parent: '',
    is_active: true,
  })

  useEffect(() => {
    fetchParentAccounts()
    if (isEdit) {
      fetchAccount()
    }
  }, [id])

  const fetchParentAccounts = async () => {
    try {
      const response = await accountsAPI.list()
      const accounts = response.data.results || response.data || []
      // Filter out current account if editing
      const availableAccounts = isEdit
        ? accounts.filter((acc) => acc.id !== parseInt(id))
        : accounts
      setParentAccounts(availableAccounts)
    } catch (err) {
      console.error('Error fetching parent accounts:', err)
    }
  }

  const fetchAccount = async () => {
    try {
      setFetching(true)
      const response = await accountsAPI.get(id)
      const account = response.data
      setFormData({
        code: account.code || '',
        name: account.name || '',
        account_type: account.account_type || 'asset',
        parent: account.parent || '',
        is_active: account.is_active !== undefined ? account.is_active : true,
      })
      if (account.parent) {
        const parent = parentAccounts.find((acc) => acc.id === account.parent)
        if (parent) {
          setSelectedParent(parent)
        }
      }
    } catch (err) {
      setError('Failed to load account. Please try again.')
      console.error('Error fetching account:', err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (selectedParent) {
      setFormData((prev) => ({
        ...prev,
        parent: selectedParent.id,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        parent: '',
      }))
    }
  }, [selectedParent])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const extractErrorMessage = (error) => {
    if (typeof error === 'string') return error
    if (error?.response?.data) {
      const data = error.response.data
      if (typeof data === 'string') return data
      if (data.detail) return data.detail
      if (data.message) return data.message
      const fieldErrors = Object.entries(data)
        .map(([field, messages]) => {
          if (Array.isArray(messages)) {
            return `${field}: ${messages.join(', ')}`
          }
          return `${field}: ${messages}`
        })
        .join('; ')
      if (fieldErrors) return fieldErrors
    }
    return 'An error occurred. Please try again.'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const submitData = { ...formData }
      if (!submitData.parent) {
        delete submitData.parent
      }

      if (isEdit) {
        await accountsAPI.update(id, submitData)
      } else {
        await accountsAPI.create(submitData)
      }
      navigate('/finance/accounts')
    } catch (err) {
      const errorMsg = extractErrorMessage(err)
      setError(errorMsg)
      console.error('Error saving account:', err)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/finance/accounts')}
          sx={{ minWidth: 'auto' }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight={700}>
          {isEdit ? 'Edit Account' : 'Create New Account'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Account Code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                variant="outlined"
                helperText="Unique code for the account (e.g., 1000, 2000)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Account Type"
                name="account_type"
                value={formData.account_type}
                onChange={handleChange}
                required
                variant="outlined"
              >
                <MenuItem value="asset">Asset</MenuItem>
                <MenuItem value="liability">Liability</MenuItem>
                <MenuItem value="equity">Equity</MenuItem>
                <MenuItem value="revenue">Revenue</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={parentAccounts}
                getOptionLabel={(option) =>
                  `${option.code} - ${option.name} (${option.account_type})`
                }
                value={selectedParent}
                onChange={(e, newValue) => setSelectedParent(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Parent Account (Optional)"
                    helperText="Select a parent account to create a hierarchical structure"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Status"
                name="is_active"
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: e.target.value === 'active',
                  }))
                }
                variant="outlined"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/finance/accounts')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

