from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from .models import Investment, InvestmentTransaction
from .serializers import (
    InvestmentSerializer, InvestmentTransactionSerializer,
    InvestmentReturnSimulationSerializer
)
from decimal import Decimal

class InvestmentViewSet(viewsets.ModelViewSet):
    serializer_class = InvestmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own investments
        return Investment.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get all transactions for a specific investment"""
        investment = self.get_object()
        transactions = InvestmentTransaction.objects.filter(investment=investment)
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = InvestmentTransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = InvestmentTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close an investment and return funds to the linked account if available"""
        investment = self.get_object()
        
        try:
            with transaction.atomic():
                final_value = investment.close_investment()
                
            return Response({
                'status': 'success',
                'message': f'Investment closed successfully, returning {final_value}',
                'final_value': final_value
            }, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def simulate_return(self, request):
        """Simulate investment return based on current parameters"""
        serializer = InvestmentReturnSimulationSerializer(data=request.data)
        
        if serializer.is_valid():
            investment_id = serializer.validated_data['investment_id']
            simulation_months = serializer.validated_data['simulation_months']
            
            try:
                # Ensure the investment belongs to the requesting user
                investment = Investment.objects.get(id=investment_id, owner=request.user)
                
                # Calculate the projected return
                future_value = investment.calculate_return(simulation_months)
                
                # Calculate the profit
                profit = future_value - investment.amount
                
                return Response({
                    'status': 'success',
                    'investment': investment.name,
                    'initial_amount': investment.amount,
                    'future_value': future_value,
                    'profit': profit,
                    'simulation_months': simulation_months,
                    'annual_interest_rate': investment.interest_rate
                }, status=status.HTTP_200_OK)
                
            except Investment.DoesNotExist:
                return Response({
                    'status': 'error',
                    'message': 'Investment not found'
                }, status=status.HTTP_404_NOT_FOUND)
            except ValueError as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class InvestmentTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvestmentTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see transactions for their own investments
        return InvestmentTransaction.objects.filter(investment__owner=self.request.user)
