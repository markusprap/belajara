from rest_framework import serializers

from payments.models import Subscription, Transaction


# ---------------------------------------------------------------------------
# Checkout & Course Purchase
# ---------------------------------------------------------------------------

class CheckoutSerializer(serializers.Serializer):
    """Validates the payload for initiating a per-course checkout."""
    course_id = serializers.IntegerField(min_value=1)


class TransactionSerializer(serializers.ModelSerializer):
    """Serializes a Transaction record for API responses."""
    course_title = serializers.CharField(source="course.title", read_only=True, default=None)
    transaction_type_display = serializers.CharField(
        source="get_transaction_type_display", read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )

    class Meta:
        model = Transaction
        fields = (
            "id",
            "order_id",
            "course",
            "course_title",
            "instructor",
            "transaction_type",
            "transaction_type_display",
            "amount",
            "snap_token",
            "snap_url",
            "status",
            "status_display",
            "created_at",
        )
        read_only_fields = (
            "order_id", "amount", "snap_token", "snap_url",
            "status", "created_at",
        )


# ---------------------------------------------------------------------------
# Subscription
# ---------------------------------------------------------------------------

class SubscribeSerializer(serializers.Serializer):
    """Validates the payload for initiating a subscription."""
    TIER_CHOICES = ["scholar", "pro"]
    tier = serializers.ChoiceField(choices=TIER_CHOICES)


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializes a Subscription record."""
    tier_display = serializers.CharField(source="get_tier_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    monthly_price = serializers.IntegerField(read_only=True)
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = (
            "id",
            "tier",
            "tier_display",
            "status",
            "status_display",
            "is_active",
            "monthly_price",
            "current_period_start",
            "current_period_end",
            "days_remaining",
            "created_at",
            "cancelled_at",
        )
        read_only_fields = ("__all__",)

    def get_days_remaining(self, obj):
        from django.utils import timezone
        if obj.current_period_end > timezone.now():
            delta = obj.current_period_end - timezone.now()
            return max(0, delta.days)
        return 0
