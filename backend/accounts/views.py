from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import Account, Transaction
from .serializers import (
    AccountSerializer, TransactionSerializer, 
    AccountTransactionSerializer, TransferSerializer,
    UserSerializer
)
from decimal import Decimal

class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own accounts
        return Account.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get all transactions for a specific account"""
        account = self.get_object()
        transactions = Transaction.objects.filter(account=account)
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = TransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deposit(self, request, pk=None):
        """Deposit funds to an account"""
        account = self.get_object()
        serializer = AccountTransactionSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                amount = serializer.validated_data['amount']
                description = serializer.validated_data.get('description', f"Deposit to account {account.account_number}")
                
                with transaction.atomic():
                    account.deposit(amount)
                    # Transaction is created inside the deposit method
                
                return Response({
                    'status': 'success',
                    'message': f'Successfully deposited {amount} to account {account.account_number}',
                    'balance': account.balance
                }, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        """Withdraw funds from an account"""
        account = self.get_object()
        serializer = AccountTransactionSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                amount = serializer.validated_data['amount']
                description = serializer.validated_data.get('description', f"Withdrawal from account {account.account_number}")
                
                with transaction.atomic():
                    account.withdraw(amount)
                    # Transaction is created inside the withdraw method
                
                return Response({
                    'status': 'success',
                    'message': f'Successfully withdrew {amount} from account {account.account_number}',
                    'balance': account.balance
                }, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def transfer(self, request, pk=None):
        """Transfer funds to another account"""
        source_account = self.get_object()
        serializer = TransferSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                destination_account_number = serializer.validated_data['destination_account']
                amount = serializer.validated_data['amount']
                description = serializer.validated_data.get('description', 'Fund transfer')
                
                # Find the destination account
                try:
                    destination_account = Account.objects.get(account_number=destination_account_number)
                except Account.DoesNotExist:
                    return Response({
                        'status': 'error',
                        'message': 'Destination account not found'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                # Execute the transfer
                with transaction.atomic():
                    source_account.transfer(destination_account, amount)
                    # Transactions are created inside the transfer method
                
                return Response({
                    'status': 'success',
                    'message': f'Successfully transferred {amount} to account {destination_account.account_number}',
                    'balance': source_account.balance
                }, status=status.HTTP_200_OK)
            except ValueError as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close an account"""
        account = self.get_object()
        
        # Verifica che il conto abbia saldo zero
        if account.balance > 0:
            return Response({
                'status': 'error',
                'message': 'Non è possibile chiudere un conto con saldo positivo. Trasferisci o preleva tutti i fondi prima di chiudere il conto.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verifica che il conto sia attivo
        if not account.is_active:
            return Response({
                'status': 'error',
                'message': 'Il conto è già stato chiuso.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Chiudi il conto
        account.is_active = False
        account.save()
        
        return Response({
            'status': 'success',
            'message': f'Il conto {account.account_number} è stato chiuso con successo.'
        }, status=status.HTTP_200_OK)
        
    @action(detail=True, methods=['delete'])
    def delete_permanently(self, request, pk=None):
        """Delete an account permanently from the database"""
        account = self.get_object()
        
        # Verifica che il conto sia inattivo
        if account.is_active:
            return Response({
                'status': 'error',
                'message': 'Non è possibile eliminare definitivamente un conto attivo. Chiudi prima il conto.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verifica che il conto abbia saldo zero
        if account.balance > 0:
            return Response({
                'status': 'error',
                'message': 'Non è possibile eliminare un conto con saldo positivo.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Elimina il conto
        account_number = account.account_number
        account.delete()
        
        return Response({
            'status': 'success',
            'message': f'Il conto {account_number} è stato eliminato definitivamente.'
        }, status=status.HTTP_200_OK)

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see transactions for their own accounts
        return Transaction.objects.filter(account__owner=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """Endpoint per ottenere i dettagli dell'utente correntemente autenticato"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    """Endpoint per la registrazione di un nuovo utente"""
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Set password correttamente (il serializer non la imposta correttamente per sicurezza)
        user.set_password(request.data['password'])
        user.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
