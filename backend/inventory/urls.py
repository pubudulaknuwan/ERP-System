from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, WarehouseViewSet, InventoryItemViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'warehouses', WarehouseViewSet)
router.register(r'inventory-items', InventoryItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

