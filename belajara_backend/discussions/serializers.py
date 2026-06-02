from rest_framework import serializers
from discussions.models import DiscussionPost
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSimpleSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'full_name', 'is_mahasiswa')

    def get_full_name(self, obj):
        return obj.get_full_name()

class DiscussionPostSerializer(serializers.ModelSerializer):
    user = UserSimpleSerializer(read_only=True)
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionPost
        fields = ('id', 'course', 'user', 'content', 'parent', 'created_at', 'replies_count')
        read_only_fields = ('user', 'created_at', 'parent', 'course')

    def get_replies_count(self, obj):
        return obj.replies.count()
