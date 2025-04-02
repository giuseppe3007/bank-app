"""
Script per reimpostare la password dell'utente admin
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

try:
    user = User.objects.get(username='admin')
    
    # Imposta una nuova password
    new_password = 'bankapp2024'
    user.set_password(new_password)
    
    # Assicurati che l'account sia attivo
    user.is_active = True
    
    user.save()
    
    print(f'La password dell\'utente {user.username} è stata reimpostata con successo')
    print(f'Username: {user.username}')
    print(f'Password: {new_password}')
    
except User.DoesNotExist:
    print('L\'utente admin non esiste')
