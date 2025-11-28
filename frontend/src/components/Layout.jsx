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

const drawerWidth = 240

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Sales Orders', icon: <ShoppingCartIcon />, path: '/sales-orders' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Products', icon: <CategoryIcon />, path: '/inventory/products' },
  { text: 'Warehouses', icon: <WarehouseIcon />, path: '/inventory/warehouses' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory/items' },
]

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
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#ffffff',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', pt: 2 }}>
          <List>
            {menuItems.map((item) => {
              const isSelected =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + '/')
              return (
                <ListItem key={item.text} disablePadding sx={{ px: 1, mb: 0.5 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'white',
                        },
                      },
                      '&:hover': {
                        backgroundColor: isSelected ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isSelected ? 'white' : 'text.secondary',
                        minWidth: 40,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: isSelected ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
          <Divider sx={{ my: 2 }} />
          <List>
            <ListItem disablePadding sx={{ px: 1 }}>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'error.light',
                    color: 'error.dark',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          </List>
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

