from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

UserModel = get_user_model()


class CustomAuthBackend(ModelBackend):
    def authenticate(
        self, request, username=None, password=None, sections=None, **kwargs
    ):
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        if username is None or password is None:
            return None

        try:
            # Get all users with the given username
            users = UserModel.objects.filter(username=username)

            # If sections are provided, filter by sections
            if sections:
                users = users.filter(sections__name__in=sections).distinct()

            # Try authenticating each user
            for user in users:
                if user.check_password(password):
                    return user
            return None

        except UserModel.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return None
