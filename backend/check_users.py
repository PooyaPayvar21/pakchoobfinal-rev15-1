import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import LoginUser

users = LoginUser.objects.filter(username__istartswith='p')
print("Users starting with 'p':")
for u in users:
    print(f"  ID: {u.id}, Username: '{u.username}', Role: {u.role}")
