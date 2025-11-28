from django.contrib import admin
from .models import Product, Warehouse, InventoryItem


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('sku', 'name', 'unit_price', 'category', 'is_active')
    list_filter = ('is_active', 'category')
    search_fields = ('sku', 'name')


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active')
    list_filter = ('is_active',)


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('product', 'warehouse', 'quantity', 'minimum_stock_level', 'needs_reorder')
    list_filter = ('warehouse', 'product__category')
    search_fields = ('product__sku', 'product__name')

