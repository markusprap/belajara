from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.models import Mahasiswa, InstructorProfile
from users.services.mahasiswa_service import create_mahasiswa
from users.services.instructor_service import create_instructor

User = get_user_model()

class MahasiswaProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mahasiswa
        fields = ('id', 'nim', 'jurusan', 'universitas', 'semester')

class InstructorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstructorProfile
        fields = ('id', 'nidn', 'bidang_keahlian', 'universitas')

class UserSerializer(serializers.ModelSerializer):
    mahasiswa_profile = MahasiswaProfileSerializer(read_only=True)
    instructor_profile = InstructorProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'is_mahasiswa', 'is_premium', 'is_instructor', 
            'mahasiswa_profile', 'instructor_profile'
        )

    def get_full_name(self, obj):
        return obj.get_full_name()

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    role = serializers.CharField(max_length=20, required=False, default="student")
    
    # Student fields
    nim = serializers.CharField(max_length=20, required=False, allow_blank=True)
    jurusan = serializers.CharField(max_length=100, required=False, allow_blank=True)
    semester = serializers.IntegerField(required=False, default=1)
    
    # Instructor fields
    nidn = serializers.CharField(max_length=20, required=False, allow_blank=True)
    bidang_keahlian = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    # Common profile fields
    universitas = serializers.CharField(max_length=150, required=False, allow_blank=True)
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

    def validate(self, attrs):
        role = attrs.get('role', 'student')
        if role == 'student':
            nim = attrs.get('nim')
            if not nim:
                raise serializers.ValidationError({"nim": "NIM wajib diisi untuk mahasiswa."})
            if Mahasiswa.objects.filter(nim=nim).exists():
                raise serializers.ValidationError({"nim": "NIM sudah terdaftar."})
        elif role == 'instructor':
            nidn = attrs.get('nidn')
            if not nidn:
                raise serializers.ValidationError({"nidn": "NIDN wajib diisi untuk instruktur."})
            if InstructorProfile.objects.filter(nidn=nidn).exists():
                raise serializers.ValidationError({"nidn": "NIDN sudah terdaftar."})
        else:
            raise serializers.ValidationError({"role": "Role tidak valid."})
        return attrs

    def create(self, validated_data):
        role = validated_data.get('role', 'student')
        if role == 'student':
            mahasiswa = create_mahasiswa(
                username=validated_data['username'],
                password=validated_data['password'],
                email=validated_data['email'],
                nim=validated_data.get('nim', ''),
                jurusan=validated_data.get('jurusan', 'Informatika'),
                universitas=validated_data.get('universitas', 'Universitas Indonesia'),
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', '')
            )
            # update default semester
            mahasiswa.semester = validated_data.get('semester', 1)
            mahasiswa.save()
            return mahasiswa.user
        else:
            instructor = create_instructor(
                username=validated_data['username'],
                password=validated_data['password'],
                email=validated_data['email'],
                nidn=validated_data.get('nidn', ''),
                bidang_keahlian=validated_data.get('bidang_keahlian', ''),
                universitas=validated_data.get('universitas', 'Universitas Indonesia'),
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', '')
            )
            return instructor.user

