import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import KPIWork, LoginUser

# Create a KPI work for user ID 68 (P.payvar)
user = LoginUser.objects.get(id=68)
print(f"Creating KPI work for user: {user.username} (ID: {user.id})")

work = KPIWork.objects.create(
    facility="پاک چوب خوزستان",
    section="PM",
    role="مدیر",
    person=user,
    task_name="بررسی PM های قسمت Formalin",
    description="بررسی و کنترل کار PM قسمت Formalin",
    status="Working",
    percentage=50,
    notes="این کار برای تست است"
)

print(f"Created KPI work ID: {work.id} for user {user.username}")

# Verify
works = KPIWork.objects.filter(person_id=68)
print(f"User {user.username} now has {works.count()} KPI works:")
for w in works:
    print(f"  - {w.id}: {w.task_name}")
