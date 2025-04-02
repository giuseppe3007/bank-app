"""core URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from accounts.views import current_user, register
from accounts.views import AccountViewSet, TransactionViewSet
from investments.views import InvestmentViewSet, InvestmentTransactionViewSet
from loans.views import LoanViewSet, LoanApplicationViewSet, LoanPaymentViewSet
from insurance.views import (InsurancePolicyViewSet, InsuranceClaimViewSet, 
                             InsurancePaymentViewSet, PolicyActivityViewSet)

# Create a router and register our viewsets with it
router = DefaultRouter()

# Accounts app endpoints
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'transactions', TransactionViewSet, basename='transaction')

# Investments app endpoints
router.register(r'investments', InvestmentViewSet, basename='investment')
router.register(r'investment-transactions', InvestmentTransactionViewSet, basename='investment-transaction')

# Loans app endpoints
router.register(r'loans', LoanViewSet, basename='loan')
router.register(r'loan-applications', LoanApplicationViewSet, basename='loan-application')
router.register(r'loan-payments', LoanPaymentViewSet, basename='loan-payment')

# Insurance app endpoints
router.register(r'insurance-policies', InsurancePolicyViewSet, basename='insurance-policy')
router.register(r'insurance-claims', InsuranceClaimViewSet, basename='insurance-claim')
router.register(r'insurance-payments', InsurancePaymentViewSet, basename='insurance-payment')
router.register(r'policy-activities', PolicyActivityViewSet, basename='policy-activity')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/user/', current_user, name='current_user'),
    path('api/register/', register, name='register'),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),  # For browsable API authentication
]
