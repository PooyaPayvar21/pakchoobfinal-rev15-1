from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0054_fix_formcodes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='submitform',
            name='formcode',
            field=models.CharField(max_length=100, null=True, unique=True),
        ),
    ]
