from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.models import Mahasiswa
from users.services.mahasiswa_service import create_mahasiswa

User = get_user_model()

class MahasiswaProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mahasiswa
        fields = ('id', 'nim', 'jurusan', 'universitas', 'semester')

class UserSerializer(serializers.ModelSerializer):
    mahasiswa_profile = MahasiswaProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'is_mahasiswa', 'is_premium', 'is_instructor', 'mahasiswa_profile')

    def get_full_name(self, obj):
        return obj.get_full_name()

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    nim = serializers.CharField(max_length=20)
    jurusan = serializers.CharField(max_length=100)
    universitas = serializers.CharField(max_length=150)
    first_name = serializers.CharField(max_length=150, required=False, default="")
    last_name = serializers.CharField(max_length=150, required=False, default="")

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username sudah digunakan.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email sudah digunakan.")
        return value

    def validate_nim(self, value):
        if Mahasiswa.objects.filter(nim=value).exists():
            raise serializers.ValidationError("NIM sudah terdaftar.")
        return value

    def create(self, validated_data):
        mahasiswa = create_mahasiswa(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email'],
            nim=validated_data['nim'],
            jurusan=validated_data['jurusan'],
            universitas=validated_data['universitas'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return mahasiswa.user
