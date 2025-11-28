"""
URL configuration for enterprisepro project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/inventory/', include('inventory.urls')),
    path('api/v1/sales/', include('sales.urls')),
    path('api/v1/finance/', include('finance.urls')),
]

