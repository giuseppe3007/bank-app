from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
from accounts.models import Account

INVESTMENT_TYPES = [
    ('stock', 'Stock'),
    ('bond', 'Bond'),
    ('mutual_fund', 'Mutual Fund'),
    ('etf', 'ETF'),
    ('certificate_of_deposit', 'Certificate of Deposit'),
]

INVESTMENT_STATUS = [
    ('active', 'Active'),
    ('closed', 'Closed'),
    ('pending', 'Pending'),
]

class Investment(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='investments')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='investments', null=True, blank=True)
    investment_type = models.CharField(max_length=50, choices=INVESTMENT_TYPES)
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text='Annual interest rate in percentage')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=INVESTMENT_STATUS, default='active')
    current_value = models.DecimalField(max_digits=15, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.investment_type} - {self.current_value}"
    
    def calculate_return(self, simulation_months=12):
        """Calculate expected return after specified number of months"""
        monthly_rate = self.interest_rate / Decimal('100') / Decimal('12')
        future_value = self.amount * (1 + monthly_rate) ** Decimal(str(simulation_months))
        return round(future_value, 2)
    
    def close_investment(self):
        """Close the investment and return funds to linked account if available"""
        if self.status != 'active':
            raise ValueError("Only active investments can be closed")
            
        self.status = 'closed'
        self.end_date = models.functions.Now()
        
        # If linked to an account, return the funds
        if self.account:
            self.account.deposit(self.current_value)
            
        self.save()
        return self.current_value

class InvestmentTransaction(models.Model):
    investment = models.ForeignKey(Investment, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=[('deposit', 'Deposit'), ('withdrawal', 'Withdrawal')])
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255)
    
    def __str__(self):
        return f"{self.transaction_type} - {self.investment.name} - {self.amount}"
    
    class Meta:
        ordering = ['-timestamp']
