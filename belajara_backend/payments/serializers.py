from rest_framework import serializers
from payments.models import Transaction

class CheckoutSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()

class TransactionSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Transaction
        fields = ('id', 'order_id', 'course', 'course_title', 'amount', 'snap_token', 'snap_url', 'status', 'created_at')
        read_only_fields = ('order_id', 'amount', 'snap_token', 'snap_url', 'status', 'created_at')
