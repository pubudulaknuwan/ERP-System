from django.contrib import admin
from .models import Account, Invoice, GeneralLedger


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'account_type', 'parent', 'is_active')
    list_filter = ('account_type', 'is_active')
    search_fields = ('code', 'name')


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'sales_order', 'invoice_date', 'status', 'total_amount')
    list_filter = ('status', 'invoice_date')
    search_fields = ('invoice_number', 'sales_order__order_number')
    readonly_fields = ('total_amount', 'created_at', 'updated_at')


@admin.register(GeneralLedger)
class GeneralLedgerAdmin(admin.ModelAdmin):
    list_display = ('account', 'transaction_type', 'amount', 'transaction_date', 'invoice')
    list_filter = ('transaction_type', 'transaction_date', 'account__account_type')
    search_fields = ('account__code', 'description')

