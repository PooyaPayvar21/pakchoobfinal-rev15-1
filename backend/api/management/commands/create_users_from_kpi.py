import secrets
import string
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import KPIEntry

User = get_user_model()


class Command(BaseCommand):
    help = "Create users from KPIEntry personal_code with auto-generated passwords"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user-type",
            type=str,
            default="production",
            help="Default user type for created users (default: production)",
        )
        parser.add_argument(
            "--role",
            type=str,
            default="operator",
            help="Default role for created users (default: operator)",
        )
        parser.add_argument(
            "--show-passwords",
            action="store_true",
            help="Display passwords in output (use with caution)",
        )
        parser.add_argument(
            "--use-code-password",
            action="store_true",
            help="Use personal_code as the password (INSECURE; for initial setup only)",
        )

    def generate_password(self, length=12):
        """Generate a secure random password"""
        characters = string.ascii_letters + string.digits + string.punctuation
        password = "".join(secrets.choice(characters) for _ in range(length))
        return password

    def handle(self, *args, **options):
        user_type = options.get("user_type")
        role = options.get("role")
        show_passwords = options.get("show_passwords")
        use_code_password = options.get("use_code_password")

        # Get all unique personal_codes from KPIEntry
        kpi_entries = (
            KPIEntry.objects.filter(personal_code__isnull=False)
            .exclude(personal_code="")
            .values("personal_code", "full_name")
            .distinct()
        )

        if not kpi_entries.exists():
            self.stdout.write(
                self.style.WARNING("No KPI entries with personal_code found")
            )
            return

        created_count = 0
        skipped_count = 0
        users_data = []

        self.stdout.write(
            self.style.SUCCESS(f"Found {kpi_entries.count()} unique personal codes")
        )
        self.stdout.write("Processing...\n")

        for entry in kpi_entries:
            personal_code = entry["personal_code"]
            full_name = entry["full_name"] or f"User {personal_code}"

            # Use personal_code as username (with sanitization if needed)
            username = personal_code.strip()

            # Check if user already exists
            if User.objects.filter(username=username).exists():
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipped: User with username '{username}' already exists"
                    )
                )
                skipped_count += 1
                continue

            # Choose password scheme
            if use_code_password:
                password = username
            else:
                password = self.generate_password()

            try:
                # Create user
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    first_name=full_name.split()[0] if full_name else "",
                    last_name=" ".join(full_name.split()[1:]) if full_name else "",
                    user_type=user_type,
                    role=role,
                )

                users_data.append(
                    {
                        "username": username,
                        "password": password,
                        "full_name": full_name,
                        "user_type": user_type,
                        "role": role,
                    }
                )

                self.stdout.write(
                    self.style.SUCCESS(f"Created user: {username} ({full_name})")
                )
                created_count += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error creating user {username}: {str(e)}")
                )

        # Summary
        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.SUCCESS(f"Summary:"))
        self.stdout.write(f"  Created: {created_count} users")
        self.stdout.write(f"  Skipped: {skipped_count} users")
        self.stdout.write("=" * 80)

        # Display credentials if requested
        if show_passwords and users_data:
            self.stdout.write("\n" + self.style.WARNING("USER CREDENTIALS:"))
            self.stdout.write(self.style.WARNING("Keep this information secure!"))
            self.stdout.write("-" * 80)
            for user_data in users_data:
                self.stdout.write(
                    f"Username: {user_data['username']} | Password: {user_data['password']}"
                )
            self.stdout.write("-" * 80)
        elif users_data:
            self.stdout.write(
                self.style.WARNING(
                    "\nPasswords have been generated. Use --show-passwords flag to display them."
                )
            )

        # Optionally save to file
        if users_data:
            import json
            from datetime import datetime

            filename = f"kpi_users_credentials_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, "w") as f:
                json.dump(users_data, f, indent=2)
            self.stdout.write(
                self.style.SUCCESS(f"\nCredentials saved to: {filename}")
            )
