from turtle import mode
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import MinLengthValidator
from django.conf import settings


class LoginUser(AbstractUser):
    USER_TYPE_CHOICE = (
        ("ceo", "CEO"),
        ("management", "Management"),
        ("manager", "Manager"),
        ("superadmin", "SuperAdmin"),
        ("pm", "PM"),
        ("production", "Production"),
        ("generalmechanic", "General Mechanic"),
        ("mechanic", "Mechanic"),
        ("electric", "Electric"),
        ("utility", "Utility"),
        ("metalworking", "Metal Working"),
        ("tarashkari", "Tarash Kari"),
        ("paint", "Paint"),
    )

    ROLE_CHOICES = (
        ("ceo", "CEO"),
        ("management", "Management"),
        ("manager", "Manager"),
        ("superadmin", "SuperAdmin"),
        ("technician", "Technician"),
        ("operator", "Operator"),
    )

    ADDITIONAL_ROLE_CHOICES = (
        ("metalworking", "Metal Working"),
        ("tarashkari", "Tarash Kari"),
        ("paint", "Paint"),
    )

    SECTION_CHOICES = (
        ("Chipper", "Chipper"),
        ("Conveyor Line", "Conveyor Line"),
        ("Dryer & Air Grader", "Dryer & Air Grader"),
        ("Refiner", "Refiner"),
        ("Energy Plant", "Energy Plant"),
        ("Before Press", "Before Press"),
        ("Press", "Press"),
        ("After Press", "After Press"),
        ("Sanding", "Sanding"),
        ("Cooling System", "Cooling System"),
        ("Steam Boiler", "Steam Boiler"),
        ("General", "General"),
        ("Melamine", "Melamine"),
        ("High Glass", "High Glass"),
        ("Formalin", "Formalin"),
        ("Resin", "Resin"),
        ("Water Treatment Plant", "Water Treatment Plant"),
        ("Paper Impregnation 1", "Paper Impregnation 1"),
        ("Paper Impregnation 2", "Paper Impregnation 2"),
        ("Paper Impregnation 3", "Paper Impregnation 3"),
    )

    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[MinLengthValidator(3)],
        help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.",
    )
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="operator")
    sections = models.JSONField(default=list, blank=True)
    additional_roles = models.JSONField(default=list, blank=True)

    company_name = models.CharField(max_length=200, blank=True, default="")
    season = models.CharField(max_length=50, blank=True, default="")
    personal_code = models.CharField(max_length=50, blank=True, default="")
    full_name = models.CharField(max_length=200, blank=True, default="")
    direct_management = models.CharField(max_length=200, blank=True, default="")
    departman = models.CharField(max_length=200, blank=True, default="")
    kpi_role = models.CharField(max_length=100, blank=True, default="")

    def save(self, *args, **kwargs):
        if not isinstance(self.sections, list):
            self.sections = [self.sections] if self.sections else []
        if not isinstance(self.additional_roles, list):
            self.additional_roles = (
                [self.additional_roles] if self.additional_roles else []
            )
        super().save(*args, **kwargs)

    def is_technician(self):
        return self.role == "technician"

    def is_management(self):
        return self.role == "management"

    def is_operator(self):
        return self.role == "operator"

    def can_view_department_forms(self, department):
        if self.user_type == "pm":
            return True
        if self.user_type == department:
            return True
        if self.user_type == "production" and self.is_management():
            return True
        if self.user_type == "generalmechanic" and department in [
            "metalworking",
            "paint",
            "tarashkari",
        ]:
            return True
        return False

    class Meta:
        db_table = "login_user"


class Section(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

    # Login Users





class SubmitForm(models.Model):
    STATUS_CHOICES = (
        ("pending_technician", "Pending Technician Review"),
        ("technician_submitted", "Technician Submitted"),
        ("pending_production", "Pending Production Confirmation"),
        ("production_confirmed", "Production Confirmed"),
        ("pending_management", "Pending Management Approval"),
        ("management_approved", "Management Approved"),
        ("pending_management_confirm", "Pending Production Management Confirmed"),
        ("production_management_confirm", "Production Management Confirmed"),
        ("pm_technician_pending", "Pending Technician PM Send to Management"),
        ("pending_pm", "Pending PM Review"),
        ("completed", "Completed"),
        ("rejected", "Rejected"),
    )

    WORKTYPE_CHOICES = (
        ("mechanic", "Mechanic"),
        ("electric", "Electric"),
        ("utility", "Utility"),
        ("generalmechanic", "General Mechanic"),
        ("metalworking", "Metal Working"),
        ("tarashkari", "Tarash Kari"),
        ("paint", "Paint"),
    )

    formcode = models.CharField(
        max_length=10, unique=True, null=True, blank=True, default=""
    )
    problemdate = models.DateTimeField(null=True, blank=True)
    machinename = models.CharField(max_length=100, default="")
    phase = models.CharField(max_length=2, default="01")
    machinecode = models.CharField(max_length=50, default="")
    machineplacecode = models.CharField(max_length=50, blank=True, default="")
    worktype = models.CharField(max_length=50, default="")
    stoptime = models.DateTimeField(null=True, blank=True)
    endtime = models.DateTimeField(null=True, blank=True)
    failuretimesubmit = models.CharField(max_length=20, default="0")
    operatorname = models.CharField(max_length=100, default="")
    productionstop = models.CharField(max_length=10, default="خیر")
    section = models.CharField(max_length=50, blank=True, default="")
    shift = models.CharField(max_length=5, blank=True, default="")
    suggesttime = models.CharField(max_length=30, null=True)
    worksuggest = models.CharField(max_length=100, null=True)
    fixrepair = models.CharField(max_length=100, null=True)
    reportinspection = models.CharField(max_length=100, null=True)
    faultdm = models.CharField(max_length=100, null=True)
    problemdescription = models.TextField(blank=True, null=True)
    formtype = models.CharField(max_length=50, blank=True, default="")
    formnote = models.CharField(max_length=200, blank=True)
    formnote_user = models.ForeignKey(
        LoginUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="formnotes",
    )
    formnote_edited = models.BooleanField(default=False)
    stoptype = models.CharField(max_length=50)
    endtime_updated = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    # Signature dates
    operator_confirmation_date = models.DateTimeField(null=True, blank=True)
    technician_confirmation_date = models.DateTimeField(null=True, blank=True)
    management_confirmation_date = models.DateTimeField(null=True, blank=True)
    production_management_confirmation_date = models.DateTimeField(
        null=True, blank=True
    )
    pm_confirmation_date = models.DateTimeField(null=True, blank=True)

    # Signature Name

    operator_confirmation_name = models.CharField(max_length=100, blank=True)
    technician_confirmation_name = models.CharField(max_length=100, blank=True)
    management_confirmation_name = models.CharField(max_length=100, blank=True)
    production_management_confirmation_name = models.CharField(
        max_length=100, blank=True
    )
    pm_confirmation_name = models.CharField(max_length=100, blank=True)

    # Workflow fields
    status = models.CharField(
        max_length=50, choices=STATUS_CHOICES, default="pending_technician"
    )
    assigned_department = models.CharField(
        max_length=50, choices=WORKTYPE_CHOICES, null=True, default=""
    )
    created_by = models.ForeignKey(
        LoginUser, on_delete=models.SET_NULL, null=True, related_name="created_forms"
    )
    current_assignee = models.ForeignKey(
        LoginUser, on_delete=models.SET_NULL, null=True, related_name="assigned_forms"
    )

    def get_next_status(self, user):
        """
        Determine the next status based on current status and user role
        """
        if not user:
            return self.status

        if (
            self.status == "pending_technician"
            and user.is_technician()
            and user.user_type == self.assigned_department
        ):
            return "technician_submitted"
        elif (
            self.status == "technician_submitted"
            and user.is_management()
            and user.user_type == self.assigned_department
        ):
            return "management_approved"
        elif (
            self.status == "management_approved"
            and user.user_type == "production"
            and user.is_management()
        ):
            return "production_confirmed"
        elif self.status == "production_confirmed" and user.user_type == "pm":
            return "completed"
        return self.status

    def can_view_form(self, user):
        """
        Check if user can view this form
        """
        if user.user_type == "pm":
            return True
        if user.user_type == "production" and user.is_management():
            return True
        if user.user_type == self.assigned_department:
            return True
        return False

    def can_edit_form(self, user):
        """
        Check if user can edit this form based on workflow status
        """
        if not user:
            return False

        if (
            self.status == "pending_technician"
            and user.is_technician()
            and user.user_type == self.assigned_department
        ):
            return True
        elif (
            self.status == "technician_submitted"
            and user.is_management()
            and user.user_type == self.assigned_department
        ):
            return True
        elif (
            self.status == "management_approved"
            and user.user_type == "production"
            and user.is_management()
        ):
            return True
        elif self.status == "production_confirmed" and user.user_type == "pm":
            return True
        return False

    class Meta:
        ordering = ["-problemdate"]

    def __str__(self):
        return self.formcode


# Pm Forms Submit


class PmForms(models.Model):
    STATUS_CHOICES = (
        ("pending_pm_technician", "Pending PM Technician Review"),
        ("pending_pm_management", "Pending PM Management First Review"),
        ("pending_worktype_technician", "Pending Worktype Technician Review"),
        ("worktype_technician_submitted", "Worktype Technician Submitted"),
        ("pending_worktype_management", "Pending Worktype Management Approval"),
        ("worktype_management_approved", "Worktype Management Approved"),
        ("pending_production_operator", "Pending Production Operator"),
        ("production_operator_confirmed", "Production Operator Confirmed"),
        ("pending_production_management", "Pending Production Management"),
        ("production_management_confirmed", "Production Management Confirmed"),
        ("pending_final_pm_technician", "Pending Final PM Technician Review"),
        ("pending_final_pm_management", "Pending Final PM Management Review"),
        ("completed", "Completed"),
        ("rejected", "Rejected"),
    )

    WORKTYPE_CHOICES = (
        ("mechanic", "Mechanic"),
        ("electric", "Electric"),
        ("utility", "Utility"),
        ("generalmechanic", "General Mechanic"),
        ("metalworking", "Metal Working"),
        ("tarashkari", "Tarash Kari"),
        ("paint", "Paint"),
    )

    pmformcode = models.CharField(
        max_length=10, unique=True, null=True, blank=True, default=""
    )
    pmformdate = models.DateTimeField(null=True, blank=True)
    pmphase = models.CharField(max_length=2, default="01")
    unitname = models.CharField(max_length=20)
    pmworktype = models.CharField(max_length=20, choices=WORKTYPE_CHOICES)
    pmsection = models.CharField(max_length=30)
    pmmachinename = models.CharField(max_length=30)
    pmsubject = models.CharField(max_length=100)
    pmformnote = models.CharField(max_length=200, blank=True)
    pmstatus = models.CharField(
        max_length=50, choices=STATUS_CHOICES, default="pending_pm_technician"
    )
    assigned_department = models.CharField(
        max_length=50, choices=WORKTYPE_CHOICES, null=True, default=""
    )
    created_by = models.ForeignKey(
        LoginUser, on_delete=models.SET_NULL, null=True, related_name="created_pm_forms"
    )
    current_assignee = models.ForeignKey(
        LoginUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assigned_pm_forms",
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    # Signature dates
    pm_technician_confirmation_date = models.DateTimeField(null=True, blank=True)
    pm_management_confirmation_date = models.DateTimeField(null=True, blank=True)
    worktype_technician_confirmation_date = models.DateTimeField(null=True, blank=True)
    worktype_management_confirmation_date = models.DateTimeField(null=True, blank=True)
    production_operator_confirmation_date = models.DateTimeField(null=True, blank=True)
    production_management_confirmation_date = models.DateTimeField(
        null=True, blank=True
    )
    final_pm_technician_confirmation_date = models.DateTimeField(null=True, blank=True)
    final_pm_management_confirmation_date = models.DateTimeField(null=True, blank=True)

    # Signature name
    pm_technician_confirmation_name = models.CharField(max_length=100, blank=True)
    pm_management_confirmation_name = models.CharField(max_length=100, blank=True)
    worktype_technician_confirmation_name = models.CharField(max_length=100, blank=True)
    worktype_management_confirmation_name = models.CharField(max_length=100, blank=True)
    production_operator_confirmation_name = models.CharField(max_length=100, blank=True)
    production_management_confirmation_name = models.CharField(
        max_length=100, blank=True
    )
    final_pm_technician_confirmation_name = models.CharField(max_length=100, blank=True)
    final_pm_management_confirmation_name = models.CharField(max_length=100, blank=True)

    def get_next_status(self, user):
        """
        Determine the next status based on current status and user role
        """
        if not user:
            return self.pmstatus

        # Add debugging
        print(f"Checking next status for user {user.username}")
        print(f"Current status: {self.pmstatus}")
        print(f"User type: {user.user_type}, Role: {user.role}")
        print(f"Form worktype: {self.pmworktype}")

        if (
            self.pmstatus == "pending_pm_technician"
            and user.user_type == "pm"
            and user.role == "technician"
        ):
            return "pending_pm_management"
        elif (
            self.pmstatus == "pending_pm_management"
            and user.user_type == "pm"
            and user.role == "management"
        ):
            return "pending_worktype_technician"
        elif (
            self.pmstatus == "pending_worktype_technician"
            and user.role == "technician"
            and user.user_type == self.pmworktype
        ):
            return "worktype_technician_submitted"
        elif (
            self.pmstatus == "worktype_technician_submitted"
            and user.user_type == "production"
            and user.role == "operator"
        ):
            return "pending_worktype_management"
        elif self.pmstatus == "pending_worktype_management" and (
            (user.user_type == self.pmworktype and user.role == "management")
            or (
                user.user_type == "generalmechanic"
                and user.role == "management"
                and self.pmworktype in ["metalworking", "paint", "tarashkari"]
            )
        ):
            return "worktype_management_approved"
        elif (
            self.pmstatus == "production_operator_confirmed"
            and user.user_type == "production"
            and user.role == "operator"
        ):
            return "pending_worktype_management"
        elif (
            self.pmstatus == "worktype_management_approved"
            and user.user_type == "production"
            and user.role == "management"
        ):
            return "production_management_confirmed"
        elif (
            self.pmstatus == "production_management_confirmed"
            and user.user_type == "pm"
            and user.role == "technician"
        ):
            return "pending_final_pm_management"
        elif (
            self.pmstatus == "pending_final_pm_management"
            and user.user_type == "pm"
            and user.role == "management"
        ):
            return "completed"
        return self.pmstatus

    def can_view_form(self, user):
        """
        Check if user can view this form
        """
        if user.user_type == "pm":
            return True
        if user.user_type == "production" and user.role == "management":
            return True
        if user.user_type == self.worktype:
            return True
        return False

    def can_edit_form(self, user):
        """
        Check if user can edit this form based on workflow status
        """
        if not user:
            return False

        if (
            self.pmstatus == "pending_pm_technician"
            and user.user_type == "pm"
            and user.role == "technician"
        ):
            return True
        elif (
            self.pmstatus == "pending_pm_management"
            and user.user_type == "pm"
            and user.role == "management"
        ):
            return True
        elif (
            self.pmstatus == "pending_worktype_technician"
            and user.role == "technician"
            and user.user_type == self.pmworktype  # Changed from self.worktype
        ):
            return True
        elif (
            self.pmstatus == "worktype_technician_submitted"
            and user.role == "management"
            and user.user_type == self.pmworktype
        ):
            return True
        elif (
            self.pmstatus == "worktype_management_approved"
            and user.user_type == "production"
            and user.role == "operator"
        ):
            return True
        elif self.pmstatus == "pending_worktype_management" and (
            (user.user_type == self.pmworktype and user.role == "management")
            or (
                user.user_type == "generalmechanic"
                and user.role == "management"
                and self.pmworktype in ["metalworking", "paint", "tarashkari"]
            )
        ):
            return True
        elif (
            self.pmstatus == "production_operator_confirmed"
            and user.user_type == "production"
            and user.role == "management"
        ):
            return True
        elif (
            self.pmstatus == "production_management_confirmed"
            and user.user_type == "pm"
            and user.role == "technician"
        ):
            return True
        elif (
            self.pmstatus == "pending_final_pm_management"
            and user.user_type == "pm"
            and user.role == "management"
        ):
            return True
        return False

    class Meta:
        verbose_name = "PM Form"
        verbose_name_plural = "PM Forms"

    def __str__(self):
        return f"PM Form {self.pmformcode}"


# Pm Forms Technician Submit
class PmTechnician(models.Model):
    pmformcode = models.CharField(max_length=100, null=True)
    pmfailurereason = models.CharField(max_length=100)
    pmworktype = models.CharField(max_length=50)
    pmproblemdescription = models.TextField(blank=True, null=True)
    startpmrepairtime = models.DateTimeField(null=True, blank=True)
    endpmrepairtime = models.DateTimeField(null=True, blank=True)
    worktime = models.CharField(max_length=50)
    notdonereason = models.CharField(max_length=50)
    pmjobstatus = models.CharField(
        max_length=20,
        choices=[
            ("بله", "کار انجام شد"),
            ("خیر", "کار انجام نشد"),
            ("در حال انجام", "در حال انجام"),
        ],
        default="کار انجام شد",
    )
    pm_submit = models.ForeignKey(
        PmForms,
        on_delete=models.CASCADE,
        related_name="technician",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"Technician Submit {self.pmformcode}"


# Pm Aghlam
class PmAghlam(models.Model):
    pmformcode = models.CharField(max_length=100, null=True)
    kalaname = models.CharField(max_length=50)
    countkala = models.CharField(max_length=50)
    vahedkala = models.CharField(max_length=50)
    codekala = models.CharField(max_length=50)
    pm_submit = models.ForeignKey(
        PmForms,
        on_delete=models.CASCADE,
        related_name="aghlam",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"Aghlam Submit {self.pmformcode}"


# Pm Technician Personel
class PmPersonel(models.Model):
    pmformcode = models.CharField(max_length=100, null=True)
    personel = models.CharField(max_length=50)
    personelnumber = models.CharField(max_length=50)
    specialjob = models.CharField(max_length=50)
    starttimerepair = models.DateTimeField(null=True)
    endtimerepair = models.DateTimeField(null=True)
    personel2 = models.CharField(max_length=50, default="")
    personelnumber2 = models.CharField(max_length=50, default="")
    specialjob2 = models.CharField(max_length=50, default="")
    starttimerepair2 = models.DateTimeField(null=True)
    endtimerepair2 = models.DateTimeField(null=True)
    personel3 = models.CharField(max_length=50, default="")
    personelnumber3 = models.CharField(max_length=50, default="")
    specialjob3 = models.CharField(max_length=50, default="")
    starttimerepair3 = models.DateTimeField(null=True)
    endtimerepair3 = models.DateTimeField(null=True)
    personel4 = models.CharField(max_length=50, default="")
    personelnumber4 = models.CharField(max_length=50, default="")
    specialjob4 = models.CharField(max_length=50, default="")
    starttimerepair4 = models.DateTimeField(null=True)
    endtimerepair4 = models.DateTimeField(null=True)
    personel5 = models.CharField(max_length=50, default="")
    personelnumber5 = models.CharField(max_length=50, default="")
    specialjob5 = models.CharField(max_length=50, default="")
    starttimerepair5 = models.DateTimeField(null=True)
    endtimerepair5 = models.DateTimeField(null=True)
    personel6 = models.CharField(max_length=50, default="")
    personelnumber6 = models.CharField(max_length=50, default="")
    specialjob6 = models.CharField(max_length=50, default="")
    starttimerepair6 = models.DateTimeField(null=True)
    endtimerepair6 = models.DateTimeField(null=True)
    personel7 = models.CharField(max_length=50, default="")
    personelnumber7 = models.CharField(max_length=50, default="")
    specialjob7 = models.CharField(max_length=50, default="")
    starttimerepair7 = models.DateTimeField(null=True)
    endtimerepair7 = models.DateTimeField(null=True)
    personel8 = models.CharField(max_length=50, default="")
    personelnumber8 = models.CharField(max_length=50, default="")
    specialjob8 = models.CharField(max_length=50, default="")
    starttimerepair8 = models.DateTimeField(null=True)
    endtimerepair8 = models.DateTimeField(null=True)
    unitrepair = models.CharField(max_length=50)
    shift = models.CharField(max_length=50)
    pm_submit = models.ForeignKey(
        PmForms,
        on_delete=models.CASCADE,
        related_name="personel",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"Personel Submit {self.pmformcode}"


# Technician Submit Forms


class TechnicianSubmit(models.Model):
    formcode = models.CharField(max_length=100, null=True)
    failurepart = models.CharField(max_length=50)
    failuretime = models.CharField(max_length=20, default="0")
    sparetime = models.CharField(max_length=20, default="0")
    wastedtime = models.CharField(max_length=20, default="0")
    startfailuretime = models.CharField(max_length=20, default="0")
    problemdescription = models.TextField(blank=True, null=True)
    jobstatus = models.CharField(
        max_length=20,
        choices=[
            ("بله", "کار انجام شد"),
            ("خیر", "کار انجام نشد"),
            ("در حال انجام", "در حال انجام"),
        ],
        default="کار انجام شد",
    )
    pm_submit = models.ForeignKey(
        PmForms,
        on_delete=models.CASCADE,
        related_name="technician_submit",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"Technician Submit {self.formcode}"


# Aghlam Forms


class Aghlam(models.Model):
    formcode = models.CharField(max_length=100, null=True)
    kalaname = models.CharField(max_length=50)
    countkala = models.CharField(max_length=50)
    vahedkala = models.CharField(max_length=50)
    codekala = models.CharField(max_length=50)
    flamekala = models.CharField(max_length=50)
    submit_form = models.ForeignKey(
        SubmitForm,
        on_delete=models.CASCADE,
        related_name="aghlam",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"Aghlam Submit {self.formcode}"


# Personel Forms


class Personel(models.Model):
    formcode = models.CharField(max_length=100, null=True)
    personel = models.CharField(max_length=50)
    personelnumber = models.CharField(max_length=50)
    specialjob = models.CharField(max_length=50)
    starttimerepair = models.DateTimeField(null=True)
    endtimerepair = models.DateTimeField(null=True)
    personel2 = models.CharField(max_length=50, default="")
    personelnumber2 = models.CharField(max_length=50, default="")
    specialjob2 = models.CharField(max_length=50, default="")
    starttimerepair2 = models.DateTimeField(null=True)
    endtimerepair2 = models.DateTimeField(null=True)
    personel3 = models.CharField(max_length=50, default="")
    personelnumber3 = models.CharField(max_length=50, default="")
    specialjob3 = models.CharField(max_length=50, default="")
    starttimerepair3 = models.DateTimeField(null=True)
    endtimerepair3 = models.DateTimeField(null=True)
    personel4 = models.CharField(max_length=50, default="")
    personelnumber4 = models.CharField(max_length=50, default="")
    specialjob4 = models.CharField(max_length=50, default="")
    starttimerepair4 = models.DateTimeField(null=True)
    endtimerepair4 = models.DateTimeField(null=True)
    personel5 = models.CharField(max_length=50, default="")
    personelnumber5 = models.CharField(max_length=50, default="")
    specialjob5 = models.CharField(max_length=50, default="")
    starttimerepair5 = models.DateTimeField(null=True)
    endtimerepair5 = models.DateTimeField(null=True)
    personel6 = models.CharField(max_length=50, default="")
    personelnumber6 = models.CharField(max_length=50, default="")
    specialjob6 = models.CharField(max_length=50, default="")
    starttimerepair6 = models.DateTimeField(null=True)
    endtimerepair6 = models.DateTimeField(null=True)
    personel7 = models.CharField(max_length=50, default="")
    personelnumber7 = models.CharField(max_length=50, default="")
    specialjob7 = models.CharField(max_length=50, default="")
    starttimerepair7 = models.DateTimeField(null=True)
    endtimerepair7 = models.DateTimeField(null=True)
    personel8 = models.CharField(max_length=50, default="")
    personelnumber8 = models.CharField(max_length=50, default="")
    specialjob8 = models.CharField(max_length=50, default="")
    starttimerepair8 = models.DateTimeField(null=True)
    endtimerepair8 = models.DateTimeField(null=True)
    repairstatus = models.CharField(max_length=50)
    unitrepair = models.CharField(max_length=50)
    shift = models.CharField(max_length=50)
    delayreason = models.CharField(max_length=50)
    failurereason = models.CharField(max_length=50)
    failurereasondescription = models.CharField(max_length=50)
    suggestionfailure = models.CharField(max_length=50)
    submit_form = models.ForeignKey(
        SubmitForm,
        on_delete=models.CASCADE,
        related_name="personel",
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"Personel Submit {self.formcode}"


class Reminder(models.Model):
    WORKTYPE_CHOICES = (
        ("Installation", "Installation"),
        ("Maintenance", "Maintenance"),
        ("Repair", "Repair"),
        ("Inspection", "Inspection"),
        ("Emergency", "Emergency"),
        ("Consultation", "Consultation"),
        ("Training", "Training"),
        ("Other", "Other"),
    )

    name = models.CharField(max_length=200, help_text="Name/title of the reminder")
    datetime = models.DateTimeField(help_text="Date and time for the reminder")
    phoneNumbers = models.JSONField(
        default=list, help_text="List of phone numbers to send SMS to"
    )
    workType = models.CharField(
        max_length=50,
        choices=WORKTYPE_CHOICES,
        help_text="Type of work for this reminder",
    )
    description = models.TextField(
        blank=True, null=True, help_text="Optional description"
    )
    created_by = models.ForeignKey(
        LoginUser, on_delete=models.CASCADE, related_name="created_reminders"
    )
    is_sent = models.BooleanField(default=False, help_text="Whether SMS has been sent")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["datetime"]
        verbose_name = "Reminder"
        verbose_name_plural = "Reminders"

    def __str__(self):
        return f"{self.name} - {self.datetime.strftime('%Y-%m-%d %H:%M')}"

    def is_due(self):
        """Check if the reminder is due (current time >= reminder time)"""
        return timezone.now() >= self.datetime

    def is_overdue(self):
        """Check if the reminder is overdue and not sent"""
        return self.is_due() and not self.is_sent

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('info', 'Information'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]
    
    personal_code = models.CharField(max_length=50, db_index=True)
    title = models.CharField(max_length=200)
    message = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='info')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} - {self.personal_code}"


class WaterTreatment(models.Model):
    operator = models.CharField(max_length=100, default='', help_text="نام اپراتور")
    tarikhesabt = models.DateTimeField(null=True, blank=True, help_text="تاریخ و ساعت ثبت فرم")
    ghesmat = models.CharField(max_length=255, default='', help_text="قسمت مربوطه")
    mozu = models.CharField(max_length=255, default='', blank=True, help_text="موضوع")
    value = models.CharField(max_length=255, default='', help_text="مقدار اندازه گیری شده")
    shift = models.CharField(max_length=5, default='', help_text="شیفت کاری")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Water Treatment Record"
        verbose_name_plural = "Water Treatment Records"
        ordering = ['-tarikhesabt']
    
    def __str__(self):
        return f"{self.operator} - {self.ghesmat} - {self.mozu} - {self.tarikhesabt}"
    
class SubmitPM(models.Model):
    STATUS_CHOICES = (
        ("not_completed", "Not Completed"),
        ("completed", "Completed"),
        ("rejected", "Rejected"),
    )
    pmsubmitdate = models.DateTimeField(null=True,blank=True)
    pmserial = models.CharField(max_length=30, null=True, blank=True, default="")
    pmsection = models.CharField(max_length=100, blank=True, default="")
    pmsubject = models.CharField(max_length=250, blank=True , default='')
    pmworktype = models.CharField(max_length=100,blank=True, default="")
    pmstatus = models.CharField(max_length=50, choices=STATUS_CHOICES, default="")
    created_by = models.ForeignKey(LoginUser, on_delete=models.SET_NULL, null=True, related_name="created_submit_pm")
    current_assignee = models.ForeignKey(
        LoginUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_submit_pm"
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = 'Submit PM'
        verbose_name_plural = 'Submit PMs'
        ordering = ['-pmserial','-created_at']
    def __str__(self):
        if self.pmserial:
            return f"SubmitPM {self.pmserial}"
        if self.pmsubject:
            return f"SubmitPM {self.pmsubject}"
        return f"SubmitPM {self.id}"
    def save(self,*args,**kwargs):
        # Normalize pmworktype - store as comma-separated list without surrounding spaces
        if self.pmworktype and isinstance(self.pmworktype, str):
            # remove extra spaces around commas
            self.pmworktype = ",".join([p.strip() for p in self.pmworktype.split(",") if p.strip()])


class KPIWork(models.Model):
    """Model for storing KPI work entries from individuals in different facilities/sections"""
    
    STATUS_CHOICES = (
        ("Done", "کار انجام شد"),
        ("Working", "در حال انجام"),
        ("Not Done", "کار انجام نشده"),
    )
    
    FACILITY_CHOICES = (
        ("پاک چوب خوزستان", "پاک چوب خوزستان"),
        ("پاک چوب ایرانیان", "پاک چوب ایرانیان"),
        ("پاک چوب خراسان", "پاک چوب خراسان"),
        ("پاک چوب تخته فشرده", "پاک چوب تخته فشرده"),
        ("گروه صنعتی", "گروه صنعتی"),
    )
    
    SECTION_CHOICES = (
        ("Plant Maintenance", "Plant Maintenance"),
        ("Production", "Production"),
        ("QC", "QC"),
        ("Financial", "Financial"),
        ("Human Resources", "Human Resources"),
        ("HSE", "HSE"),
        ("WareHouse", "WareHouse"),
        ("Security", "Security"),
        ("Sales", "Sales"),
    )
    
    ROLE_CHOICES = (
        ("مدیر", "مدیر"),
        ("رئیس", "رئیس"),
        ("کارشناس", "کارشناس"),
    )
    
    facility = models.CharField(max_length=100, choices=FACILITY_CHOICES)
    section = models.CharField(max_length=100, choices=SECTION_CHOICES)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    person = models.ForeignKey(
        LoginUser, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name="kpi_work_entries"
    )
    task_name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Working")
    percentage = models.IntegerField(default=0, help_text="Completion percentage 0-100")
    due_date = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "KPI Work"
        verbose_name_plural = "KPI Works"
        indexes = [
            models.Index(fields=["person", "-created_at"]),
            models.Index(fields=["facility", "section"]),
        ]
    
    def __str__(self):
        return f"{self.person} - {self.task_name} ({self.facility})"
        # Generate a uniqueif not provided
        if not self.pmserial:
            base_code = timezone.now().strftime("PM%Y%m%d%H%M%S")
            # ensure uniqueness (very unlikely collision, but check)
            candidate = base_code
            suffix = 0
            while SubmitPM.objects.filter(pmserial=candidate).exists():
                suffix += 1
                candidate = f"{base_code}-{suffix}"
            self.pmserial = candidate

        super().save(*args, **kwargs)


class KPIWorkResponse(models.Model):
    """Model for storing user responses/answers to assigned KPI work"""
    
    STATUS_CHOICES = (
        ("submitted", "Submitted"),
        ("completed", "Completed"),
        ("in_review", "In Review"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )
    
    kpi_work = models.ForeignKey(
        KPIWork,
        on_delete=models.CASCADE,
        related_name="responses"
    )
    respondent = models.ForeignKey(
        LoginUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="kpi_responses"
    )
    response_text = models.TextField(help_text="User's response/answer to the work")
    completion_notes = models.TextField(blank=True, null=True, help_text="Completion notes")
    attachments = models.JSONField(
        default=list,
        blank=True,
        help_text="List of attachment URLs or file references"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="submitted"
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-submitted_at"]
        verbose_name = "KPI Work Response"
        verbose_name_plural = "KPI Work Responses"
        indexes = [
            models.Index(fields=["kpi_work", "-submitted_at"]),
            models.Index(fields=["respondent", "status"]),
        ]
    
    def __str__(self):
        return f"Response to {self.kpi_work.task_name} by {self.respondent}"


class KPIEntry(models.Model):
    """Table for KPI entries with the requested columns."""

    row = models.BigAutoField(primary_key=True)
    company_name = models.CharField(max_length=200, blank=True, verbose_name="company_name")
    season = models.CharField(max_length=50, blank=True, verbose_name="season")
    personal_code = models.CharField(max_length=50, blank=True, verbose_name="personal code")
    full_name = models.CharField(max_length=200, blank=True, verbose_name="full name")
    role = models.CharField(max_length=100, blank=True, verbose_name="role")
    direct_management = models.CharField(max_length=200, blank=True, verbose_name="direct management")
    departman = models.CharField(max_length=200, blank=True, verbose_name="departman")
    category = models.CharField(max_length=200, blank=True, verbose_name="categoty")

    obj_weight = models.DecimalField(
        max_digits=10, decimal_places=4, null=True, blank=True, verbose_name="obj weight"
    )

    kpi_en = models.CharField(max_length=250, blank=True, verbose_name="KPI En")
    kpi_fa = models.CharField(max_length=250, blank=True, verbose_name="KPI Fa")
    kpi_info = models.TextField(blank=True, verbose_name="kpi info")

    target = models.DecimalField(
        max_digits=14, decimal_places=4, null=True, blank=True, verbose_name="target"
    )
    kpi_weight = models.DecimalField(
        max_digits=10, decimal_places=4, null=True, blank=True, verbose_name="KPI Weight"
    )
    kpi_achievement = models.DecimalField(
        max_digits=14, decimal_places=4, null=True, blank=True, verbose_name="KPI Achievement"
    )
    score_achievement = models.DecimalField(
        max_digits=14, decimal_places=4, null=True, blank=True, verbose_name="score Achievement"
    )
    score_achievement_alt = models.DecimalField(
        max_digits=14, decimal_places=4, null=True, blank=True, verbose_name="Score Achievement"
    )

    entry_type = models.CharField(max_length=100, blank=True, verbose_name="Type")
    sum_value = models.DecimalField(
        max_digits=14, decimal_places=4, null=True, blank=True, verbose_name="Sum"
    )

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "KPI Entry"
        verbose_name_plural = "KPI Entries"
        ordering = ["-row"]

    def __str__(self):
        return f"{self.row} - {self.company_name} - {self.full_name}"


class KPIPersonel(models.Model):
    full_name = models.CharField(max_length=200, blank=True, default="")
    personal_code = models.CharField(max_length=50, db_index=True)
    job_title = models.CharField(max_length=100, blank=True, default="")
    departman = models.CharField(max_length=200, blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "KPI Personel"
        verbose_name_plural = "KPI Personels"
        ordering = ["full_name"]

    def __str__(self):
        return f"{self.full_name} - {self.personal_code}"


class GroupQ2Entry(models.Model):
    row_index = models.IntegerField(null=True, blank=True)
    company_name = models.CharField(max_length=200, blank=True, default="")
    season = models.CharField(max_length=50, blank=True, default="")
    personal_code = models.CharField(max_length=50, blank=True, default="")
    full_name = models.CharField(max_length=200, blank=True, default="")
    job_title = models.CharField(max_length=100, blank=True, default="")
    direct_manager_code = models.CharField(max_length=50, blank=True, default="")
    manager_name = models.CharField(max_length=200, blank=True, default="")
    departman = models.CharField(max_length=200, blank=True, default="")
    category_fa = models.CharField(max_length=200, blank=True, default="")
    category_en = models.CharField(max_length=200, blank=True, default="")
    obj_weight = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    kpi_en = models.CharField(max_length=500, blank=True, default="")
    kpi_fa = models.CharField(max_length=500, blank=True, default="")
    kpi_info = models.TextField(blank=True, default="")
    target = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    kpi_weight = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    kpi_achievement = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    percentage_achievement = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    score_achievement = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    entry_type = models.CharField(max_length=100, blank=True, default="")
    sum_percent = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Group Q2 Entry"
        verbose_name_plural = "Group Q2 Entries"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.company_name} - {self.full_name} - {self.kpi_fa}"
