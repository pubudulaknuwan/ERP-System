import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material'
import { financeDashboardAPI, invoicesAPI } from '../api/api'

export default function FinanceDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [kpis, setKpis] = useState({
    total_revenue_month: 0,
    total_revenue_year: 0,
    pending_invoices: 0,
    total_accounts_receivable: 0,
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [kpisResponse, invoicesResponse] = await Promise.all([
        financeDashboardAPI.getKPIs().catch(() => ({ data: {} })),
        invoicesAPI.list().catch(() => ({ data: { results: [] } })),
      ])

      setKpis(kpisResponse.data || {})
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.')
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
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
          Finance Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of financial performance and key metrics
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(kpis.total_revenue_month)}
            icon={<AttachMoneyIcon sx={{ fontSize: 32 }} />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Yearly Revenue"
            value={formatCurrency(kpis.total_revenue_year)}
            icon={<TrendingUpIcon sx={{ fontSize: 32 }} />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Invoices"
            value={kpis.pending_invoices}
            icon={<ReceiptIcon sx={{ fontSize: 32 }} />}
            color="#f59e0b"
            onClick={() => navigate('/finance/invoices?status=sent&status=draft')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Accounts Receivable"
            value={formatCurrency(kpis.total_accounts_receivable)}
            icon={<AccountBalanceIcon sx={{ fontSize: 32 }} />}
            color="#7c3aed"
            onClick={() => navigate('/finance/invoices?status=sent&status=draft')}
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
          <Box
            component="button"
            onClick={() => navigate('/finance/invoices/new')}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              backgroundColor: 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'primary.main',
              },
              textAlign: 'left',
              width: '100%',
              maxWidth: 200,
            }}
          >
            <ReceiptIcon sx={{ mb: 1, color: 'primary.main' }} />
            <Typography variant="body2" fontWeight={600}>
              Create Invoice
            </Typography>
            <Typography variant="caption" color="text.secondary">
              From fulfilled orders
            </Typography>
          </Box>
          <Box
            component="button"
            onClick={() => navigate('/finance/invoices')}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              backgroundColor: 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'primary.main',
              },
              textAlign: 'left',
              width: '100%',
              maxWidth: 200,
            }}
          >
            <ReceiptIcon sx={{ mb: 1, color: 'primary.main' }} />
            <Typography variant="body2" fontWeight={600}>
              View All Invoices
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Manage invoices
            </Typography>
          </Box>
          <Box
            component="button"
            onClick={() => navigate('/finance/accounts')}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              backgroundColor: 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'primary.main',
              },
              textAlign: 'left',
              width: '100%',
              maxWidth: 200,
            }}
          >
            <AccountBalanceIcon sx={{ mb: 1, color: 'primary.main' }} />
            <Typography variant="body2" fontWeight={600}>
              Chart of Accounts
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Manage accounts
            </Typography>
          </Box>
          <Box
            component="button"
            onClick={() => navigate('/finance/ledger')}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              backgroundColor: 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'primary.main',
              },
              textAlign: 'left',
              width: '100%',
              maxWidth: 200,
            }}
          >
            <AccountBalanceIcon sx={{ mb: 1, color: 'primary.main' }} />
            <Typography variant="body2" fontWeight={600}>
              General Ledger
            </Typography>
            <Typography variant="caption" color="text.secondary">
              View transactions
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}

