import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0136_loginuser_company_name_loginuser_departman_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="KPIPersonel",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("full_name", models.CharField(max_length=200, blank=True, default="")),
                ("personal_code", models.CharField(max_length=50, db_index=True)),
                ("job_title", models.CharField(max_length=100, blank=True, default="")),
                ("departman", models.CharField(max_length=200, blank=True, default="")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "KPI Personel",
                "verbose_name_plural": "KPI Personels",
                "ordering": ["full_name"],
            },
        ),
    ]
