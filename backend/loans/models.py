from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
from accounts.models import Account

LOAN_TYPES = [
    ('personal', 'Personal Loan'),
    ('mortgage', 'Mortgage'),
    ('auto', 'Auto Loan'),
    ('education', 'Education Loan'),
    ('business', 'Business Loan'),
]

LOAN_STATUS = [
    ('pending', 'Pending Approval'),
    ('approved', 'Approved'),
    ('active', 'Active'),
    ('completed', 'Completed'),
    ('rejected', 'Rejected'),
    ('default', 'Default'),
]

class Loan(models.Model):
    borrower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='loans')
    linked_account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='loans', null=True, blank=True)
    loan_type = models.CharField(max_length=20, choices=LOAN_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text='Annual interest rate in percentage')
    term_months = models.PositiveIntegerField(help_text='Loan term in months')
    monthly_payment = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=LOAN_STATUS, default='pending')
    purpose = models.TextField(blank=True)
    collateral = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    remaining_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    def __str__(self):
        return f"{self.loan_type} - {self.amount} - {self.status}"
    
    def approve_loan(self):
        """Approve the loan and disburse funds to the linked account"""
        if self.status != 'pending':
            raise ValueError("Only pending loans can be approved")
            
        self.status = 'approved'
        self.save()
        
        if self.linked_account:
            self.linked_account.deposit(self.amount)
            self.status = 'active'
            self.start_date = models.functions.Now()
            self.remaining_amount = self.amount
            self.save()
            
            # Calcolo semplificato della rata mensile (importo totale / numero di mesi)
            self.monthly_payment = self.amount / Decimal(str(self.term_months)) if self.term_months > 0 else self.amount
            self.save()
            
            return True
        return False
    
    def make_payment(self, payment_amount=None):
        """Make a loan payment"""
        if self.status != 'active':
            raise ValueError("Can only make payments on active loans")
        
        # Verifichiamo che il monthly_payment sia stato calcolato
        if not self.monthly_payment or self.monthly_payment <= 0:
            # Calcoliamo la rata mensile se non è stata impostata
            self.monthly_payment = self.amount / Decimal(str(self.term_months)) if self.term_months > 0 else self.amount
            self.save()
        
        # Usiamo SEMPRE la rata mensile fissa
        amount_to_pay = self.monthly_payment
        amount_to_pay = Decimal(str(amount_to_pay))
        
        # Solo nell'ultima rata, se l'importo rimanente è inferiore alla rata
        if self.remaining_amount and self.remaining_amount < amount_to_pay:
            amount_to_pay = self.remaining_amount
        
        if self.linked_account:
            try:
                self.linked_account.withdraw(amount_to_pay)
                
                # Create payment record
                LoanPayment.objects.create(
                    loan=self,
                    amount=amount_to_pay,
                    description=f"Pagamento rata fissa prestito {self.loan_type}"
                )
                
                # Aggiorniamo importo residuo in modo semplificato
                # L'intero importo pagato va a ridurre l'importo residuo
                if self.remaining_amount is None:
                    self.remaining_amount = self.amount
                    
                self.remaining_amount -= amount_to_pay
                
                # Check if loan is fully paid
                if self.remaining_amount <= 0:
                    self.remaining_amount = Decimal('0')
                    self.status = 'completed'
                    self.end_date = models.functions.Now()
                
                self.save()
                return True
                
            except ValueError:
                return False
        return False

class LoanPayment(models.Model):
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255)
    
    def __str__(self):
        return f"Payment of {self.amount} on {self.payment_date.strftime('%Y-%m-%d')}"
    
    class Meta:
        ordering = ['-payment_date']
