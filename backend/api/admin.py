from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django import forms
from .models import (
    LoginUser,
    SubmitForm,
    TechnicianSubmit,
    Personel,
    Aghlam,
    Section,
    PmForms,
    PmAghlam,
    PmTechnician,
    PmPersonel,
    KPIEntry,
)


# Register your models here.
class SectionMultipleChoiceField(forms.MultipleChoiceField):
    def prepare_value(self, value):
        if isinstance(value, list):
            return value
        return []


class LoginUserCreationForm(UserCreationForm):
    sections = SectionMultipleChoiceField(
        choices=LoginUser.SECTION_CHOICES, widget=forms.SelectMultiple, required=False
    )
    additional_roles = SectionMultipleChoiceField(
        choices=LoginUser.ADDITIONAL_ROLE_CHOICES,
        widget=forms.SelectMultiple,
        required=False,
    )

    class Meta(UserCreationForm.Meta):
        model = LoginUser
        fields = ("username", "user_type", "role", "sections", "additional_roles")


class LoginUserChangeForm(UserChangeForm):
    sections = SectionMultipleChoiceField(
        choices=LoginUser.SECTION_CHOICES, widget=forms.SelectMultiple, required=False
    )
    additional_roles = SectionMultipleChoiceField(
        choices=LoginUser.ADDITIONAL_ROLE_CHOICES,
        widget=forms.SelectMultiple,
        required=False,
    )

    class Meta(UserChangeForm.Meta):
        model = LoginUser
        fields = "__all__"


class LoginUserAdmin(UserAdmin):
    form = LoginUserChangeForm
    add_form = LoginUserCreationForm

    list_display = ("username", "user_type", "role", "sections", "additional_roles")
    list_editable = ("user_type", "role", "sections", "additional_roles")
    list_filter = (
        "user_type",
        "role",
    )
    search_fields = ("username", "email")

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "email")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
        (
            "Custom fields",
            {"fields": ("user_type", "role", "sections", "additional_roles")},
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "password1",
                    "password2",
                    "user_type",
                    "role",
                    "sections",
                    "additional_roles",
                ),
            },
        ),
    )

    def get_sections(self, obj):
        return ", ".join(obj.sections) if obj.sections else "-"

    get_sections.short_description = "Sections"

    def get_additional_roles(self, obj):
        return ", ".join(obj.additional_roles) if obj.additional_roles else "-"

    get_additional_roles.short_description = "Additional Roles"


class AdminSubmitForm(admin.ModelAdmin):
    list_display = [
        "id",
        "formcode",
        "problemdate",
        "phase",
        "productionstop",
        "section",
        'worktype',
        "machinename",
        "machinecode",
        "machineplacecode",
        "stoptime",
        "stoptype",
        "endtime",
        "failuretimesubmit",
        "shift",
        "suggesttime",
        "worksuggest",
        "fixrepair",
        "reportinspection",
        "faultdm",
        "operatorname",
        "problemdescription",
        "formtype",
        "formnote",

    ]
    search_fields = ["formcode", "machinename", "operatorname"]
    list_filter = ["phase", "shift", "productionstop"]
    list_editable = ["formtype"]


class AdminTechnicianForm(admin.ModelAdmin):
    list_display = [
        "formcode",
        "failurepart",
        "failuretime",
        "sparetime",
        "wastedtime",
        "startfailuretime",
        "problemdescription",
        "jobstatus",
    ]
    search_fields = ["formcode", "failurepart"]
    list_filter = ["jobstatus"]


class AdminAghlam(admin.ModelAdmin):
    list_display = [
        "formcode",
        "kalaname",
        "countkala",
        "vahedkala",
        "codekala",
        "flamekala",
    ]
    search_fields = ["formcode", "kalaname", "codekala"]
    list_filter = ["flamekala"]


class AdminPersonel(admin.ModelAdmin):
    list_display = [
        "formcode",
        "personel",
        "personelnumber",
        "specialjob",
        "starttimerepair",
        "endtimerepair",
        "personel2",
        "personelnumber2",
        "specialjob2",
        "starttimerepair2",
        "endtimerepair2",
        "personel3",
        "personelnumber3",
        "specialjob3",
        "starttimerepair3",
        "endtimerepair3",
        "personel4",
        "personelnumber4",
        "specialjob4",
        "starttimerepair4",
        "endtimerepair4",
        "personel5",
        "personelnumber5",
        "specialjob5",
        "starttimerepair5",
        "endtimerepair5",
        "personel6",
        "personelnumber6",
        "specialjob6",
        "starttimerepair6",
        "endtimerepair6",
        "personel7",
        "personelnumber7",
        "specialjob7",
        "starttimerepair7",
        "endtimerepair7",
        "personel8",
        "personelnumber8",
        "specialjob8",
        "starttimerepair8",
        "endtimerepair8",
        "repairstatus",
        "unitrepair",
        "shift",
        "delayreason",
        "failurereason",
        "failurereasondescription",
        "suggestionfailure",
    ]
    search_fields = ["formcode", "personel", "personelnumber"]
    list_filter = ["specialjob", "unitrepair", "shift", "repairstatus"]

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "formcode",
                    "submit_form",
                    "repairstatus",
                    "unitrepair",
                    "shift",
                )
            },
        ),
        (
            "Personnel 1",
            {
                "fields": (
                    "personel",
                    "personelnumber",
                    "specialjob",
                    "starttimerepair",
                    "endtimerepair",
                )
            },
        ),
        (
            "Personnel 2",
            {
                "fields": (
                    "personel2",
                    "personelnumber2",
                    "specialjob2",
                    "starttimerepair2",
                    "endtimerepair2",
                )
            },
        ),
        (
            "Personnel 3",
            {
                "fields": (
                    "personel3",
                    "personelnumber3",
                    "specialjob3",
                    "starttimerepair3",
                    "endtimerepair3",
                )
            },
        ),
        (
            "Personnel 4",
            {
                "fields": (
                    "personel4",
                    "personelnumber4",
                    "specialjob4",
                    "starttimerepair4",
                    "endtimerepair4",
                )
            },
        ),
        (
            "Personnel 5",
            {
                "fields": (
                    "personel5",
                    "personelnumber5",
                    "specialjob5",
                    "starttimerepair5",
                    "endtimerepair5",
                )
            },
        ),
        (
            "Personnel 6",
            {
                "fields": (
                    "personel6",
                    "personelnumber6",
                    "specialjob6",
                    "starttimerepair6",
                    "endtimerepair6",
                )
            },
        ),
        (
            "Personnel 7",
            {
                "fields": (
                    "personel7",
                    "personelnumber7",
                    "specialjob7",
                    "starttimerepair7",
                    "endtimerepair7",
                )
            },
        ),
        (
            "Personnel 8",
            {
                "fields": (
                    "personel8",
                    "personelnumber8",
                    "specialjob8",
                    "starttimerepair8",
                    "endtimerepair8",
                )
            },
        ),
        (
            "Additional Information",
            {
                "fields": (
                    "delayreason",
                    "failurereason",
                    "failurereasondescription",
                    "suggestionfailure",
                )
            },
        ),
    )


class SectionAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]


class AdminPmForms(admin.ModelAdmin):
    list_display = [
        "pmformcode",
        "pmformdate",
        "pmphase",
        "unitname",
        "pmworktype",
        "pmsection",
        "pmmachinename",
        "pmsubject",
        "pmstatus",
        'pmformnote',
        "assigned_department",
    ]
    search_fields = ["pmformcode", "pmmachinename", "unitname", "pmsubject"]
    list_filter = [
        "pmphase",
        "pmworktype",
        "pmsection",
        "pmstatus",
        "assigned_department",
    ]


class AdminPmAghlam(admin.ModelAdmin):
    list_display = [
        "pmformcode",
        "kalaname",
        "countkala",
        "vahedkala",
        "codekala",
    ]
    search_fields = ["pmformcode", "kalaname", "codekala"]
    list_filter = ["codekala"]


class AdminPmTechnician(admin.ModelAdmin):
    list_display = [
        "pmformcode",
        "pmfailurereason",
        "pmworktype",
        "pmproblemdescription",
        "startpmrepairtime",
        "endpmrepairtime",
        "worktime",
        "notdonereason",
    ]
    search_fields = ["pmformcode", "pmfailurereason", "pmworktype"]
    list_filter = ["pmworktype", "notdonereason"]


class AdminPmPersonel(admin.ModelAdmin):
    list_display = [
        "pmformcode",
        "personel",
        "personelnumber",
        "specialjob",
        "starttimerepair",
        "endtimerepair",
        "personel2",
        "personelnumber2",
        "specialjob2",
        "starttimerepair2",
        "endtimerepair2",
        "personel3",
        "personelnumber3",
        "specialjob3",
        "starttimerepair3",
        "endtimerepair3",
        "personel4",
        "personelnumber4",
        "specialjob4",
        "starttimerepair4",
        "endtimerepair4",
        "personel5",
        "personelnumber5",
        "specialjob5",
        "starttimerepair5",
        "endtimerepair5",
        "personel6",
        "personelnumber6",
        "specialjob6",
        "starttimerepair6",
        "endtimerepair6",
        "personel7",
        "personelnumber7",
        "specialjob7",
        "starttimerepair7",
        "endtimerepair7",
        "personel8",
        "personelnumber8",
        "specialjob8",
        "starttimerepair8",
        "endtimerepair8",
        "unitrepair",
        "shift",
    ]
    search_fields = ["pmformcode", "personel", "personelnumber"]
    list_filter = ["specialjob", "unitrepair", "shift"]

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "pmformcode",
                    "submit_form",
                    "unitrepair",
                    "shift",
                )
            },
        ),
        (
            "Personnel 1",
            {
                "fields": (
                    "personel",
                    "personelnumber",
                    "specialjob",
                    "starttimerepair",
                    "endtimerepair",
                )
            },
        ),
        (
            "Personnel 2",
            {
                "fields": (
                    "personel2",
                    "personelnumber2",
                    "specialjob2",
                    "starttimerepair2",
                    "endtimerepair2",
                )
            },
        ),
        (
            "Personnel 3",
            {
                "fields": (
                    "personel3",
                    "personelnumber3",
                    "specialjob3",
                    "starttimerepair3",
                    "endtimerepair3",
                )
            },
        ),
        (
            "Personnel 4",
            {
                "fields": (
                    "personel4",
                    "personelnumber4",
                    "specialjob4",
                    "starttimerepair4",
                    "endtimerepair4",
                )
            },
        ),
        (
            "Personnel 5",
            {
                "fields": (
                    "personel5",
                    "personelnumber5",
                    "specialjob5",
                    "starttimerepair5",
                    "endtimerepair5",
                )
            },
        ),
        (
            "Personnel 6",
            {
                "fields": (
                    "personel6",
                    "personelnumber6",
                    "specialjob6",
                    "starttimerepair6",
                    "endtimerepair6",
                )
            },
        ),
        (
            "Personnel 7",
            {
                "fields": (
                    "personel7",
                    "personelnumber7",
                    "specialjob7",
                    "starttimerepair7",
                    "endtimerepair7",
                )
            },
        ),
        (
            "Personnel 8",
            {
                "fields": (
                    "personel8",
                    "personelnumber8",
                    "specialjob8",
                    "starttimerepair8",
                    "endtimerepair8",
                )
            },
        ),
        (
            "Additional Information",
            {
                "fields": (
                    "delayreason",
                    "failurereason",
                    "failurereasondescription",
                    "suggestionfailure",
                )
            },
        ),
    )


admin.site.register(LoginUser, LoginUserAdmin)
admin.site.register(Aghlam, AdminAghlam)
admin.site.register(SubmitForm, AdminSubmitForm)
admin.site.register(TechnicianSubmit, AdminTechnicianForm)
admin.site.register(Personel, AdminPersonel)
admin.site.register(Section, SectionAdmin)
admin.site.register(PmForms, AdminPmForms)
admin.site.register(PmAghlam, AdminPmAghlam)
admin.site.register(PmTechnician, AdminPmTechnician)
admin.site.register(PmPersonel, AdminPmPersonel)


class AdminKPIEntry(admin.ModelAdmin):
    list_display = (
        "row",
        "company_name",
        "season",
        "personal_code",
        "full_name",
        "role",
        "departman",
        "category",
        "obj_weight",
        "kpi_en",
        "kpi_fa",
        "target",
        "kpi_weight",
        "kpi_achievement",
        "score_achievement",
        "sum_value",
    )
    search_fields = ("company_name", "personal_code", "full_name", "kpi_en", "kpi_fa")


admin.site.register(KPIEntry, AdminKPIEntry)
