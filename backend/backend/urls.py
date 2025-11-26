from django.contrib import admin
from django.urls import path, include
from api.views import register_view, login_view
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    # These endpoints are now included in api.urls
    # path("api/login/", login_view, name="login"),
    # path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    # path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    # path("api/register/", register_view, name="register"),
]
