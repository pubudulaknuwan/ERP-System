import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SalesOrderForm from './pages/SalesOrderForm'
import SalesOrderList from './pages/SalesOrderList'
import SalesOrderDetails from './pages/SalesOrderDetails'
import ProductList from './pages/ProductList'
import ProductForm from './pages/ProductForm'
import WarehouseList from './pages/WarehouseList'
import WarehouseForm from './pages/WarehouseForm'
import InventoryList from './pages/InventoryList'
import InventoryForm from './pages/InventoryForm'
import CustomerList from './pages/CustomerList'
import CustomerForm from './pages/CustomerForm'
import CustomerDetails from './pages/CustomerDetails'
import AdminDashboard from './pages/AdminDashboard'
import UserList from './pages/UserList'
import UserForm from './pages/UserForm'
import InvoiceList from './pages/InvoiceList'
import InvoiceDetails from './pages/InvoiceDetails'
import InvoiceForm from './pages/InvoiceForm'
import AccountList from './pages/AccountList'
import AccountForm from './pages/AccountForm'
import GeneralLedger from './pages/GeneralLedger'
import FinanceDashboard from './pages/FinanceDashboard'
import SalesReport from './pages/SalesReport'
import InventoryReport from './pages/InventoryReport'
import FinancialReport from './pages/FinancialReport'
import AuditLogList from './pages/AuditLogList'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1e40af',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c3aed',
      light: '#8b5cf6',
      dark: '#6d28d9',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
        elevation3: {
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.9375rem',
        },
        contained: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8fafc',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: '#475569',
          fontSize: '0.875rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
  },
})

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  if (user?.role !== 'admin' && !user?.is_superuser) {
    return <Navigate to="/" />
  }
  return children
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <NotificationProvider>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="sales-orders" element={<SalesOrderList />} />
              <Route path="sales-orders/new" element={<SalesOrderForm />} />
              <Route path="sales-orders/:id" element={<SalesOrderDetails />} />
              <Route path="inventory/products" element={<ProductList />} />
              <Route path="inventory/products/new" element={<ProductForm />} />
              <Route path="inventory/products/:id/edit" element={<ProductForm />} />
              <Route path="inventory/warehouses" element={<WarehouseList />} />
              <Route path="inventory/warehouses/new" element={<WarehouseForm />} />
              <Route path="inventory/warehouses/:id/edit" element={<WarehouseForm />} />
              <Route path="inventory/items" element={<InventoryList />} />
              <Route path="inventory/items/new" element={<InventoryForm />} />
              <Route path="inventory/items/:id/edit" element={<InventoryForm />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="customers/new" element={<CustomerForm />} />
              <Route path="customers/:id" element={<CustomerDetails />} />
              <Route path="customers/:id/edit" element={<CustomerForm />} />
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <AdminRoute>
                    <UserList />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/users/new"
                element={
                  <AdminRoute>
                    <UserForm />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/users/:id/edit"
                element={
                  <AdminRoute>
                    <UserForm />
                  </AdminRoute>
                }
              />
              <Route path="finance" element={<FinanceDashboard />} />
              <Route path="finance/invoices" element={<InvoiceList />} />
              <Route path="finance/invoices/new" element={<InvoiceForm />} />
              <Route path="finance/invoices/:id" element={<InvoiceDetails />} />
              <Route path="finance/invoices/:id/edit" element={<InvoiceForm />} />
              <Route path="finance/accounts" element={<AccountList />} />
              <Route path="finance/accounts/new" element={<AccountForm />} />
              <Route path="finance/accounts/:id/edit" element={<AccountForm />} />
              <Route path="finance/ledger" element={<GeneralLedger />} />
              <Route path="reports/sales" element={<SalesReport />} />
              <Route path="reports/inventory" element={<InventoryReport />} />
              <Route path="reports/financial" element={<FinancialReport />} />
              <Route
                path="admin/audit-logs"
                element={
                  <AdminRoute>
                    <AuditLogList />
                  </AdminRoute>
                }
              />
            </Route>
          </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App

