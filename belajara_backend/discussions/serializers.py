from rest_framework import serializers
from discussions.models import DiscussionPost
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSimpleSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'full_name', 'is_mahasiswa', 'is_premium')

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
        if hasattr(obj, 'replies_count_annotated'):
            return obj.replies_count_annotated
        return getattr(obj, 'replies_count', None) if getattr(obj, 'replies_count', None) is not None else obj.replies.count()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        user_data = data.get('user', {})
        if user_data:
            role = "Dosen Pengampu" if not user_data.get('is_mahasiswa', True) else "Mahasiswa"
            avatar = user_data.get('username', 'M')[:2].upper()
            data['author'] = {
                'id': user_data.get('id'),
                'name': user_data.get('full_name') or user_data.get('username'),
                'role': role,
                'avatar': avatar,
                'is_premium': user_data.get('is_premium', False)
            }
        else:
            data['author'] = {
                'id': None,
                'name': "Guest User",
                'role': "Mahasiswa",
                'avatar': "G",
                'is_premium': False
            }
        return data
