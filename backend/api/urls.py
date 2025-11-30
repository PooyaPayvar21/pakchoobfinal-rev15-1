from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    delete_pm_form,
    discard_pm_form_status,
    edit_pm_form,
    get_pm_form_permissions,
    login_view,
    register_view,
    FormListCreate,
    FormDelete,
    SubmitFormListView,
    SendDataView,
    TechnicianFormSubmit,
    SubmitFormDetailView,
    SubmitFormDetailByCodeView,
    TechnicianFormListView,
    AghlamSubmit,
    AghlamsFormListView,
    PersonelSubmit,
    PersonelsFormListView,
    update_form_type,
    SubmitFormViewSet,
    get_forms_by_role,
    update_form_status,
    get_user_info,
    change_password_view,
    get_form_permissions,
    update_endtime,
    get_unread_forms_count,
    update_user_additional_roles,
    PmFormCreate,
    PmFormsListView,
    update_pm_form_status,
    discard_form_status,
    PmTechnicianSubmit,
    PmTechnicianSubmitList,
    PmTechnicianSubmitDetail,
    PmFormDetail,
    PmAghlamSubmit,
    PmPersonelSubmit,
    send_sms,
    ReminderViewSet,
    send_reminder_sms,
    WaterTreatmentSubmit,
    SubmitPMCreate,
    SubmitPMDetail,
    get_kpi_facilities,
    get_kpi_sections,
    get_kpi_roles,
    get_kpi_people_by_role,
    submit_kpi_work,
    submit_kpientry,
    get_kpi_work_history,
    get_kpi_metrics,
    get_assigned_kpi_works,
    submit_kpi_work_response,
    get_work_responses,
    update_kpi_work_status,
    kpientry_options,
    kpientry_update_management,
    kpientry_subordinates,
    kpientry_update_row,
    kpientry_delete_row,
    kpientry_confirm_row,
    kpientry_grant_edit,
    kpientry_revoke_edit,
    notifications_list,
    send_notification,
)
# Create a router for ViewSets
router = DefaultRouter()
router.register(r"forms", SubmitFormViewSet, basename="forms")
router.register(r"reminders", ReminderViewSet, basename="reminders")

urlpatterns = [
    # Custom form endpoints (these should come before the router)
    path("forms/unread/", get_unread_forms_count, name="get-unread-forms-count"),
    path("forms/by-role/", get_forms_by_role, name="forms-by-role"),
    path("forms/<str:formcode>/type/", update_form_type, name="update-form-type"),
    path("forms/<str:formcode>/status/", update_form_status, name="update-form-status"),
    path(
        "forms/<str:formcode>/permissions/",
        get_form_permissions,
        name="form-permissions",
    ),
    path("forms/<str:formcode>/endtime/", update_endtime, name="update-endtime"),
    # Include router URLs (these should come after custom endpoints)
    path("", include(router.urls)),
    # Auth endpoints
    path("login/", login_view, name="login"),
    path("register/", register_view, name="register"),
    path("user/info/", get_user_info, name="user-info"),
    path("user/change-password/", change_password_view, name="change-password"),
    path(
        "user/update-additional-roles/",
        update_user_additional_roles,
        name="update-user-additional-roles",
    ),
    path("token/", TokenObtainPairView.as_view(), name="get_token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    # Technician endpoints
    path("techniciansubmit/", TechnicianFormSubmit, name="techniciansubmit"),
    path(
        "techniciansubmit/list/",
        TechnicianFormListView.as_view(),
        name="techniciansubmit-list",
    ),
    # Parts (Aghlam) endpoints
    path("aghlam/", AghlamSubmit, name="aghlam"),
    path("aghlam/list/", AghlamsFormListView.as_view(), name="aghlam-list"),
    # Personnel endpoints
    path("personel/", PersonelSubmit, name="personel"),
    path("personel/list/", PersonelsFormListView.as_view(), name="personel-list"),
    # SMS endpoint
    path("send-sms/", send_sms, name="send-sms"),
    # Form endpoints
    path(
        "submitform/<str:formcode>/discard/",
        discard_form_status,
        name="discard_form_status",
    ),
    path("submitpm/", SubmitPMCreate, name="submitpm-create-list"),
    path("submitpm/<str:pmserial>/", SubmitPMDetail, name="submitpm-detail"),
    path("submitform/", FormListCreate, name="submitform"),
    path("submitform/list/", SubmitFormListView.as_view(), name="submitform-list"),
    path(
        "submitform/<str:formcode>/",
        SubmitFormDetailByCodeView.as_view(),
        name="submitform-detail-by-code",
    ),
    path(
        "submitform/detail/<int:pk>/",
        SubmitFormDetailView.as_view(),
        name="submitform-detail",
    ),
    path(
        "submitform/delete/<int:pk>/", FormDelete.as_view(), name="delete_submit_form"
    ),
    path("forms/send", SendDataView.as_view(), name="send_data"),
    # Pm Forms Submit
    path(
        "pmforms/<str:pmformcode>/permissions/",
        get_pm_form_permissions,
        name="form-permissions",
    ),
    path("pmformssubmit/", PmFormCreate, name="pmformssubmit"),
    path("pmformssubmit/list/", PmFormsListView.as_view(), name="pmforms-list"),
    path(
        "pmformssubmit/<str:pmformcode>/", PmFormDetail.as_view(), name="pmform-detail"
    ),
    path(
        "pmformssubmit/<str:pmformcode>/status/",
        update_pm_form_status,
        name="pm-form-status-update",
    ),
    path(
        "pmformssubmit/<str:pmformcode>/delete/",
        delete_pm_form,
        name="delete_pm_form",
    ),
    path("pmtechniciansubmit/", PmTechnicianSubmit, name="pmtechniciansubmit"),
    path(
        "pmtechniciansubmit/list/",
        PmTechnicianSubmitList.as_view(),
        name="pmtechniciansubmit-list",
    ),
    path(
        "pmtechniciansubmit/<str:pmformcode>/",
        PmTechnicianSubmitDetail.as_view(),
        name="pmtechniciansubmit-detail",
    ),
    path("pmaghlam/", PmAghlamSubmit, name="pmaghlam"),
    path("pmpersonel/", PmPersonelSubmit, name="pmpersonel"),
    path(
        "pmformssubmit/<str:pmformcode>/discard/",
        discard_pm_form_status,
        name="discard_pm_form_status",
    ),
    path("pmformssubmit/<str:pmformcode>/edit/", edit_pm_form, name="edit_pm_form"),
    # Reminder endpoints
    path("reminders/send-sms/", send_reminder_sms, name="send-reminder-sms"),
    path(
        "reminders/",
        ReminderViewSet.as_view({"get": "list", "post": "create"}),
        name="reminders",
    ),
    path(
        "reminders/<int:pk>/",
        ReminderViewSet.as_view(
            {
                "get": "retrieve",
                "put": "update",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="reminder-detail",
    ),
    path("watertreatment/", WaterTreatmentSubmit, name="watertreatment"),

    # KPI endpoints
    path("kpi/facilities/", get_kpi_facilities, name="kpi-facilities"),
    path("kpi/sections/", get_kpi_sections, name="kpi-sections"),
    path("kpi/roles/", get_kpi_roles, name="kpi-roles"),
    path("kpi/people/", get_kpi_people_by_role, name="kpi-people"),
    path("kpi/work/", submit_kpi_work, name="kpi-work-submit"),
    path("kpientry/create/", submit_kpientry, name="kpientry-create"),
    path("kpientry/options/", kpientry_options, name="kpientry-options"),
    path("kpientry/update-management/", kpientry_update_management, name="kpientry-update-management"),
    path("kpientry/subordinates/", kpientry_subordinates, name="kpientry-subordinates"),
    path("kpientry/row/<int:row>/", kpientry_update_row, name="kpientry-update-row"),
    path("kpientry/row/<int:row>/delete/", kpientry_delete_row, name="kpientry-delete-row"),
    path("kpientry/row/<int:row>/confirm/", kpientry_confirm_row, name="kpientry-confirm-row"),
    path("kpientry/grant-edit/", kpientry_grant_edit, name="kpientry-grant-edit"),
    path("kpientry/revoke-edit/", kpientry_revoke_edit, name="kpientry-revoke-edit"),
    path("kpi/work/<int:person_id>/", get_kpi_work_history, name="kpi-work-history"),
    path("kpi/work/<int:kpi_work_id>/status/", update_kpi_work_status, name="kpi-work-update-status"),
    path("kpi/metrics/", get_kpi_metrics, name="kpi-metrics"),
    path("kpi/assigned/", get_assigned_kpi_works, name="kpi-assigned-works"),
    path("kpi/response/", submit_kpi_work_response, name="kpi-submit-response"),
    path("kpi/response/<int:kpi_work_id>/", get_work_responses, name="kpi-work-responses"),
    # Notifications
    path("notifications/", notifications_list, name="notifications-list"),
    path("notifications/send/", send_notification, name="notifications-send"),
]
