"""
Script per creare un utente admin
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

# Verifica se l'utente admin esiste già
if User.objects.filter(username='admin').exists():
    print('L\'utente admin esiste già')
else:
    # Crea un nuovo utente admin
    User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='bankapp2024'
    )
    print('Utente admin creato con successo')
    print('Username: admin')
    print('Password: bankapp2024')
