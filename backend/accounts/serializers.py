from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Account, Transaction
from decimal import Decimal

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'account', 'transaction_type', 'amount', 'description', 'timestamp']
        read_only_fields = ['id', 'timestamp']

class AccountSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    account_number = serializers.CharField(required=False)  # Rendere non obbligatorio
    owner = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)  # Rendere non obbligatorio
    
    class Meta:
        model = Account
        fields = ['id', 'account_number', 'owner', 'owner_details', 'account_type', 
                  'balance', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'balance', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Generate a unique account number (simplified)
        import random
        validated_data['account_number'] = f"ACC-{random.randint(100000, 999999)}"
        return super().create(validated_data)

class AccountTransactionSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    description = serializers.CharField(max_length=255, required=False)
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive")
        return Decimal(str(value))  # Convert to Decimal to prevent type issues

class TransferSerializer(serializers.Serializer):
    destination_account = serializers.CharField(max_length=20)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    description = serializers.CharField(max_length=255, required=False)
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Transfer amount must be positive")
        return Decimal(str(value))  # Convert to Decimal to prevent type issues
