# EnterprisePro ERP System

A comprehensive, production-ready ERP application focused on **Inventory Management, Sales & Order Processing, and Finance Integration**. Built with modern technologies and best practices, designed as a portfolio piece for job interviews.

## 🏗️ Architecture

**Three-Tier Architecture:**
- **Presentation Layer:** React (Vite) with Material UI
- **Business Logic Layer:** Django REST Framework (DRF)
- **Data Layer:** PostgreSQL

## 🛠️ Tech Stack

### Backend
- **Framework:** Django 4.2.7
- **API:** Django REST Framework 3.14.0
- **Authentication:** JWT (djangorestframework-simplejwt)
- **Database:** PostgreSQL
- **CORS:** django-cors-headers

### Frontend
- **Framework:** React 18.2.0
- **Build Tool:** Vite 5.0.8
- **UI Library:** Material UI (MUI) 5.14.20
- **Routing:** React Router DOM 6.20.0
- **HTTP Client:** Axios 1.6.2

## 📦 Core Modules

### 1. Inventory Management
- **Product Master:** SKU, name, pricing, categories
- **Warehouse Management:** Multi-warehouse support
- **Inventory Tracking:** Real-time quantity tracking per product/warehouse
- **Reorder Point Logic:** Automatic alerts when stock falls below minimum levels

### 2. Sales & Order Management
- **Customer Management:** Customer master data
- **Sales Orders:** Complete order lifecycle (Draft → Confirmed → Fulfilled → Invoiced)
- **Order Items:** Multi-line item support with automatic total calculation
- **Inventory Integration:** Automatic inventory decrease on order fulfillment (atomic transactions)

### 3. Finance Module
- **Invoice Generation:** Automatic invoice creation from fulfilled orders
- **Chart of Accounts:** Account management with account types
- **General Ledger:** Double-entry accounting system
- **Dashboard KPIs:** Monthly/yearly revenue, accounts receivable tracking

## 🔐 Security Features

- **JWT Authentication:** Secure token-based authentication
- **Role-Based Access Control (RBAC):** User roles (Admin, Manager, Staff, Viewer)
- **Environment Variables:** Sensitive configuration via `.env` files
- **CORS Protection:** Configured for frontend-backend communication

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 12+
- pip (Python package manager)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE enterprisepro_db;
   ```

6. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

7. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

8. **Run development server:**
   ```bash
   python manage.py runserver
   ```

   Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Create environment file (optional):**
   ```bash
   # Create .env file if you need to override API URL
   echo "VITE_API_BASE_URL=http://localhost:8000" > .env
   ```

4. **Run development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Frontend will be available at `http://localhost:5173`

## 📁 Project Structure

```
ERP System/
├── backend/
│   ├── enterprisepro/          # Django project settings
│   │   ├── settings.py         # Main configuration
│   │   ├── urls.py             # Root URL configuration
│   │   └── wsgi.py
│   ├── accounts/               # Authentication app
│   │   ├── models.py           # Custom User model
│   │   ├── serializers.py
│   │   ├── views.py            # JWT authentication
│   │   └── urls.py
│   ├── inventory/              # Inventory Management
│   │   ├── models.py           # Product, Warehouse, InventoryItem
│   │   ├── serializers.py
│   │   ├── views.py            # ViewSets with reorder alerts
│   │   └── urls.py
│   ├── sales/                  # Sales & Orders
│   │   ├── models.py           # Customer, SalesOrder, SalesOrderItem
│   │   ├── serializers.py      # Transaction handling
│   │   ├── views.py            # Order fulfillment with atomic transactions
│   │   └── urls.py
│   ├── finance/                # Finance Module
│   │   ├── models.py           # Invoice, Account, GeneralLedger
│   │   ├── serializers.py      # Invoice creation with ledger entries
│   │   ├── views.py            # Dashboard KPIs
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   └── Layout.jsx      # Main layout with navigation
│   │   ├── contexts/           # React contexts
│   │   │   └── AuthContext.jsx # Authentication state
│   │   ├── pages/              # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx   # KPI dashboard
│   │   │   ├── SalesOrderForm.jsx  # Complete order creation form
│   │   │   └── SalesOrderList.jsx
│   │   ├── api/                # API client
│   │   │   └── api.js          # Axios configuration & endpoints
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔄 Key Features & Workflows

### Sales Order Creation (Complete Example)

1. **Frontend:** User fills out `SalesOrderForm.jsx`
   - Selects customer, order date
   - Adds multiple line items (product, warehouse, quantity)
   - Unit prices auto-populated from product master
   - Real-time total calculation

2. **Backend:** `SalesOrderViewSet.create()`
   - Validates inventory availability
   - Creates order with items in atomic transaction
   - Calculates total amount
   - Generates unique order number

3. **Order Fulfillment:**
   - Order status: `draft` → `confirmed` → `fulfilled`
   - On fulfillment: Inventory quantities decreased atomically
   - Uses `select_for_update()` for row-level locking
   - Ensures data integrity with `@transaction.atomic`

4. **Invoice Generation:**
   - When order is `fulfilled`, create invoice
   - Updates order status to `invoiced`
   - Creates General Ledger entries (double-entry):
     - Debit: Accounts Receivable
     - Credit: Sales Revenue

### Reorder Point Logic

- `InventoryItem` model has `minimum_stock_level` field
- API endpoint: `GET /api/v1/inventory/inventory-items/reorder_alerts/`
- Returns all items where `quantity < minimum_stock_level`

### Dashboard KPIs

- Endpoint: `GET /api/v1/finance/dashboard/kpis/`
- Returns:
  - Monthly revenue
  - Yearly revenue
  - Pending invoices count
  - Total accounts receivable

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/login/` - Login (get JWT tokens)
- `POST /api/v1/auth/refresh/` - Refresh access token
- `POST /api/v1/auth/register/` - User registration
- `GET /api/v1/auth/me/` - Get current user

### Inventory
- `GET /api/v1/inventory/products/` - List products
- `GET /api/v1/inventory/warehouses/` - List warehouses
- `GET /api/v1/inventory/inventory-items/` - List inventory
- `GET /api/v1/inventory/inventory-items/reorder_alerts/` - Reorder alerts

### Sales
- `GET /api/v1/sales/customers/` - List customers
- `GET /api/v1/sales/orders/` - List sales orders
- `POST /api/v1/sales/orders/` - Create sales order
- `POST /api/v1/sales/orders/{id}/confirm/` - Confirm order
- `POST /api/v1/sales/orders/{id}/fulfill/` - Fulfill order (decrease inventory)

### Finance
- `GET /api/v1/finance/accounts/` - List accounts
- `GET /api/v1/finance/invoices/` - List invoices
- `POST /api/v1/finance/invoices/` - Create invoice
- `GET /api/v1/finance/dashboard/kpis/` - Dashboard KPIs
- `GET /api/v1/finance/ledger/` - General ledger entries

## 🧪 Testing the Application

### 1. Create Test Data

Use Django admin (`http://localhost:8000/admin`) to create:
- Products (with SKU, name, unit price)
- Warehouses
- Inventory Items (link products to warehouses with quantities)
- Customers

### 2. Create a Sales Order

1. Login at `http://localhost:5173/login`
2. Navigate to "Sales Orders" → "New Order"
3. Fill out the form:
   - Select customer
   - Add line items (product, warehouse, quantity)
4. Submit - order created with status "draft"

### 3. Fulfill Order (via API or admin)

```bash
# Confirm order
POST /api/v1/sales/orders/{id}/confirm/

# Fulfill order (decreases inventory)
POST /api/v1/sales/orders/{id}/fulfill/
```

### 4. Create Invoice

```bash
POST /api/v1/finance/invoices/
{
  "sales_order": <fulfilled_order_id>,
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-15"
}
```

## 📊 Database Schema Highlights

- **Normalized Design:** Proper foreign key relationships
- **Unique Constraints:** Order numbers, invoice numbers, SKUs
- **Indexes:** On frequently queried fields (SKU, order_number)
- **Cascading Rules:** Appropriate `on_delete` behaviors
- **Decimal Precision:** Financial amounts use `DecimalField` (not Float)

## 🎯 Interview-Ready Features

This project demonstrates:

✅ **RESTful API Design** - Clean, standard endpoints  
✅ **Transaction Management** - Atomic operations for data integrity  
✅ **Authentication & Authorization** - JWT with RBAC  
✅ **Database Design** - Normalized schema with proper relationships  
✅ **Frontend-Backend Integration** - Complete full-stack workflow  
✅ **Error Handling** - Proper validation and error responses  
✅ **Code Organization** - Modular, maintainable structure  
✅ **Modern Tech Stack** - Industry-standard tools  

## 🔧 Configuration

### Environment Variables (Backend)

Create `backend/.env`:
```env
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=enterprisepro_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

### Environment Variables (Frontend)

Create `frontend/.env` (optional):
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📝 License

This project is created for portfolio and educational purposes.

## 🤝 Contributing

This is a portfolio project. Feel free to fork and extend it for your own learning!

---

**Built with ❤️ for demonstrating enterprise-level full-stack development skills.**

