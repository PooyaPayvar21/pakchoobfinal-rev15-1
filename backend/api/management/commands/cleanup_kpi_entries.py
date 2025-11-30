from django.core.management.base import BaseCommand
from api.models import KPIEntry

class Command(BaseCommand):
    help = "Remove KPIEntry rows with missing personal_code (cleanup duplicates from early import)"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        qs = KPIEntry.objects.filter(personal_code__isnull=True) | KPIEntry.objects.filter(personal_code="")
        count = qs.count()
        if options.get("dry_run"):
            self.stdout.write(self.style.WARNING(f"Dry-run: would delete {count} rows"))
            return
        deleted = 0
        for obj in qs:
            obj.delete()
            deleted += 1
        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted} KPIEntry rows with empty personal_code"))
