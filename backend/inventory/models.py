from django.db import models
from django.core.validators import MinValueValidator


class Product(models.Model):
    """Product master data."""
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    unit_of_measure = models.CharField(max_length=20, default='pcs')
    category = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.sku} - {self.name}"


class Warehouse(models.Model):
    """Warehouse/Location master data."""
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.code} - {self.name}"


class InventoryItem(models.Model):
    """Inventory tracking: Product + Warehouse + Quantity."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_items')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='inventory_items')
    quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    minimum_stock_level = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    reorder_quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['product', 'warehouse']
        ordering = ['product__name', 'warehouse__name']

    def __str__(self):
        return f"{self.product.sku} @ {self.warehouse.code}: {self.quantity}"

    @property
    def needs_reorder(self):
        """Check if inventory is below minimum stock level."""
        return self.quantity < self.minimum_stock_level

