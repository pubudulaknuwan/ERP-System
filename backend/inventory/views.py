from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F
from .models import Product, Warehouse, InventoryItem
from .serializers import (
    ProductSerializer,
    WarehouseSerializer,
    InventoryItemSerializer,
    ReorderAlertSerializer
)


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for Product CRUD operations."""
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    search_fields = ['sku', 'name', 'category']
    filterset_fields = ['category', 'is_active']


class WarehouseViewSet(viewsets.ModelViewSet):
    """ViewSet for Warehouse CRUD operations."""
    queryset = Warehouse.objects.filter(is_active=True)
    serializer_class = WarehouseSerializer
    search_fields = ['code', 'name']


class InventoryItemViewSet(viewsets.ModelViewSet):
    """ViewSet for InventoryItem CRUD operations."""
    queryset = InventoryItem.objects.select_related('product', 'warehouse').all()
    serializer_class = InventoryItemSerializer
    filterset_fields = ['product', 'warehouse']

    @action(detail=False, methods=['get'])
    def reorder_alerts(self, request):
        """Get all inventory items that need reordering."""
        items = self.queryset.filter(quantity__lt=F('minimum_stock_level'))
        alerts = []
        for item in items:
            alerts.append({
                'inventory_item': InventoryItemSerializer(item).data,
                'shortage': item.minimum_stock_level - item.quantity
            })
        serializer = ReorderAlertSerializer(alerts, many=True)
        return Response(serializer.data)

