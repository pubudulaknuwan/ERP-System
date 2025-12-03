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
  Tabs,
  Tab,
} from '@mui/material'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Download as DownloadIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material'
import { ledgerAPI, accountsAPI, invoicesAPI } from '../api/api'

export default function FinancialReport() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [period, setPeriod] = useState('month')
  const [ledgerEntries, setLedgerEntries] = useState([])
  const [accounts, setAccounts] = useState([])
  const [invoices, setInvoices] = useState([])
  const [reportData, setReportData] = useState({
    profitLoss: {
      revenue: 0,
      expenses: 0,
      netIncome: 0,
      revenueByMonth: [],
    },
    balanceSheet: {
      assets: 0,
      liabilities: 0,
      equity: 0,
    },
  })

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ledgerRes, accountsRes, invoicesRes] = await Promise.all([
        ledgerAPI.list(),
        accountsAPI.list(),
        invoicesAPI.list(),
      ])

      const ledgerData = ledgerRes.data.results || ledgerRes.data || []
      const accountsData = accountsRes.data.results || accountsRes.data || []
      const invoicesData = invoicesRes.data.results || invoicesRes.data || []

      setLedgerEntries(ledgerData)
      setAccounts(accountsData)
      setInvoices(invoicesData)

      processReportData(ledgerData, accountsData, invoicesData)
    } catch (err) {
      setError('Failed to load report data. Please try again.')
      console.error('Error fetching report data:', err)
    } finally {
      setLoading(false)
    }
  }

  const processReportData = (ledgerData, accountsData, invoicesData) => {
    const now = new Date()
    let startDate = new Date()

    switch (period) {
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
        startDate = new Date(0)
    }

    const filteredLedger = ledgerData.filter((entry) => {
      const entryDate = new Date(entry.transaction_date || entry.created_at)
      return entryDate >= startDate
    })

    // Profit & Loss
    let revenue = 0
    let expenses = 0
    const revenueByMonth = {}

    filteredLedger.forEach((entry) => {
      const account = accountsData.find((a) => a.id === entry.account)
      if (!account) return

      const amount = parseFloat(entry.amount || 0)

      if (account.account_type === 'revenue') {
        if (entry.transaction_type === 'credit') {
          revenue += amount
        } else {
          revenue -= amount
        }

        // Revenue by month
        const date = new Date(entry.transaction_date || entry.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!revenueByMonth[monthKey]) {
          revenueByMonth[monthKey] = 0
        }
        if (entry.transaction_type === 'credit') {
          revenueByMonth[monthKey] += amount
        } else {
          revenueByMonth[monthKey] -= amount
        }
      } else if (account.account_type === 'expense') {
        if (entry.transaction_type === 'debit') {
          expenses += amount
        } else {
          expenses -= amount
        }
      }
    })

    const revenueByMonthArray = Object.entries(revenueByMonth)
      .map(([month, revenue]) => ({
        month,
        revenue: parseFloat(revenue.toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const netIncome = revenue - expenses

    // Balance Sheet
    let assets = 0
    let liabilities = 0
    let equity = 0

    ledgerData.forEach((entry) => {
      const account = accountsData.find((a) => a.id === entry.account)
      if (!account) return

      const amount = parseFloat(entry.amount || 0)

      if (account.account_type === 'asset') {
        if (entry.transaction_type === 'debit') {
          assets += amount
        } else {
          assets -= amount
        }
      } else if (account.account_type === 'liability') {
        if (entry.transaction_type === 'credit') {
          liabilities += amount
        } else {
          liabilities -= amount
        }
      } else if (account.account_type === 'equity') {
        if (entry.transaction_type === 'credit') {
          equity += amount
        } else {
          equity -= amount
        }
      }
    })

    setReportData({
      profitLoss: {
        revenue,
        expenses,
        netIncome,
        revenueByMonth: revenueByMonthArray,
      },
      balanceSheet: {
        assets: Math.max(0, assets),
        liabilities: Math.max(0, liabilities),
        equity: Math.max(0, equity),
      },
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  const exportToCSV = () => {
    const reportType = tabValue === 0 ? 'profit-loss' : 'balance-sheet'
    let csvContent = ''

    if (tabValue === 0) {
      // Profit & Loss
      csvContent = [
        'Profit & Loss Statement',
        '',
        'Revenue,' + formatCurrency(reportData.profitLoss.revenue),
        'Expenses,' + formatCurrency(reportData.profitLoss.expenses),
        'Net Income,' + formatCurrency(reportData.profitLoss.netIncome),
      ].join('\n')
    } else {
      // Balance Sheet
      csvContent = [
        'Balance Sheet',
        '',
        'Assets,' + formatCurrency(reportData.balanceSheet.assets),
        'Liabilities,' + formatCurrency(reportData.balanceSheet.liabilities),
        'Equity,' + formatCurrency(reportData.balanceSheet.equity),
        'Total,' + formatCurrency(
          reportData.balanceSheet.assets +
            reportData.balanceSheet.liabilities +
            reportData.balanceSheet.equity
        ),
      ].join('\n')
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-report-${reportType}-${period}-${new Date().toISOString().split('T')[0]}.csv`
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
          Financial Reports
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

      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Profit & Loss" />
          <Tab label="Balance Sheet" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {formatCurrency(reportData.profitLoss.revenue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2" gutterBottom>
                  Total Expenses
                </Typography>
                <Typography variant="h5" fontWeight={700} color="error.main">
                  {formatCurrency(reportData.profitLoss.expenses)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2" gutterBottom>
                  Net Income
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color={
                    reportData.profitLoss.netIncome >= 0 ? 'success.main' : 'error.main'
                  }
                >
                  {formatCurrency(reportData.profitLoss.netIncome)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Revenue Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.profitLoss.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Profit & Loss Statement
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Typography fontWeight={600}>Revenue</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600} color="success.main">
                          {formatCurrency(reportData.profitLoss.revenue)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography fontWeight={600}>Expenses</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600} color="error.main">
                          {formatCurrency(reportData.profitLoss.expenses)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography variant="h6" fontWeight={700}>
                          Net Income
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color={
                            reportData.profitLoss.netIncome >= 0
                              ? 'success.main'
                              : 'error.main'
                          }
                        >
                          {formatCurrency(reportData.profitLoss.netIncome)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2" gutterBottom>
                  Total Assets
                </Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {formatCurrency(reportData.balanceSheet.assets)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2" gutterBottom>
                  Total Liabilities
                </Typography>
                <Typography variant="h5" fontWeight={700} color="error.main">
                  {formatCurrency(reportData.balanceSheet.liabilities)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2" gutterBottom>
                  Total Equity
                </Typography>
                <Typography variant="h5" fontWeight={700} color="info.main">
                  {formatCurrency(reportData.balanceSheet.equity)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Balance Sheet
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Typography fontWeight={600}>Assets</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600} color="success.main">
                          {formatCurrency(reportData.balanceSheet.assets)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography fontWeight={600}>Liabilities</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600} color="error.main">
                          {formatCurrency(reportData.balanceSheet.liabilities)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography fontWeight={600}>Equity</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600} color="info.main">
                          {formatCurrency(reportData.balanceSheet.equity)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography variant="h6" fontWeight={700}>
                          Total
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" fontWeight={700}>
                          {formatCurrency(
                            reportData.balanceSheet.assets +
                              reportData.balanceSheet.liabilities +
                              reportData.balanceSheet.equity
                          )}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

