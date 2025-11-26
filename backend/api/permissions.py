from rest_framework import permissions


class IsProductionOperator(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.user_type == "production"
            and request.user.role == "operator"
        )


class IsTechnician(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "technician"


class IsManagement(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "management"


class IsPm(permissions.BasePermission):
    def has_permission(self, request, view):
        # Check if user is authenticated and has user_type "pm"
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "user_type")
            and request.user.user_type == "pm"
        )


class CanUpdateForm(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        action = request.data.get("action")

        print(f"=== Permission Check Debug ===")
        print(f"User: {user.username}")
        print(f"User Type: {user.user_type}")
        print(f"User Role: {user.role}")
        print(f"Action: {action}")
        print(f"Form Status: {obj.status}")
        print("=============================")

        # Production operator permissions
        if user.user_type == "production" and user.role == "operator":
            # Allow updating endtime when status is management_approved
            if action == "update_endtime" and obj.status == "management_approved":
                print("Permission granted: Production operator updating endtime")
                return True
            # Allow other updates when status is pending_production
            print(f"Permission denied: Form status is {obj.status}, expected management_approved")
            return obj.status == "pending_production"

        # Technician can only update when status is pending_technician
        if user.role == "technician":
            return obj.status == "pending_technician" and obj.worktype == user.user_type

        # Management can only update when status is pending_management
        if user.role == "management":
            return obj.status == "pending_management" and obj.worktype == user.user_type

        # PM can update when status is pending_pm
        if user.user_type == "pm":
            return obj.status == "pending_pm"

        print("Permission denied: User does not have required role/type")
        return False
