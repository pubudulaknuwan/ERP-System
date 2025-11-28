from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccountViewSet, InvoiceViewSet, GeneralLedgerViewSet, DashboardViewSet

router = DefaultRouter()
router.register(r'accounts', AccountViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'ledger', GeneralLedgerViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]

