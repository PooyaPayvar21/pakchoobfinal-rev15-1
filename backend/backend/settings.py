from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import os

load_dotenv()
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# # React Frontend Directory (update this if necessary)
REACT_APP_DIR = "/home/planning/public_html/"
# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-$d5noih4@jy3%ihlf7y)xa$%kk$4wyar9wg@5g9dcta-%x-t)y"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# UltraMsg Settings
APPEND_SLASH = False


ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "planningmaintenance.ir",
    "www.planningmaintenance.ir",
    ".planningmaintenance.ir",  # This will match both www and non-www
]

CSRF_TRUSTED_ORIGINS = [
    "https://planningmaintenance.ir",
    "https://www.planningmaintenance.ir",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:8080",
]

# CORS Settings
CORS_ALLOW_CREDENTIALS = True
# During local development it's convenient to allow all origins so the
# frontend (vite/dev server) can call the API without CORS issues.
# Change back to False in production and restrict origins accordingly.
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    "https://planningmaintenance.ir",
    "https://www.planningmaintenance.ir",
    "http://localhost:3001",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    "x-user-type",
    "x-user-role",
    "x-user-section",
    "x-user-phase",
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours

# REST Framework settings
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
    "EXCEPTION_HANDLER": "rest_framework.views.exception_handler",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
}

AUTH_USER_MODEL = "api.loginuser"
AUTHENTICATION_BACKENDS = [
    "api.auth_backend.CustomAuthBackend",
    "django.contrib.auth.backends.ModelBackend",
]

# Application definition
INSTALLED_APPS = [
    "jazzmin",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "api",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "channels",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

# Database
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "fa-ir"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "static/"
STATIC_ROOT = os.path.join("/home/planning/public_html/static")

# Add React template directory
TEMPLATES[0]["DIRS"] = [os.path.join(REACT_APP_DIR)]

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CSRF settings
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False  # Must be False to allow JavaScript to read the cookie
CSRF_COOKIE_SAMESITE = "Lax"

# Exempt certain URLs from CSRF protection
CSRF_EXEMPT_URLS = [
    r"^api/login/$",
    r"^api/register/$",
]

# Channels
ASGI_APPLICATION = "backend.asgi.application"
CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}

# Django Cron Settings
CRON_CLASSES = [
    "api.cron.SendRemindersCronJob",
]
