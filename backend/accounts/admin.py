from django.contrib import admin
from .models import Account, Transaction

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('account_number', 'owner', 'account_type', 'balance', 'is_active', 'created_at')
    list_filter = ('account_type', 'is_active', 'created_at')
    search_fields = ('account_number', 'owner__username')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('is_active',)
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('account', 'transaction_type', 'amount', 'description', 'timestamp')
    list_filter = ('transaction_type', 'timestamp')
    search_fields = ('account__account_number', 'description')
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'
    ordering = ('-timestamp',)
