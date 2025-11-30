from django.core.management.base import BaseCommand
from api.models import LoginUser


class Command(BaseCommand):
    help = "Add test users for KPI dashboard"

    def handle(self, *args, **options):
        # Test users data
        test_users = [
            {
                "username": "پویا پایور",
                "email": "pooya@example.com",
                "password": "test123456",
                "user_type": "mechanic",
                "role": "technician",
                "sections": ["Chipper", "Press"],
            },
            {
                "username": "علی رسولی",
                "email": "ali@example.com",
                "password": "test123456",
                "user_type": "electric",
                "role": "management",
                "sections": ["Cooling System", "Steam Boiler"],
            },
            {
                "username": "محمد حسین",
                "email": "mohammad@example.com",
                "password": "test123456",
                "user_type": "utility",
                "role": "operator",
                "sections": ["Energy Plant"],
            },
            {
                "username": "فاطمه احمدی",
                "email": "fateme@example.com",
                "password": "test123456",
                "user_type": "mechanic",
                "role": "technician",
                "sections": ["Refiner", "Before Press"],
            },
            {
                "username": "حسن سلیمی",
                "email": "hasan@example.com",
                "password": "test123456",
                "user_type": "production",
                "role": "management",
                "sections": ["General"],
            },
            {
                "username": "زهرا محمودی",
                "email": "zahra@example.com",
                "password": "test123456",
                "user_type": "paint",
                "role": "operator",
                "sections": ["Sanding"],
            },
        ]

        for user_data in test_users:
            username = user_data["username"]
            # Check if user already exists
            if LoginUser.objects.filter(username=username).exists():
                self.stdout.write(
                    self.style.WARNING(f'User "{username}" already exists, skipping...')
                )
                continue

            # Create user
            user = LoginUser.objects.create_user(
                username=user_data["username"],
                email=user_data["email"],
                password=user_data["password"],
                user_type=user_data["user_type"],
                role=user_data["role"],
                sections=user_data["sections"],
                first_name=user_data["username"].split()[0] if " " in user_data["username"] else user_data["username"],
                last_name=user_data["username"].split()[1] if " " in user_data["username"] else "",
            )

            self.stdout.write(
                self.style.SUCCESS(f'Successfully created user "{username}"')
            )

        self.stdout.write(self.style.SUCCESS("Test users added successfully!"))
