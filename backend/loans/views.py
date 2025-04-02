from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db import models
from django.utils import timezone
from .models import Loan, LoanPayment
from .serializers import (
    LoanSerializer, LoanPaymentSerializer,
    LoanApplicationSerializer, LoanPaymentMakeSerializer
)
from decimal import Decimal

class LoanViewSet(viewsets.ModelViewSet):
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own loans
        return Loan.objects.filter(borrower=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(borrower=self.request.user)
    
    @action(detail=True, methods=['get', 'post'])
    def payments(self, request, pk=None):
        """Get all payments for a specific loan or make a new payment"""
        loan = self.get_object()
        
        # GET: Restituisce tutti i pagamenti per un prestito
        if request.method == 'GET':
            payments = LoanPayment.objects.filter(loan=loan)
            page = self.paginate_queryset(payments)
            if page is not None:
                serializer = LoanPaymentSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = LoanPaymentSerializer(payments, many=True)
            return Response(serializer.data)
        
        # POST: Processa un nuovo pagamento
        elif request.method == 'POST':
            # Verifica che il prestito sia attivo
            if loan.status != 'active':
                return Response({
                    'detail': f"Impossibile effettuare pagamenti su un prestito con stato '{loan.status}'."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verifica che ci sia un importo residuo da pagare
            if not loan.remaining_amount or loan.remaining_amount <= 0:
                return Response({
                    'detail': "Questo prestito è già stato completamente pagato."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Serializza e valida i dati
            serializer = LoanPaymentMakeSerializer(data=request.data, context={'request': request})
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            payment_amount = serializer.validated_data['amount']
            account = serializer.validated_data['account_obj']
            description = serializer.validated_data['description']
            
            # Se il pagamento è maggiore dell'importo rimanente, lo limita all'importo rimanente
            if payment_amount > loan.remaining_amount:
                payment_amount = loan.remaining_amount
            
            # Esegui la transazione in un blocco atomico
            try:
                with transaction.atomic():
                    # 1. Crea il pagamento
                    payment = LoanPayment.objects.create(
                        loan=loan,
                        amount=payment_amount,
                        description=description
                    )
                    
                    # 2. Sottrai l'importo dal conto dell'utente
                    account.balance -= payment_amount
                    account.save()
                    
                    # 3. Aggiorna l'importo residuo del prestito
                    loan.remaining_amount -= payment_amount
                    
                    # 4. Se il prestito è stato completamente pagato, aggiorna lo stato
                    if loan.remaining_amount <= 0:
                        loan.status = 'completed'
                        loan.remaining_amount = 0
                    
                    loan.save()
                    
                    # Restituisci i dettagli del pagamento
                    return Response({
                        'detail': 'Pagamento effettuato con successo!',
                        'payment': LoanPaymentSerializer(payment).data,
                        'loan': LoanSerializer(loan).data
                    }, status=status.HTTP_201_CREATED)
            
            except Exception as e:
                return Response({
                    'detail': f"Si è verificato un errore durante l'elaborazione del pagamento: {str(e)}"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending loan (for admin/staff use)"""
        # Check if user is staff
        if not request.user.is_staff:
            return Response({
                'status': 'error',
                'message': 'You do not have permission to approve loans'
            }, status=status.HTTP_403_FORBIDDEN)
            
        loan = self.get_object()
        
        try:
            with transaction.atomic():
                # Verifica che il prestito sia in stato pending
                if loan.status != 'pending':
                    return Response({
                        'status': 'error',
                        'message': 'Questo prestito non è in attesa di approvazione'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Cambiamo lo stato in approved
                loan.status = 'approved'
                
                # Se c'è un account collegato, trasferiamo i fondi
                if loan.linked_account:
                    account = loan.linked_account
                    
                    # Aggiungiamo l'importo del prestito al saldo dell'account
                    account.balance += loan.amount
                    account.save()
                    
                    # Aggiorniamo i dettagli del prestito
                    loan.status = 'active'
                    loan.start_date = timezone.now().date()
                    loan.end_date = (timezone.now() + timezone.timedelta(days=30*loan.term_months)).date()
                    
                    # Calcoliamo la rata mensile SEMPLICE: importo totale diviso numero di mesi
                    if loan.term_months > 0:
                        loan.monthly_payment = loan.amount / loan.term_months
                    else:
                        loan.monthly_payment = loan.amount
                    
                    # Inizializziamo l'importo residuo
                    loan.remaining_amount = loan.amount
                    loan.save()
                    
                    return Response({
                        'status': 'success',
                        'message': f'Prestito approvato con successo e fondi trasferiti al conto',
                        'loan_status': loan.status,
                        'monthly_payment': loan.monthly_payment
                    }, status=status.HTTP_200_OK)
                else:
                    loan.save()
                    return Response({
                        'status': 'error',
                        'message': 'Prestito approvato ma nessun conto collegato per il trasferimento dei fondi'
                    }, status=status.HTTP_200_OK)
                    
        except ValueError as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def make_payment(self, request, pk=None):
        """Make a payment toward a loan using any user account"""
        loan = self.get_object()
        serializer = LoanPaymentMakeSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            try:
                # Convertiamo esplicitamente in Decimal per evitare problemi di tipo
                amount = Decimal(str(serializer.validated_data.get('amount')))
                account = serializer.validated_data.get('account_obj')
                description = serializer.validated_data.get('description', 'Pagamento rata prestito')
                force_payment = serializer.validated_data.get('force', False)
                
                # Verifica che il prestito sia attivo o approvato, a meno che non sia forzato
                if not force_payment and loan.status not in ['active', 'approved']:
                    return Response({
                        'status': 'error',
                        'message': f"Impossibile effettuare pagamenti su un prestito con stato '{loan.status}'."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Controlliamo se è stato completato esplicitamente, a meno che non sia forzato
                if not force_payment and loan.status == 'completed':
                    return Response({
                        'status': 'error',
                        'message': "Questo prestito è già stato completamente pagato."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Se l'importo rimanente è None o ≤ 0 ma lo stato è attivo, correggiamo l'importo rimanente
                if loan.status in ['active', 'approved'] and (loan.remaining_amount is None or (loan.remaining_amount is not None and loan.remaining_amount <= 0)):
                    # Impostiamo un valore predefinito basato sulla rata mensile
                    if loan.monthly_payment and loan.monthly_payment > 0:
                        # Se mancano informazioni sul valore rimanente, assumiamo che sia uguale alla rata mensile
                        loan.remaining_amount = loan.monthly_payment
                        loan.save()
                
                # Verifica che ci sia un importo residuo da pagare, ma solo se è un valore valido
                # e lo stato non è 'active' o 'approved' (perché in quei casi assumiamo che sia pagabile)
                if loan.remaining_amount is not None and loan.remaining_amount <= 0 and not force_payment:
                    # Aggiorniamo lo stato per renderlo coerente con l'importo rimanente
                    loan.status = 'completed'
                    loan.save()
                    
                    return Response({
                        'status': 'error',
                        'message': "Questo prestito è già stato completamente pagato."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Assicuriamoci che remaining_amount sia un valore valido
                if loan.remaining_amount is None:
                    # Se non c'è un importo residuo, lo impostiamo all'importo totale
                    loan.remaining_amount = loan.amount
                    loan.save()
                
                # Calcoliamo quanto vale ogni rata (importo totale / numero rate)
                if loan.term_months > 0:
                    rata_mensile = loan.amount / Decimal(str(loan.term_months))
                else:
                    rata_mensile = loan.amount
                
                # Se non c'è monthly_payment, lo impostiamo
                if not loan.monthly_payment or loan.monthly_payment <= 0:
                    loan.monthly_payment = rata_mensile
                    loan.save()
                
                # Verifichiamo quante rate sono state pagate
                num_payments = LoanPayment.objects.filter(loan=loan).count()
                
                # Calcoliamo l'importo residuo basato sulle rate pagate
                importo_pagato_teorico = rata_mensile * Decimal(str(num_payments))
                importo_residuo_teorico = loan.amount - importo_pagato_teorico
                
                # Forziamo sempre l'importo a essere esattamente la rata mensile
                # indipendentemente dall'importo inviato dal client
                amount = rata_mensile
                
                # Solo nell'ultima rata potrebbe essere necessario aggiustare l'importo
                # se la rata mensile è superiore all'importo rimanente
                if loan.remaining_amount < amount:
                    amount = loan.remaining_amount
                
                with transaction.atomic():
                    # 1. Crea il pagamento
                    payment = LoanPayment.objects.create(
                        loan=loan,
                        amount=amount,
                        description=description
                    )
                    
                    # 2. Sottrai l'importo dal conto dell'utente
                    account.balance -= amount
                    account.save()
                    
                        # Riduciamo l'importo residuo dell'intera cifra pagata
                    loan.remaining_amount -= amount
                    
                    # Log per debug
                    print(f"Pagamento: {amount}, Rimanente: {loan.remaining_amount}")
                    
                    # Calcoliamo quante rate mancano approssimativamente
                    if loan.monthly_payment and loan.monthly_payment > 0:
                        rate_rimanenti = loan.remaining_amount / loan.monthly_payment
                        print(f"Rate rimanenti stimate: {rate_rimanenti}")
                    
                    # 4. Se il prestito è stato completamente pagato, aggiorna lo stato
                    if loan.remaining_amount <= 0:
                        loan.status = 'completed'
                        loan.remaining_amount = 0
                    
                    loan.save()
                    
                    return Response({
                        'status': 'success',
                        'message': 'Pagamento effettuato con successo!',
                        'remaining_amount': loan.remaining_amount,
                        'loan_status': loan.status
                    }, status=status.HTTP_200_OK)
                    
            except ValueError as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoanApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = LoanApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own loan applications
        return Loan.objects.filter(borrower=self.request.user, status='pending')
    
    def perform_create(self, serializer):
        serializer.save(borrower=self.request.user)

class LoanPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LoanPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see payments for their own loans
        return LoanPayment.objects.filter(loan__borrower=self.request.user)
