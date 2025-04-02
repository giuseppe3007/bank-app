from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Investment, InvestmentTransaction
from accounts.serializers import UserSerializer, AccountSerializer
from decimal import Decimal

class InvestmentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestmentTransaction
        fields = ['id', 'investment', 'transaction_type', 'amount', 'timestamp', 'description']
        read_only_fields = ['id', 'timestamp']

class InvestmentSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    account_details = AccountSerializer(source='account', read_only=True)
    
    class Meta:
        model = Investment
        fields = ['id', 'owner', 'owner_details', 'account', 'account_details', 
                  'investment_type', 'name', 'amount', 'interest_rate', 
                  'start_date', 'end_date', 'status', 'current_value', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        if data.get('current_value') is None:
            # Set current value equal to initial amount if not provided
            data['current_value'] = data.get('amount')
        return data

class InvestmentReturnSimulationSerializer(serializers.Serializer):
    investment_id = serializers.IntegerField()
    simulation_months = serializers.IntegerField(min_value=1, max_value=360)  # Max 30 years
    
    def validate_simulation_months(self, value):
        if value <= 0:
            raise serializers.ValidationError("Simulation period must be positive")
        return value
