import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import LoginUser, KPIWork

# Check KPI work for both users
for user_id in [2, 68]:
    user = LoginUser.objects.get(id=user_id)
    works = KPIWork.objects.filter(person_id=user_id)
    print(f"User ID {user_id} ('{user.username}'): {works.count()} KPI works")
    for work in works:
        print(f"  - {work.id}: {work.task_name}")
