from rest_framework import serializers
from django.contrib.auth.models import User
from .models import InsurancePolicy, InsurancePayment, InsuranceClaim, PolicyActivity
from accounts.serializers import UserSerializer, AccountSerializer
from decimal import Decimal

class InsurancePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsurancePayment
        fields = ['id', 'policy', 'amount', 'payment_date', 'description']
        read_only_fields = ['id', 'payment_date']

class PolicyActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = PolicyActivity
        fields = ['id', 'policy', 'activity_type', 'timestamp', 'description']
        read_only_fields = ['id', 'timestamp']

class InsuranceClaimSerializer(serializers.ModelSerializer):
    class Meta:
        model = InsuranceClaim
        fields = ['id', 'policy', 'claim_number', 'amount', 'description', 
                 'filed_date', 'status', 'resolution_date', 'rejection_reason', 'documents']
        read_only_fields = ['id', 'claim_number', 'filed_date', 'status', 'resolution_date']

class InsurancePolicySerializer(serializers.ModelSerializer):
    policy_holder_details = UserSerializer(source='policy_holder', read_only=True)
    account_details = AccountSerializer(source='linked_account', read_only=True)
    claims = InsuranceClaimSerializer(many=True, read_only=True)
    payments = InsurancePaymentSerializer(many=True, read_only=True)
    activities = PolicyActivitySerializer(many=True, read_only=True)
    
    class Meta:
        model = InsurancePolicy
        fields = ['id', 'policy_number', 'policy_holder', 'policy_holder_details', 
                 'linked_account', 'account_details', 'policy_type', 'start_date', 'end_date',
                 'coverage_amount', 'premium_amount', 'payment_frequency', 'status',
                 'deductible', 'beneficiaries', 'terms_and_conditions', 
                 'created_at', 'updated_at', 'claims', 'payments', 'activities']
        read_only_fields = ['id', 'policy_number', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Generate a unique policy number
        import random
        validated_data['policy_number'] = f"POL-{random.randint(100000, 999999)}"
        return super().create(validated_data)

class PolicyActivationSerializer(serializers.Serializer):
    policy_id = serializers.IntegerField()

class PolicyCancellationSerializer(serializers.Serializer):
    policy_id = serializers.IntegerField()
    reason = serializers.CharField(max_length=255)

class ClaimFilingSerializer(serializers.Serializer):
    policy_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    description = serializers.CharField()
    documents = serializers.CharField(required=False)
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Claim amount must be positive")
        return Decimal(str(value))

class ClaimProcessingSerializer(serializers.Serializer):
    claim_id = serializers.IntegerField()
    approve = serializers.BooleanField()
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if not data.get('approve') and not data.get('rejection_reason'):
            raise serializers.ValidationError("Rejection reason is required when rejecting a claim")
        return data
