from django.db import migrations
from django.utils import timezone

def fix_formcodes(apps, schema_editor):
    SubmitForm = apps.get_model('api', 'SubmitForm')
    
    # Group forms by phase and section
    forms = SubmitForm.objects.all().order_by('problemdate')
    
    # Dictionary to keep track of sequence numbers
    sequence_counters = {}
    
    for form in forms:
        if not form.formcode or not form.phase or not form.section:
            continue
            
        # Get section code from section name (simplified version)
        section_code = "01"  # Default to 01 if unknown
        
        # Get month from problemdate
        month = form.problemdate.strftime("%m") if form.problemdate else "00"
        
        # Create key for this phase/section/month combination
        key = f"{form.phase}{section_code}{month}"
        
        # Get next sequence number
        if key not in sequence_counters:
            sequence_counters[key] = 1
        else:
            sequence_counters[key] += 1
            
        # Generate new formcode
        new_formcode = f"{form.phase}{section_code}{month}{str(sequence_counters[key]).zfill(2)}"
        
        # Update form
        form.formcode = new_formcode
        form.save()

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0053_alter_loginuser_options_and_more'),  
    ]

    operations = [
        migrations.RunPython(fix_formcodes),
    ]
