from django.contrib import admin
from .models import Customer, SalesOrder, SalesOrderItem


class SalesOrderItemInline(admin.TabularInline):
    model = SalesOrderItem
    extra = 1


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'email', 'phone', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('code', 'name', 'email')


@admin.register(SalesOrder)
class SalesOrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer', 'order_date', 'status', 'total_amount', 'created_by')
    list_filter = ('status', 'order_date')
    search_fields = ('order_number', 'customer__name', 'customer__code')
    inlines = [SalesOrderItemInline]
    readonly_fields = ('total_amount', 'created_at', 'updated_at')


@admin.register(SalesOrderItem)
class SalesOrderItemAdmin(admin.ModelAdmin):
    list_display = ('sales_order', 'product', 'quantity', 'unit_price', 'line_total')
    list_filter = ('sales_order__status',)

