from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Loan, LoanPayment
from accounts.serializers import UserSerializer, AccountSerializer
from decimal import Decimal

class LoanPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanPayment
        fields = ['id', 'loan', 'amount', 'payment_date', 'description']
        read_only_fields = ['id', 'payment_date']

class LoanSerializer(serializers.ModelSerializer):
    borrower_details = UserSerializer(source='borrower', read_only=True)
    account_details = AccountSerializer(source='linked_account', read_only=True)
    payments = LoanPaymentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Loan
        fields = ['id', 'borrower', 'borrower_details', 'linked_account', 'account_details',
                  'loan_type', 'amount', 'interest_rate', 'term_months', 'monthly_payment',
                  'start_date', 'end_date', 'status', 'purpose', 'collateral',
                  'created_at', 'updated_at', 'remaining_amount', 'payments']
        read_only_fields = ['id', 'monthly_payment', 'start_date', 'end_date', 
                           'created_at', 'updated_at', 'remaining_amount']
    
    def validate(self, data):
        # Additional validation can be added here
        return data

class LoanApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = ['borrower', 'linked_account', 'loan_type', 'amount',
                  'interest_rate', 'term_months', 'purpose', 'collateral']
    
    def create(self, validated_data):
        # Initialize a new loan application with pending status
        loan = Loan.objects.create(
            **validated_data,
            status='pending',
            remaining_amount=validated_data['amount']
        )
        return loan

class LoanPaymentMakeSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    account = serializers.IntegerField()
    description = serializers.CharField(max_length=255, required=False, default="Pagamento rata prestito")
    force = serializers.BooleanField(required=False, default=False, write_only=True)
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("L'importo del pagamento deve essere positivo")
        return value
    
    def validate(self, data):
        from accounts.models import Account
        
        # Verifica che l'account appartenga all'utente e abbia un saldo sufficiente
        try:
            account = Account.objects.get(id=data['account'], owner=self.context['request'].user)
        except Account.DoesNotExist:
            raise serializers.ValidationError({"account": "Account non trovato o non autorizzato"})
            
        # Verifica se c'è saldo sufficiente
        if account.balance < data['amount']:
            raise serializers.ValidationError({"amount": f"Saldo insufficiente. Il tuo saldo attuale è {account.balance}€"})
            
        # Aggiunge l'oggetto account ai dati validati
        data['account_obj'] = account
        return data
