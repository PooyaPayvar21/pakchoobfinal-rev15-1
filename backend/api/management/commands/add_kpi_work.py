from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import LoginUser, KPIWork


class Command(BaseCommand):
    help = "Add test KPI work entries for users"

    def handle(self, *args, **options):
        # KPI work entries data
        kpi_work_entries = [
            {
                "person_username": "پویا پایور",
                "facility": "پاک چوب خوزستان",
                "section": "PM",
                "role": "مدیر",
                "task_name": "بررسی گزارش تولید",
                "description": "بررسی و تحلیل گزارش تولید روزانه و تعیین اقدامات بهبود",
                "status": "Working",
                "percentage": 75,
                "due_date": timezone.now().date() + timedelta(days=2),
                "notes": "نیاز به بحث با تیم پروژه",
            },
            {
                "person_username": "پویا پایور",
                "facility": "پاک چوب خوزستان",
                "section": "Production",
                "role": "مدیر",
                "task_name": "هماهنگی برنامه ریزی تولید",
                "description": "هماهنگی برنامه ریزی با واحد فروش و انبار",
                "status": "Done",
                "percentage": 100,
                "due_date": timezone.now().date(),
                "notes": "انجام شده با موفقیت",
            },
            {
                "person_username": "علی رسولی",
                "facility": "پاک چوب ایرانیان",
                "section": "QC",
                "role": "رئیس",
                "task_name": "بررسی کیفیت محصول",
                "description": "انجام آزمایشات کیفیت روی نمونه‌های تولید",
                "status": "Working",
                "percentage": 60,
                "due_date": timezone.now().date() + timedelta(days=1),
                "notes": "",
            },
            {
                "person_username": "محمد حسین",
                "facility": "پاک چوب خراسان",
                "section": "WareHouse",
                "role": "کارشناس",
                "task_name": "موجودی انبار",
                "description": "ثبت و بروزرسانی موجودی کالاهای انبار",
                "status": "Done",
                "percentage": 100,
                "due_date": timezone.now().date(),
                "notes": "سیستم بروزرسانی شد",
            },
            {
                "person_username": "فاطمه احمدی",
                "facility": "پاک چوب تخته فشرده",
                "section": "HSE",
                "role": "کارشناس",
                "task_name": "بازرسی ایمنی",
                "description": "بازرسی روزانه مکان‌های کار و ثبت نتایج",
                "status": "Working",
                "percentage": 50,
                "due_date": timezone.now().date() + timedelta(days=3),
                "notes": "نیاز به بررسی نقاط خطرناک",
            },
            {
                "person_username": "حسن سلیمی",
                "facility": "گروه صنعتی",
                "section": "Financial",
                "role": "مدیر",
                "task_name": "تهیه گزارش مالی",
                "description": "تهیه گزارش مالی ماهانه و ارسال به مدیریت",
                "status": "Not Done",
                "percentage": 0,
                "due_date": timezone.now().date() + timedelta(days=5),
                "notes": "",
            },
            {
                "person_username": "زهرا محمودی",
                "facility": "پاک چوب خوزستان",
                "section": "Sales",
                "role": "رئیس",
                "task_name": "پیگیری سفارشات",
                "description": "پیگیری و تکمیل سفارشات معلق",
                "status": "Working",
                "percentage": 85,
                "due_date": timezone.now().date() + timedelta(days=1),
                "notes": "اکثر سفارشات در حال تکمیل",
            },
            {
                "person_username": "علی رسولی",
                "facility": "پاک چوب ایرانیان",
                "section": "Production",
                "role": "مدیر",
                "task_name": "نظارت بر خط تولید",
                "description": "نظارت بر خط تولید و حل مشکلات فنی",
                "status": "Working",
                "percentage": 70,
                "due_date": timezone.now().date() + timedelta(days=2),
                "notes": "",
            },
        ]

        for work_data in kpi_work_entries:
            try:
                # Get the person
                person = LoginUser.objects.get(username=work_data["person_username"])

                # Create KPI work entry
                kpi_work = KPIWork.objects.create(
                    person=person,
                    facility=work_data["facility"],
                    section=work_data["section"],
                    role=work_data["role"],
                    task_name=work_data["task_name"],
                    description=work_data["description"],
                    status=work_data["status"],
                    percentage=work_data["percentage"],
                    due_date=work_data["due_date"],
                    notes=work_data["notes"],
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created KPI work: "{work_data["task_name"]}" for {work_data["person_username"]}'
                    )
                )
            except LoginUser.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(
                        f'User "{work_data["person_username"]}" not found'
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error creating KPI work: {str(e)}")
                )

        self.stdout.write(self.style.SUCCESS("KPI work entries added successfully!"))
