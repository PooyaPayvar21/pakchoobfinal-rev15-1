from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import (
    SubmitForm,
    TechnicianSubmit,
    Personel,
    Aghlam,
    LoginUser,
    Section,
    PmForms,
    PmTechnician,
    PmPersonel,
    PmAghlam,
    Reminder,
    WaterTreatment,
    SubmitPM,
    KPIWork,
    KPIWorkResponse
)
from .models import KPIEntry
from .models import Notification


class KPIWorkSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.username', read_only=True)
    person_id = serializers.IntegerField(source='person.id', read_only=True)
    
    class Meta:
        model = KPIWork
        fields = [
            'id',
            'facility',
            'section',
            'role',
            'person',
            'person_id',
            'person_name',
            'task_name',
            'description',
            'status',
            'percentage',
            'due_date',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ('created_at', 'updated_at')
    
    def validate_percentage(self, value):
        """Ensure percentage is between 0 and 100"""
        if not 0 <= value <= 100:
            raise serializers.ValidationError("Percentage must be between 0 and 100")
        return value
User = get_user_model()


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ["id", "name"]


class UserSerializer(serializers.ModelSerializer):
    sections = serializers.SerializerMethodField()

    def get_sections(self, obj):
        if hasattr(obj, "sections"):
            if isinstance(obj.sections, list):
                return obj.sections
            return []
        return []

    class Meta:
        model = LoginUser
        fields = ["id", "username", "email", "user_type", "role", "sections"]


class LoginUserSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = LoginUser
        fields = ["id", "username", "email", "user_type", "role", "sections"]


class TechnicianSubmitSerializer(serializers.ModelSerializer):

    class Meta:
        model = TechnicianSubmit
        fields = "__all__"


class PersonelSerializer(serializers.ModelSerializer):

    class Meta:
        model = Personel
        fields = "__all__"


class AghlamSerializer(serializers.ModelSerializer):

    class Meta:
        model = Aghlam
        fields = "__all__"


class SubmitFormSerializer(serializers.ModelSerializer):
    technician_submit = TechnicianSubmitSerializer(many=True, read_only=True)
    aghlam = AghlamSerializer(many=True, read_only=True)
    personel = PersonelSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    current_assignee = UserSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = SubmitForm
        fields = "__all__"
        read_only_fields = ("created_by", "current_assignee", "formcode")


class PmFormsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PmForms
        fields = "__all__"


class PmTechnicianSerializer(serializers.ModelSerializer):
    class Meta:
        model = PmTechnician
        fields = "__all__"


class PmPersonelSerializer(serializers.ModelSerializer):
    class Meta:
        model = PmPersonel
        fields = "__all__"


class PmAghlamSerializer(serializers.ModelSerializer):
    class Meta:
        model = PmAghlam
        fields = "__all__"


class ReminderSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Reminder
        fields = "__all__"
        read_only_fields = ("created_by", "is_sent", "created_at", "updated_at")

class WaterTreatmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterTreatment
        fields = "__all__"

class SubmitPMSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    current_assignee = UserSerializer(read_only=True)
    pmsubmitdate = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = SubmitPM
    class Meta:
        model = SubmitPM
        fields = [
            "id",
             "pmsubmitdate",
             "pmserial",
             "pmworktype",
             "pmsection",
             "pmsubject",
             "pmstatus",
             "created_by",
             "current_assignee",
             "created_at",
             "updated_at",
         ]
        read_only_fields = ("created_by", "current_assignee", "created_at", "updated_at")
        def get_created_by(self, obj):
            if obj.created_by:
                return {"id": obj.created_by.id, "username": obj.created_by.username}
            return None


class KPIWorkResponseSerializer(serializers.ModelSerializer):
    respondent_name = serializers.CharField(source='respondent.username', read_only=True)
    respondent_id = serializers.IntegerField(source='respondent.id', read_only=True)
    kpi_work_details = KPIWorkSerializer(source='kpi_work', read_only=True)
    
    class Meta:
        model = KPIWorkResponse
        fields = [
            'id',
            'kpi_work',
            'kpi_work_details',
            'respondent',
            'respondent_id',
            'respondent_name',
            'response_text',
            'completion_notes',
            'attachments',
            'status',
            'submitted_at',
            'updated_at',
        ]
        read_only_fields = ('submitted_at', 'updated_at')


class KPIEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = KPIEntry
        fields = [
            "row",
            "company_name",
            "season",
            "personal_code",
            "full_name",
            "role",
            "direct_management",
            "departman",
            "category",
            "obj_weight",
            "kpi_en",
            "kpi_fa",
            "kpi_info",
            "target",
            "kpi_weight",
            "kpi_achievement",
            "score_achievement",
            "score_achievement_alt",
            "entry_type",
            "sum_value",
            "created_at",
            "updated_at",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "personal_code",
            "title",
            "message",
            "type",
            "read",
            "created_at",
        ]
