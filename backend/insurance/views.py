from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from .models import InsurancePolicy, InsuranceClaim, InsurancePayment, PolicyActivity
from .serializers import (
    InsurancePolicySerializer, InsuranceClaimSerializer, 
    InsurancePaymentSerializer, PolicyActivitySerializer,
    PolicyActivationSerializer, PolicyCancellationSerializer,
    ClaimFilingSerializer, ClaimProcessingSerializer
)
from decimal import Decimal

class InsurancePolicyViewSet(viewsets.ModelViewSet):
    serializer_class = InsurancePolicySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own policies
        return InsurancePolicy.objects.filter(policy_holder=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(policy_holder=self.request.user)
    
    @action(detail=True, methods=['get'])
    def claims(self, request, pk=None):
        """Get all claims for a specific policy"""
        policy = self.get_object()
        claims = InsuranceClaim.objects.filter(policy=policy)
        page = self.paginate_queryset(claims)
        if page is not None:
            serializer = InsuranceClaimSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = InsuranceClaimSerializer(claims, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """Get all premium payments for a specific policy"""
        policy = self.get_object()
        payments = InsurancePayment.objects.filter(policy=policy)
        page = self.paginate_queryset(payments)
        if page is not None:
            serializer = InsurancePaymentSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = InsurancePaymentSerializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def activities(self, request, pk=None):
        """Get all activities for a specific policy"""
        policy = self.get_object()
        activities = PolicyActivity.objects.filter(policy=policy)
        page = self.paginate_queryset(activities)
        if page is not None:
            serializer = PolicyActivitySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = PolicyActivitySerializer(activities, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a pending policy (for staff use)"""
        # Check if user is staff
        if not request.user.is_staff:
            return Response({
                'status': 'error',
                'message': 'You do not have permission to activate policies'
            }, status=status.HTTP_403_FORBIDDEN)
            
        policy = self.get_object()
        
        try:
            with transaction.atomic():
                success = policy.activate_policy()
                
                # Record the activation
                PolicyActivity.objects.create(
                    policy=policy,
                    activity_type='creation',
                    description=f"Policy {policy.policy_number} activated"
                )
                
                return Response({
                    'status': 'success',
                    'message': 'Policy activated successfully',
                    'policy_status': policy.status
                }, status=status.HTTP_200_OK)
                    
        except ValueError as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an active policy"""
        policy = self.get_object()
        serializer = PolicyCancellationSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                reason = serializer.validated_data['reason']
                
                with transaction.atomic():
                    success = policy.cancel_policy(reason)
                    
                    return Response({
                        'status': 'success',
                        'message': 'Policy cancelled successfully',
                        'policy_status': policy.status
                    }, status=status.HTTP_200_OK)
                    
            except ValueError as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def process_payment(self, request, pk=None):
        """Process a premium payment from the linked account"""
        policy = self.get_object()
        
        try:
            with transaction.atomic():
                success = policy.process_payment()
                
                if success:
                    return Response({
                        'status': 'success',
                        'message': f'Premium payment of {policy.premium_amount} processed successfully'
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'status': 'error',
                        'message': 'Payment failed - insufficient funds in linked account'
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
        except ValueError as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def file_claim(self, request, pk=None):
        """File a new insurance claim"""
        policy = self.get_object()
        serializer = ClaimFilingSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                amount = serializer.validated_data['amount']
                description = serializer.validated_data['description']
                documents = serializer.validated_data.get('documents', '')
                
                with transaction.atomic():
                    claim = policy.file_claim(amount, description)
                    
                    if documents:
                        claim.documents = documents
                        claim.save()
                    
                    # Record the claim filing
                    PolicyActivity.objects.create(
                        policy=policy,
                        activity_type='claim_filed',
                        description=f"Claim filed for {amount}"
                    )
                    
                    return Response({
                        'status': 'success',
                        'message': 'Claim filed successfully',
                        'claim_number': claim.claim_number,
                        'claim_status': claim.status
                    }, status=status.HTTP_201_CREATED)
                    
            except ValueError as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class InsuranceClaimViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InsuranceClaimSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see claims for their own policies
        return InsuranceClaim.objects.filter(policy__policy_holder=self.request.user)
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process a claim - approve or reject (for staff use)"""
        # Check if user is staff
        if not request.user.is_staff:
            return Response({
                'status': 'error',
                'message': 'You do not have permission to process claims'
            }, status=status.HTTP_403_FORBIDDEN)
            
        claim = self.get_object()
        serializer = ClaimProcessingSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                approve = serializer.validated_data['approve']
                rejection_reason = serializer.validated_data.get('rejection_reason', '')
                
                with transaction.atomic():
                    if approve:
                        # Approve the claim
                        claim.approve_claim()
                        
                        # Process payment if linked account exists
                        payment_processed = claim.process_payment()
                        
                        if payment_processed:
                            return Response({
                                'status': 'success',
                                'message': f'Claim approved and payment of {claim.amount} processed successfully',
                                'claim_status': claim.status
                            }, status=status.HTTP_200_OK)
                        else:
                            return Response({
                                'status': 'success',
                                'message': 'Claim approved but no linked account for payment',
                                'claim_status': claim.status
                            }, status=status.HTTP_200_OK)
                    else:
                        # Reject the claim
                        claim.reject_claim(rejection_reason)
                        return Response({
                            'status': 'success',
                            'message': 'Claim rejected successfully',
                            'claim_status': claim.status,
                            'rejection_reason': claim.rejection_reason
                        }, status=status.HTTP_200_OK)
                    
            except ValueError as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class InsurancePaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InsurancePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see payments for their own policies
        return InsurancePayment.objects.filter(policy__policy_holder=self.request.user)

class PolicyActivityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PolicyActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see activities for their own policies
        return PolicyActivity.objects.filter(policy__policy_holder=self.request.user)
