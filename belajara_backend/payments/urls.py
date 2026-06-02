from django.urls import path
from payments.views import CheckoutView, MidtransWebhookView

urlpatterns = [
    path('payments/checkout/', CheckoutView.as_view(), name='payment_checkout'),
    path('payments/webhook/', MidtransWebhookView.as_view(), name='payment_webhook'),
]
