from rest_framework import serializers
from django.db import transaction
from sales.models import SalesOrder
from .models import Account, Invoice, GeneralLedger


class AccountSerializer(serializers.ModelSerializer):
    """Serializer for Account model."""
    class Meta:
        model = Account
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model."""
    sales_order_number = serializers.CharField(source='sales_order.order_number', read_only=True)
    customer_name = serializers.CharField(source='sales_order.customer.name', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ('total_amount', 'created_at', 'updated_at')

    def validate_sales_order(self, value):
        """Validate that sales order is fulfilled and not already invoiced."""
        if value.status != 'fulfilled':
            raise serializers.ValidationError("Sales order must be fulfilled before creating an invoice.")
        
        if hasattr(value, 'invoice'):
            raise serializers.ValidationError("This sales order already has an invoice.")
        
        return value

    @transaction.atomic
    def create(self, validated_data):
        """Create invoice and update sales order status, create ledger entries."""
        sales_order = validated_data['sales_order']
        
        # Generate invoice number if not provided
        if 'invoice_number' not in validated_data or not validated_data['invoice_number']:
            validated_data['invoice_number'] = self._generate_invoice_number()

        # Set total amount from sales order
        validated_data['total_amount'] = sales_order.total_amount

        invoice = Invoice.objects.create(**validated_data)

        # Update sales order status
        sales_order.status = 'invoiced'
        sales_order.save(update_fields=['status'])

        # Create general ledger entries (simplified double-entry)
        self._create_ledger_entries(invoice)

        return invoice

    def _generate_invoice_number(self):
        """Generate unique invoice number."""
        from datetime import datetime
        prefix = 'INV'
        timestamp = datetime.now().strftime('%Y%m%d')
        last_invoice = Invoice.objects.filter(invoice_number__startswith=f'{prefix}-{timestamp}').order_by('-invoice_number').first()
        
        if last_invoice:
            last_num = int(last_invoice.invoice_number.split('-')[-1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        return f'{prefix}-{timestamp}-{new_num:04d}'

    def _create_ledger_entries(self, invoice):
        """Create double-entry ledger entries for invoice."""
        # Get or create default accounts
        sales_revenue_account, _ = Account.objects.get_or_create(
            code='4000',
            defaults={'name': 'Sales Revenue', 'account_type': 'revenue'}
        )
        accounts_receivable_account, _ = Account.objects.get_or_create(
            code='1200',
            defaults={'name': 'Accounts Receivable', 'account_type': 'asset'}
        )

        # Debit: Accounts Receivable (Asset increases)
        GeneralLedger.objects.create(
            account=accounts_receivable_account,
            invoice=invoice,
            transaction_type='debit',
            amount=invoice.total_amount,
            description=f'Invoice {invoice.invoice_number} - {invoice.sales_order.customer.name}',
            transaction_date=invoice.invoice_date
        )

        # Credit: Sales Revenue (Revenue increases)
        GeneralLedger.objects.create(
            account=sales_revenue_account,
            invoice=invoice,
            transaction_type='credit',
            amount=invoice.total_amount,
            description=f'Invoice {invoice.invoice_number} - {invoice.sales_order.customer.name}',
            transaction_date=invoice.invoice_date
        )


class GeneralLedgerSerializer(serializers.ModelSerializer):
    """Serializer for GeneralLedger model."""
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)

    class Meta:
        model = GeneralLedger
        fields = '__all__'


class DashboardKPISerializer(serializers.Serializer):
    """Serializer for dashboard KPI data."""
    total_revenue_month = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_revenue_year = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_invoices = serializers.IntegerField()
    total_accounts_receivable = serializers.DecimalField(max_digits=12, decimal_places=2)

