from django.contrib import admin
from .models import Investment

@admin.register(Investment)
class InvestmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner', 'investment_type', 'amount', 'current_value', 'interest_rate', 'status', 'start_date')
    list_filter = ('investment_type', 'status', 'start_date')
    search_fields = ('name', 'owner__username', 'investment_type')
    readonly_fields = ('created_at',)
    date_hierarchy = 'start_date'
    ordering = ('-start_date',)
