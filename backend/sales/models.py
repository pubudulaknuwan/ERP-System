from django.db import models
from django.core.validators import MinValueValidator
from inventory.models import Product, Warehouse


class Customer(models.Model):
    """Customer master data."""
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.code} - {self.name}"


class SalesOrder(models.Model):
    """Sales Order Header."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('fulfilled', 'Fulfilled'),
        ('invoiced', 'Invoiced'),
        ('cancelled', 'Cancelled'),
    ]

    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='sales_orders')
    order_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.PROTECT, related_name='created_orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-order_date', '-created_at']

    def __str__(self):
        return f"{self.order_number} - {self.customer.name} ({self.get_status_display()})"

    def calculate_total(self):
        """Calculate total amount from line items."""
        return self.items.aggregate(total=models.Sum(models.F('quantity') * models.F('unit_price')))['total'] or 0


class SalesOrderItem(models.Model):
    """Sales Order Line Items."""
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='sales_order_items')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name='sales_order_items')
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    line_total = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.sales_order.order_number} - {self.product.sku} x{self.quantity}"

    def save(self, *args, **kwargs):
        """Auto-calculate line_total before saving."""
        self.line_total = self.quantity * self.unit_price
        super().save(*args, **kwargs)

