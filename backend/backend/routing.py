from django.urls import re_path
from api.consumers import NotificationConsumer, TestConsumer

websocket_urlpatterns = [
    re_path(r"ws/notifications/$", NotificationConsumer.as_asgi()),
    re_path(r"ws/test/$", TestConsumer.as_asgi()),
] 