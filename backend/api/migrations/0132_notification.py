from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0131_alter_kpiwork_section"),
    ]

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("personal_code", models.CharField(max_length=50, db_index=True)),
                ("title", models.CharField(max_length=200)),
                ("message", models.TextField(blank=True)),
                ("type", models.CharField(max_length=100, blank=True, default="info")),
                ("read", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={
                "ordering": ["-created_at"],
                "verbose_name": "Notification",
                "verbose_name_plural": "Notifications",
            },
        ),
    ]

