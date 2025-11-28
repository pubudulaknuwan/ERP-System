from rest_framework import serializers
from django.db import transaction
from inventory.models import InventoryItem
from .models import Customer, SalesOrder, SalesOrderItem


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model."""
    class Meta:
        model = Customer
        fields = '__all__'


class SalesOrderItemSerializer(serializers.ModelSerializer):
    """Serializer for SalesOrderItem model."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = SalesOrderItem
        # Exclude sales_order when used as nested serializer (it's set automatically)
        exclude = ('sales_order',)
        read_only_fields = ('line_total',)


class SalesOrderSerializer(serializers.ModelSerializer):
    """Serializer for SalesOrder model."""
    items = SalesOrderItemSerializer(many=True, required=False)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_code = serializers.CharField(source='customer.code', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = SalesOrder
        fields = '__all__'
        read_only_fields = ('total_amount', 'created_by', 'created_at', 'updated_at')
        extra_kwargs = {
            'order_number': {'required': False, 'allow_blank': True, 'allow_null': False}
        }

    def validate_items(self, value):
        """Validate that order has at least one item."""
        if not value:
            raise serializers.ValidationError("Sales order must have at least one item.")
        return value

    def validate(self, attrs):
        """Validate inventory availability and calculate totals."""
        # Allow status change to 'cancelled' for draft and confirmed orders
        new_status = attrs.get('status')
        if self.instance:
            if self.instance.status != 'draft' and new_status != 'cancelled':
                # Only allow cancelling non-draft orders, not other modifications
                if new_status is None or (new_status != 'cancelled' and self.instance.status != 'draft'):
                    raise serializers.ValidationError("Cannot modify a non-draft order.")

        items = attrs.get('items', None)
        # For create, items are required
        if not self.instance and (not items or len(items) == 0):
            raise serializers.ValidationError("Sales order must have at least one item.")
        
        # For update, if items are provided, validate them
        if items is not None and len(items) == 0:
            raise serializers.ValidationError("Sales order must have at least one item.")

        # Get order status (default to 'draft' for new orders)
        order_status = attrs.get('status', 'draft')
        if self.instance:
            order_status = attrs.get('status', self.instance.status)

        # Only validate inventory for non-draft orders
        # Draft orders can be created without inventory records
        # Inventory will be checked when order is confirmed or fulfilled
        if order_status != 'draft' and items:
            for item_data in items:
                product = item_data['product']
                warehouse = item_data['warehouse']
                quantity = item_data['quantity']

                try:
                    inventory = InventoryItem.objects.get(product=product, warehouse=warehouse)
                    if inventory.quantity < quantity:
                        raise serializers.ValidationError(
                            f"Insufficient inventory for {product.sku} at {warehouse.code}. "
                            f"Available: {inventory.quantity}, Requested: {quantity}"
                        )
                except InventoryItem.DoesNotExist:
                    raise serializers.ValidationError(
                        f"No inventory record found for {product.sku} at {warehouse.code}"
                    )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        """Create sales order with items and calculate total."""
        items_data = validated_data.pop('items')
        validated_data['created_by'] = self.context['request'].user
        
        # Generate order number if not provided
        if 'order_number' not in validated_data or not validated_data['order_number']:
            validated_data['order_number'] = self._generate_order_number()

        sales_order = SalesOrder.objects.create(**validated_data)
        
        # Create order items
        total_amount = 0
        for item_data in items_data:
            item = SalesOrderItem.objects.create(sales_order=sales_order, **item_data)
            total_amount += item.line_total

        sales_order.total_amount = total_amount
        sales_order.save()

        return sales_order

    @transaction.atomic
    def update(self, instance, validated_data):
        """Update sales order with items."""
        items_data = validated_data.pop('items', None)
        
        # Update order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Update items if provided
        if items_data is not None:
            # Delete existing items
            instance.items.all().delete()
            
            # Create new items
            total_amount = 0
            for item_data in items_data:
                item = SalesOrderItem.objects.create(sales_order=instance, **item_data)
                total_amount += item.line_total

            instance.total_amount = total_amount

        instance.save()
        return instance

    def _generate_order_number(self):
        """Generate unique order number."""
        from datetime import datetime
        prefix = 'SO'
        timestamp = datetime.now().strftime('%Y%m%d')
        last_order = SalesOrder.objects.filter(order_number__startswith=f'{prefix}-{timestamp}').order_by('-order_number').first()
        
        if last_order:
            last_num = int(last_order.order_number.split('-')[-1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        return f'{prefix}-{timestamp}-{new_num:04d}'


class SalesOrderFulfillmentSerializer(serializers.Serializer):
    """Serializer for order fulfillment action."""
    pass

