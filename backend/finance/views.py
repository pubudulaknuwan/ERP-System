from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Account, Invoice, GeneralLedger
from .serializers import (
    AccountSerializer,
    InvoiceSerializer,
    GeneralLedgerSerializer,
    DashboardKPISerializer
)


class AccountViewSet(viewsets.ModelViewSet):
    """ViewSet for Account CRUD operations."""
    queryset = Account.objects.filter(is_active=True)
    serializer_class = AccountSerializer
    search_fields = ['code', 'name']
    filterset_fields = ['account_type']


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Invoice CRUD operations."""
    queryset = Invoice.objects.select_related('sales_order__customer').all()
    serializer_class = InvoiceSerializer
    filterset_fields = ['status', 'invoice_date']
    search_fields = ['invoice_number', 'sales_order__order_number', 'sales_order__customer__name']

    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()
        return queryset


class GeneralLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for GeneralLedger read operations."""
    queryset = GeneralLedger.objects.select_related('account', 'invoice').all()
    serializer_class = GeneralLedgerSerializer
    filterset_fields = ['account', 'transaction_type', 'transaction_date']
    search_fields = ['account__code', 'description']


class DashboardViewSet(viewsets.ViewSet):
    """ViewSet for dashboard KPI endpoints."""

    @action(detail=False, methods=['get'])
    def kpis(self, request):
        """Get dashboard KPIs including monthly revenue."""
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

        # Total revenue for current month
        monthly_revenue = Invoice.objects.filter(
            status='paid',
            invoice_date__gte=start_of_month
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Total revenue for current year
        yearly_revenue = Invoice.objects.filter(
            status='paid',
            invoice_date__gte=start_of_year
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # Pending invoices count
        pending_invoices = Invoice.objects.filter(
            status__in=['draft', 'sent']
        ).count()

        # Total accounts receivable (unpaid invoices)
        accounts_receivable = Invoice.objects.filter(
            status__in=['draft', 'sent']
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        data = {
            'total_revenue_month': monthly_revenue,
            'total_revenue_year': yearly_revenue,
            'pending_invoices': pending_invoices,
            'total_accounts_receivable': accounts_receivable,
        }

        serializer = DashboardKPISerializer(data)
        return Response(serializer.data)

