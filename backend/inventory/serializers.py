from rest_framework import serializers
from .models import Product, Warehouse, InventoryItem


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model."""
    class Meta:
        model = Product
        fields = '__all__'


class WarehouseSerializer(serializers.ModelSerializer):
    """Serializer for Warehouse model."""
    class Meta:
        model = Warehouse
        fields = '__all__'


class InventoryItemSerializer(serializers.ModelSerializer):
    """Serializer for InventoryItem model."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.code', read_only=True)
    needs_reorder = serializers.BooleanField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = '__all__'


class ReorderAlertSerializer(serializers.Serializer):
    """Serializer for reorder alerts."""
    inventory_item = InventoryItemSerializer()
    shortage = serializers.IntegerField()

