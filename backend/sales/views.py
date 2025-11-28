from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import F
from inventory.models import InventoryItem
from .models import Customer, SalesOrder, SalesOrderItem
from .serializers import (
    CustomerSerializer,
    SalesOrderSerializer,
    SalesOrderFulfillmentSerializer
)


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for Customer CRUD operations."""
    queryset = Customer.objects.filter(is_active=True)
    serializer_class = CustomerSerializer
    search_fields = ['code', 'name', 'email']


class SalesOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for SalesOrder CRUD operations with transaction handling."""
    queryset = SalesOrder.objects.select_related('customer', 'created_by').prefetch_related('items__product', 'items__warehouse').all()
    serializer_class = SalesOrderSerializer
    filterset_fields = ['status', 'customer', 'order_date']
    search_fields = ['order_number', 'customer__name', 'customer__code']

    def get_queryset(self):
        """Filter queryset based on user permissions."""
        queryset = super().get_queryset()
        # Add any role-based filtering here if needed
        return queryset

    @transaction.atomic
    @action(detail=True, methods=['post'], serializer_class=SalesOrderFulfillmentSerializer)
    def fulfill(self, request, pk=None):
        """
        Fulfill a sales order: decrease inventory quantities atomically.
        This is a critical operation that must be transactional.
        """
        sales_order = self.get_object()

        if sales_order.status != 'confirmed':
            return Response(
                {'error': f'Order must be in "confirmed" status to fulfill. Current status: {sales_order.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Decrease inventory for each order item
        for item in sales_order.items.all():
            try:
                inventory = InventoryItem.objects.select_for_update().get(
                    product=item.product,
                    warehouse=item.warehouse
                )
                
                if inventory.quantity < item.quantity:
                    # Rollback transaction
                    raise ValueError(
                        f"Insufficient inventory for {item.product.sku} at {item.warehouse.code}. "
                        f"Available: {inventory.quantity}, Required: {item.quantity}"
                    )
                
                inventory.quantity = F('quantity') - item.quantity
                inventory.save(update_fields=['quantity'])
                
            except InventoryItem.DoesNotExist:
                raise ValueError(
                    f"No inventory record found for {item.product.sku} at {item.warehouse.code}"
                )

        # Update order status
        sales_order.status = 'fulfilled'
        sales_order.save(update_fields=['status'])

        serializer = self.get_serializer(sales_order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a draft sales order - validates inventory availability."""
        sales_order = self.get_object()

        if sales_order.status != 'draft':
            return Response(
                {'error': f'Only draft orders can be confirmed. Current status: {sales_order.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate inventory availability before confirming
        for item in sales_order.items.all():
            try:
                inventory = InventoryItem.objects.get(
                    product=item.product,
                    warehouse=item.warehouse
                )
                if inventory.quantity < item.quantity:
                    return Response(
                        {
                            'error': f'Insufficient inventory for {item.product.sku} at {item.warehouse.code}. '
                                    f'Available: {inventory.quantity}, Required: {item.quantity}'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except InventoryItem.DoesNotExist:
                return Response(
                    {
                        'error': f'No inventory record found for {item.product.sku} at {item.warehouse.code}. '
                                f'Please create an inventory record first.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        sales_order.status = 'confirmed'
        sales_order.save(update_fields=['status'])

        serializer = self.get_serializer(sales_order)
        return Response(serializer.data, status=status.HTTP_200_OK)

