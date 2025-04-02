"""
Script per attivare i prestiti e impostare l'importo rimanente
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from loans.models import Loan
from decimal import Decimal

# Aggiorna tutti i prestiti in stato 'approved' a 'active' e imposta remaining_amount
loans = Loan.objects.filter(status='approved')
count = 0

for loan in loans:
    loan.status = 'active'
    if loan.remaining_amount is None:
        loan.remaining_amount = loan.amount
    loan.save()
    count += 1
    print(f'Prestito {loan.id} aggiornato: stato={loan.status}, importo rimanente={loan.remaining_amount}')

if count == 0:
    print("Nessun prestito trovato in stato 'approved'")
else:
    print(f"{count} prestiti aggiornati con successo")

# Verifica che tutti i prestiti attivi abbiano un importo rimanente
active_loans = Loan.objects.filter(status='active', remaining_amount__isnull=True)
for loan in active_loans:
    loan.remaining_amount = loan.amount
    loan.save()
    print(f'Prestito attivo {loan.id} aggiornato con importo rimanente: {loan.remaining_amount}')
