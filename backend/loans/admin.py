from django.contrib import admin
from .models import Loan, LoanPayment

@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ('id', 'borrower', 'loan_type', 'amount', 'status', 'start_date', 'created_at')
    list_filter = ('status', 'loan_type')
    search_fields = ('borrower__username', 'purpose')
    date_hierarchy = 'created_at'
    readonly_fields = ('monthly_payment', 'remaining_amount')

@admin.register(LoanPayment)
class LoanPaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'loan', 'amount', 'payment_date', 'description')
    list_filter = ('payment_date',)
    search_fields = ('loan__borrower__username', 'description')
    date_hierarchy = 'payment_date'
