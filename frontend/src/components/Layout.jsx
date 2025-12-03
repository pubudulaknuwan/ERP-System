import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import DashboardIcon from '@mui/icons-material/Dashboard'
import LogoutIcon from '@mui/icons-material/Logout'
import InventoryIcon from '@mui/icons-material/Inventory'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import CategoryIcon from '@mui/icons-material/Category'
import PeopleIcon from '@mui/icons-material/People'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import AssessmentIcon from '@mui/icons-material/Assessment'
import HistoryIcon from '@mui/icons-material/History'
import NotificationCenter from './NotificationCenter'

const drawerWidth = 260

const getMenuItems = (userRole) => {
  const mainItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', color: '#3b82f6' },
    { text: 'Sales Orders', icon: <ShoppingCartIcon />, path: '/sales-orders', color: '#10b981' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/customers', color: '#8b5cf6' },
  ]

  const inventoryItems = [
    { text: 'Products', icon: <CategoryIcon />, path: '/inventory/products', color: '#f59e0b' },
    { text: 'Warehouses', icon: <WarehouseIcon />, path: '/inventory/warehouses', color: '#ec4899' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory/items', color: '#06b6d4' },
  ]

  const financeItems = [
    { text: 'Finance', icon: <AccountBalanceIcon />, path: '/finance', color: '#14b8a6' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports/sales', color: '#6366f1' },
  ]

  const adminItems = []
  if (userRole === 'admin' || userRole === 'Administrator') {
    adminItems.push({
      text: 'Admin Panel',
      icon: <AdminPanelSettingsIcon />,
      path: '/admin',
      color: '#ef4444',
    })
    adminItems.push({
      text: 'Audit Logs',
      icon: <HistoryIcon />,
      path: '/admin/audit-logs',
      color: '#64748b',
    })
  }

  return { mainItems, inventoryItems, financeItems, adminItems }
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            EnterprisePro ERP
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <NotificationCenter />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.5,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user?.username}
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: 'none',
            backgroundColor: '#f8fafc',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', pt: 2, px: 1.5 }}>
          {(() => {
            const { mainItems, inventoryItems, financeItems, adminItems } = getMenuItems(user?.role)
            
            const MenuItemComponent = ({ item, isSelected }) => (
              <ListItem disablePadding sx={{ mb: 0.75 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 3,
                    py: 1.25,
                    px: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: isSelected ? 4 : 0,
                      backgroundColor: item.color,
                      borderRadius: '0 4px 4px 0',
                      transition: 'width 0.3s ease',
                    },
                    background: isSelected
                      ? `linear-gradient(135deg, ${item.color}15 0%, ${item.color}05 100%)`
                      : 'transparent',
                    border: isSelected ? `1px solid ${item.color}20` : '1px solid transparent',
                    boxShadow: isSelected
                      ? `0 2px 8px ${item.color}15, 0 1px 3px ${item.color}10`
                      : 'none',
                    '&:hover': {
                      backgroundColor: isSelected
                        ? `${item.color}20`
                        : `${item.color}08`,
                      borderColor: `${item.color}30`,
                      transform: 'translateX(4px)',
                      boxShadow: `0 4px 12px ${item.color}20, 0 2px 4px ${item.color}10`,
                      '&::before': {
                        width: 4,
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isSelected ? item.color : 'text.secondary',
                      minWidth: 44,
                      transition: 'all 0.3s ease',
                      '& svg': {
                        fontSize: 24,
                      },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isSelected ? 700 : 600,
                      fontSize: '0.9375rem',
                      color: isSelected ? item.color : 'text.primary',
                      transition: 'all 0.3s ease',
                    }}
                  />
                  {isSelected && (
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 12,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        boxShadow: `0 0 8px ${item.color}60`,
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%, 100%': {
                            opacity: 1,
                            transform: 'scale(1)',
                          },
                          '50%': {
                            opacity: 0.7,
                            transform: 'scale(1.2)',
                          },
                        },
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            )

            return (
              <>
                {/* Main Items */}
                <List sx={{ mb: 2 }}>
                  {mainItems.map((item) => {
                    const isSelected =
                      location.pathname === item.path ||
                      location.pathname.startsWith(item.path + '/')
                    return (
                      <MenuItemComponent key={item.text} item={item} isSelected={isSelected} />
                    )
                  })}
                </List>

                {/* Inventory Section */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      py: 1,
                      color: 'text.secondary',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Inventory
                  </Typography>
                  <List>
                    {inventoryItems.map((item) => {
                      const isSelected =
                        location.pathname === item.path ||
                        location.pathname.startsWith(item.path + '/')
                      return (
                        <MenuItemComponent key={item.text} item={item} isSelected={isSelected} />
                      )
                    })}
                  </List>
                </Box>

                {/* Finance Section */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      py: 1,
                      color: 'text.secondary',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Finance & Reports
                  </Typography>
                  <List>
                    {financeItems.map((item) => {
                      const isSelected =
                        location.pathname === item.path ||
                        location.pathname.startsWith(item.path + '/')
                      return (
                        <MenuItemComponent key={item.text} item={item} isSelected={isSelected} />
                      )
                    })}
                  </List>
                </Box>

                {/* Admin Section */}
                {adminItems.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        px: 2,
                        py: 1,
                        color: 'text.secondary',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Administration
                    </Typography>
                    <List>
                      {adminItems.map((item) => {
                        const isSelected =
                          location.pathname === item.path ||
                          location.pathname.startsWith(item.path + '/')
                        return (
                          <MenuItemComponent key={item.text} item={item} isSelected={isSelected} />
                        )
                      })}
                    </List>
                  </Box>
                )}

                <Divider sx={{ my: 2, borderColor: 'divider', opacity: 0.5 }} />

                {/* Logout */}
                <List>
                  <ListItem disablePadding sx={{ mb: 0.75 }}>
                    <ListItemButton
                      onClick={handleLogout}
                      sx={{
                        borderRadius: 3,
                        py: 1.25,
                        px: 2,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        backgroundColor: 'transparent',
                        border: '1px solid transparent',
                        '&:hover': {
                          backgroundColor: 'error.light',
                          borderColor: 'error.main',
                          transform: 'translateX(4px)',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: 'error.main',
                          minWidth: 44,
                          '& svg': {
                            fontSize: 24,
                          },
                        }}
                      >
                        <LogoutIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Logout"
                        primaryTypographyProps={{
                          fontWeight: 600,
                          fontSize: '0.9375rem',
                          color: 'error.main',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </List>
              </>
            )
          })()}
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}

