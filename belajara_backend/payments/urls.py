from django.urls import path

from payments.views import (
    CancelSubscriptionView,
    CheckoutView,
    MidtransWebhookView,
    MySubscriptionView,
    SubscribeView,
    UserTransactionsView,
    CancelTransactionView,
)

urlpatterns = [
    # Per-course purchase
    path("payments/checkout/", CheckoutView.as_view(), name="payment_checkout"),

    # Subscription management
    path("payments/subscribe/", SubscribeView.as_view(), name="payment_subscribe"),
    path("payments/my-subscription/", MySubscriptionView.as_view(), name="payment_my_subscription"),
    path("payments/cancel-subscription/", CancelSubscriptionView.as_view(), name="payment_cancel_subscription"),
    path("payments/cancel-transaction/", CancelTransactionView.as_view(), name="payment_cancel_transaction"),
    path("payments/transactions/", UserTransactionsView.as_view(), name="payment_transactions"),

    # Midtrans notification webhook (no auth — Midtrans calls this)
    path("payments/webhook/", MidtransWebhookView.as_view(), name="payment_webhook"),
]
