from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal

ACCOUNT_TYPES = [
    ('checking', 'Checking'),
    ('savings', 'Savings'),
    ('business', 'Business'),
]

TRANSACTION_TYPES = [
    ('deposit', 'Deposit'),
    ('withdrawal', 'Withdrawal'),
    ('transfer_out', 'Transfer Out'),
    ('transfer_in', 'Transfer In'),
]

class Account(models.Model):
    account_number = models.CharField(max_length=20, unique=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.account_number} - {self.owner.username}"
    
    def deposit(self, amount):
        # Convert to Decimal to ensure correct addition with balance
        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        self.balance += amount
        self.save()
        Transaction.objects.create(
            account=self,
            transaction_type='deposit',
            amount=amount,
            description=f"Versamento sul conto {self.account_number}"
        )
        return self.balance
    
    def withdraw(self, amount):
        # Convert to Decimal to ensure correct subtraction from balance
        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if self.balance < amount:
            raise ValueError("Insufficient funds")
        self.balance -= amount
        self.save()
        Transaction.objects.create(
            account=self,
            transaction_type='withdrawal',
            amount=amount,
            description=f"Prelievo dal conto {self.account_number}"
        )
        return self.balance
    
    def transfer(self, destination_account, amount):
        # Convert to Decimal for accurate calculations
        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValueError("Transfer amount must be positive")
        if self.balance < amount:
            raise ValueError("Insufficient funds for transfer")
            
        # Create the withdrawal transaction on this account
        self.balance -= amount
        self.save()
        Transaction.objects.create(
            account=self,
            transaction_type='transfer_out',
            amount=amount,
            description=f"Bonifico verso il conto {destination_account.account_number}"
        )
        
        # Create the deposit transaction on the destination account
        destination_account.balance += amount
        destination_account.save()
        Transaction.objects.create(
            account=destination_account,
            transaction_type='transfer_in',
            amount=amount,
            description=f"Bonifico ricevuto dal conto {self.account_number}"
        )
        
        return self.balance

class Transaction(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        ordering = ['-timestamp']
