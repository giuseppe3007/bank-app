from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
from accounts.models import Account

POLICY_TYPES = [
    ('life', 'Life Insurance'),
    ('health', 'Health Insurance'),
    ('auto', 'Auto Insurance'),
    ('home', 'Home Insurance'),
    ('travel', 'Travel Insurance'),
    ('business', 'Business Insurance'),
]

POLICY_STATUS = [
    ('active', 'Active'),
    ('pending', 'Pending Approval'),
    ('expired', 'Expired'),
    ('cancelled', 'Cancelled'),
]

PAYMENT_FREQUENCY = [
    ('monthly', 'Monthly'),
    ('quarterly', 'Quarterly'),
    ('semiannual', 'Semi-Annual'),
    ('annual', 'Annual'),
]

class InsurancePolicy(models.Model):
    policy_number = models.CharField(max_length=20, unique=True)
    policy_holder = models.ForeignKey(User, on_delete=models.CASCADE, related_name='insurance_policies')
    linked_account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='insurance_policies', null=True, blank=True)
    policy_type = models.CharField(max_length=20, choices=POLICY_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    coverage_amount = models.DecimalField(max_digits=15, decimal_places=2)
    premium_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text='Amount per payment period')
    payment_frequency = models.CharField(max_length=20, choices=PAYMENT_FREQUENCY)
    status = models.CharField(max_length=20, choices=POLICY_STATUS, default='pending')
    deductible = models.DecimalField(max_digits=10, decimal_places=2)
    beneficiaries = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.policy_number} - {self.policy_type} - {self.status}"
    
    def activate_policy(self):
        """Activate a pending policy"""
        if self.status != 'pending':
            raise ValueError("Only pending policies can be activated")
        
        self.status = 'active'
        self.save()
        return True
    
    def cancel_policy(self, reason):
        """Cancel an active policy"""
        if self.status != 'active':
            raise ValueError("Only active policies can be cancelled")
        
        self.status = 'cancelled'
        self.save()
        
        # Create a cancellation record
        PolicyActivity.objects.create(
            policy=self,
            activity_type='cancellation',
            description=f"Policy cancelled: {reason}"
        )
        return True
    
    def process_payment(self):
        """Process a premium payment from linked account"""
        if self.status != 'active':
            raise ValueError("Cannot process payment for inactive policy")
            
        if not self.linked_account:
            raise ValueError("No linked account for automatic payment")
            
        try:
            self.linked_account.withdraw(self.premium_amount)
            
            # Create payment record
            InsurancePayment.objects.create(
                policy=self,
                amount=self.premium_amount,
                description=f"Premium payment for {self.policy_type} insurance"
            )
            return True
            
        except ValueError:
            # Failed payment - record the incident
            PolicyActivity.objects.create(
                policy=self,
                activity_type='payment_failed',
                description="Failed to process premium payment due to insufficient funds"
            )
            return False
    
    def file_claim(self, amount, description):
        """File an insurance claim"""
        if self.status != 'active':
            raise ValueError("Cannot file claim for inactive policy")
        
        amount = Decimal(str(amount))
        if amount <= 0 or amount > self.coverage_amount:
            raise ValueError("Claim amount must be positive and within coverage limits")
            
        # Create the claim
        claim = InsuranceClaim.objects.create(
            policy=self,
            amount=amount,
            description=description,
            status='pending'
        )
        return claim

class InsurancePayment(models.Model):
    policy = models.ForeignKey(InsurancePolicy, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255)
    
    def __str__(self):
        return f"Payment of {self.amount} on {self.payment_date.strftime('%Y-%m-%d')}"
    
    class Meta:
        ordering = ['-payment_date']

class InsuranceClaim(models.Model):
    CLAIM_STATUS = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('processing', 'Processing Payment'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    policy = models.ForeignKey(InsurancePolicy, on_delete=models.CASCADE, related_name='claims')
    claim_number = models.CharField(max_length=20, unique=True, blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.TextField()
    filed_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=CLAIM_STATUS, default='pending')
    resolution_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    documents = models.TextField(help_text='Document references', blank=True)
    
    def __str__(self):
        return f"Claim {self.claim_number} - {self.status}"
    
    def save(self, *args, **kwargs):
        # Generate claim number if not provided
        if not self.claim_number:
            # Use the current timestamp and policy ID to create a unique claim number
            import time
            self.claim_number = f"CL-{self.policy.id}-{int(time.time())}"
        super().save(*args, **kwargs)
    
    def approve_claim(self):
        """Approve a pending claim"""
        if self.status != 'pending':
            raise ValueError("Only pending claims can be approved")
            
        self.status = 'approved'
        self.save()
        
        # Create activity record
        PolicyActivity.objects.create(
            policy=self.policy,
            activity_type='claim_approved',
            description=f"Claim {self.claim_number} approved for {self.amount}"
        )
        return True
    
    def process_payment(self):
        """Process the payment for an approved claim"""
        if self.status != 'approved':
            raise ValueError("Only approved claims can be processed for payment")
            
        self.status = 'processing'
        self.save()
        
        # If there's a linked account, deposit the claim amount
        if self.policy.linked_account:
            self.policy.linked_account.deposit(self.amount)
            self.status = 'completed'
            self.resolution_date = models.functions.Now()
            self.save()
            
            # Create activity record
            PolicyActivity.objects.create(
                policy=self.policy,
                activity_type='claim_paid',
                description=f"Claim {self.claim_number} paid for {self.amount}"
            )
            return True
        return False
    
    def reject_claim(self, reason):
        """Reject a pending claim"""
        if self.status != 'pending':
            raise ValueError("Only pending claims can be rejected")
            
        self.status = 'rejected'
        self.rejection_reason = reason
        self.resolution_date = models.functions.Now()
        self.save()
        
        # Create activity record
        PolicyActivity.objects.create(
            policy=self.policy,
            activity_type='claim_rejected',
            description=f"Claim {self.claim_number} rejected: {reason}"
        )
        return True

class PolicyActivity(models.Model):
    ACTIVITY_TYPES = [
        ('creation', 'Policy Creation'),
        ('update', 'Policy Update'),
        ('cancellation', 'Policy Cancellation'),
        ('renewal', 'Policy Renewal'),
        ('payment', 'Premium Payment'),
        ('payment_failed', 'Failed Payment'),
        ('claim_filed', 'Claim Filed'),
        ('claim_approved', 'Claim Approved'),
        ('claim_rejected', 'Claim Rejected'),
        ('claim_paid', 'Claim Paid'),
    ]
    
    policy = models.ForeignKey(InsurancePolicy, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.TextField()
    
    def __str__(self):
        return f"{self.activity_type} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = 'Policy Activities'
