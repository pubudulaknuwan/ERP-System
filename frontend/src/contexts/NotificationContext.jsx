import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { inventoryAPI, invoicesAPI, salesOrdersAPI } from '../api/api'

const NotificationContext = createContext(null)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const alerts = []

      // Check for low stock items
      try {
        const inventoryRes = await inventoryAPI.list()
        const inventoryItems = inventoryRes.data.results || inventoryRes.data || []
        const lowStockItems = inventoryItems.filter(
          (item) => item.quantity < item.minimum_stock_level
        )
        if (lowStockItems.length > 0) {
          alerts.push({
            id: 'low-stock',
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${lowStockItems.length} item(s) are below minimum stock level`,
            timestamp: new Date(),
            read: false,
            action: {
              label: 'View Items',
              path: '/inventory/items',
            },
          })
        }
      } catch (err) {
        console.error('Error fetching inventory alerts:', err)
      }

      // Check for overdue invoices
      try {
        const invoicesRes = await invoicesAPI.list()
        const invoices = invoicesRes.data.results || invoicesRes.data || []
        const now = new Date()
        const overdueInvoices = invoices.filter((invoice) => {
          if (invoice.status === 'paid' || invoice.status === 'cancelled') return false
          const dueDate = new Date(invoice.due_date)
          return dueDate < now
        })
        if (overdueInvoices.length > 0) {
          alerts.push({
            id: 'overdue-invoices',
            type: 'error',
            title: 'Overdue Invoices',
            message: `${overdueInvoices.length} invoice(s) are overdue`,
            timestamp: new Date(),
            read: false,
            action: {
              label: 'View Invoices',
              path: '/finance/invoices',
            },
          })
        }
      } catch (err) {
        console.error('Error fetching invoice alerts:', err)
      }

      // Check for pending orders
      try {
        const ordersRes = await salesOrdersAPI.list()
        const orders = ordersRes.data.results || ordersRes.data || []
        const pendingOrders = orders.filter(
          (order) => order.status === 'draft' || order.status === 'confirmed'
        )
        if (pendingOrders.length > 5) {
          alerts.push({
            id: 'pending-orders',
            type: 'info',
            title: 'Pending Orders',
            message: `${pendingOrders.length} order(s) pending fulfillment`,
            timestamp: new Date(),
            read: false,
            action: {
              label: 'View Orders',
              path: '/sales-orders',
            },
          })
        }
      } catch (err) {
        console.error('Error fetching order alerts:', err)
      }

      setNotifications(alerts)
      setUnreadCount(alerts.filter((n) => !n.read).length)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    setUnreadCount(0)
  }

  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: notification.id || `notif-${Date.now()}`,
      timestamp: notification.timestamp || new Date(),
      read: false,
    }
    setNotifications((prev) => [newNotification, ...prev])
    setUnreadCount((prev) => prev + 1)
  }

  const removeNotification = (id) => {
    setNotifications((prev) => {
      const notif = prev.find((n) => n.id === id)
      if (notif && !notif.read) {
        setUnreadCount((prevCount) => Math.max(0, prevCount - 1))
      }
      return prev.filter((n) => n.id !== id)
    })
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

