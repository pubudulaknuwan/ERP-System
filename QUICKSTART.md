# Quick Start Guide

## Prerequisites Check

```bash
# Check Python version (need 3.9+)
python --version

# Check Node.js version (need 18+)
node --version

# Check PostgreSQL is running
psql --version
```

## Step-by-Step Setup

### 1. Database Setup

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE enterprisepro_db;

-- Exit
\q
```

### 2. Backend Setup (Terminal 1)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy env.example .env  # Windows
# OR
cp env.example .env    # Mac/Linux

# Edit .env with your database credentials

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

Backend should be running at `http://localhost:8000`

### 3. Frontend Setup (Terminal 2)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend should be running at `http://localhost:5173`

### 4. Create Initial Data

1. Go to `http://localhost:8000/admin`
2. Login with superuser credentials
3. Create:
   - **Products** (at least 2-3 products with SKU, name, unit_price)
   - **Warehouses** (at least 1 warehouse)
   - **Inventory Items** (link products to warehouses, set quantities > 0)
   - **Customers** (at least 1 customer)

### 5. Test the Application

1. Go to `http://localhost:5173`
2. Login (use superuser credentials or create a new user via `/api/v1/auth/register/`)
3. Navigate to "Sales Orders" → "New Order"
4. Create a sales order:
   - Select customer
   - Add line items (product, warehouse, quantity)
   - Submit

### 6. Test Order Fulfillment (via API)

```bash
# Get your access token first (login via frontend or API)
# Then use it in the Authorization header

# Confirm order
curl -X POST http://localhost:8000/api/v1/sales/orders/{order_id}/confirm/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Fulfill order (decreases inventory)
curl -X POST http://localhost:8000/api/v1/sales/orders/{order_id}/fulfill/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. Create Invoice

```bash
curl -X POST http://localhost:8000/api/v1/finance/invoices/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sales_order": <fulfilled_order_id>,
    "invoice_date": "2024-01-15",
    "due_date": "2024-02-15"
  }'
```

## Common Issues

### Database Connection Error
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env` file
- Ensure database exists

### Port Already in Use
- Backend: Change port in `python manage.py runserver 8001`
- Frontend: Change port in `vite.config.js`

### CORS Errors
- Ensure backend CORS settings include frontend URL
- Check `CORS_ALLOWED_ORIGINS` in `settings.py`

### Module Not Found
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again
- For frontend: `npm install`

## Next Steps

- Explore the API via Django REST Framework browsable API: `http://localhost:8000/api/v1/`
- Check dashboard KPIs: `http://localhost:5173/`
- Review reorder alerts: `GET /api/v1/inventory/inventory-items/reorder_alerts/`

