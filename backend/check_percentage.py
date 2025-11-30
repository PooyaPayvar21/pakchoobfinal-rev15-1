#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import KPIWork
from api.serializers import KPIWorkSerializer

works = KPIWork.objects.filter(person_id=68).order_by('-created_at')
print(f"\nChecking {works.count()} works for person_id=68:")
print("-" * 60)

for work in works:
    serializer = KPIWorkSerializer(work)
    data = serializer.data
    print(f"\nWork ID: {work.id}")
    print(f"  Task: {work.task_name}")
    print(f"  Percentage in DB: {work.percentage}")
    print(f"  Percentage in Serializer: {data.get('percentage')}")
    print(f"  Status in DB: {work.status}")
    print(f"  Status in Serializer: {data.get('status')}")
    
print("\n" + "-" * 60)
