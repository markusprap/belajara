from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from users.serializers import RegisterSerializer, UserSerializer
from .services.dashboard_service import get_student_dashboard_data

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            user_data = UserSerializer(user).data
            return Response({
                "message": "Registrasi berhasil.",
                "user": user_data,
                "tokens": tokens
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        from users.models import Mahasiswa, InstructorProfile
        
        user = request.user
        data = request.data
        
        # Update user fields
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        
        # Support setting/switching role during onboarding
        role = data.get('role')
        if role:
            if role in ['student', 'mahasiswa']:
                user.is_mahasiswa = True
                user.is_instructor = False
            elif role in ['instructor', 'dosen']:
                user.is_instructor = True
                user.is_mahasiswa = False
        user.save()
        
        if user.is_mahasiswa:
            profile_data = data.get('mahasiswa_profile', {}) or data
            try:
                profile = user.mahasiswa_profile
            except Mahasiswa.DoesNotExist:
                import random
                nim = profile_data.get('nim') or f"2201{random.randint(100000, 999999)}"
                profile = Mahasiswa.objects.create(user=user, nim=nim)
                
            nim = profile_data.get('nim')
            if nim and nim != profile.nim:
                if Mahasiswa.objects.filter(nim=nim).exclude(user=user).exists():
                    return Response({"detail": "NIM sudah terdaftar."}, status=status.HTTP_400_BAD_REQUEST)
                profile.nim = nim
                
            profile.jurusan = profile_data.get('jurusan', profile.jurusan)
            profile.universitas = profile_data.get('universitas', profile.universitas)
            
            semester = profile_data.get('semester')
            if semester is not None:
                try:
                    profile.semester = int(semester)
                except ValueError:
                    pass
            profile.save()
            
        elif user.is_instructor:
            profile_data = data.get('instructor_profile', {}) or data
            try:
                profile = user.instructor_profile
            except InstructorProfile.DoesNotExist:
                import random
                nidn = profile_data.get('nidn') or f"1001{random.randint(100000, 999999)}"
                profile = InstructorProfile.objects.create(user=user, nidn=nidn)
                
            nidn = profile_data.get('nidn')
            if nidn and nidn != profile.nidn:
                if InstructorProfile.objects.filter(nidn=nidn).exclude(user=user).exists():
                    return Response({"detail": "NIDN sudah terdaftar."}, status=status.HTTP_400_BAD_REQUEST)
                profile.nidn = nidn
                
            profile.bidang_keahlian = profile_data.get('bidang_keahlian', profile.bidang_keahlian)
            profile.universitas = profile_data.get('universitas', profile.universitas)
            profile.save()
            
        # Set onboarded to True once profile is updated
        if not user.is_onboarded:
            user.is_onboarded = True
            user.save()
            
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class StudentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            data = get_student_dashboard_data(request.user)
            return Response(data, status=status.HTTP_200_OK)
        except ValueError as ve:
            return Response({"detail": str(ve)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": f"Terjadi kesalahan internal: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GoogleOAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        import random
        from django.contrib.auth import get_user_model
        from django.conf import settings
        from users.models import Mahasiswa, InstructorProfile

        User = get_user_model()
        email = request.data.get('email')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        google_id = request.data.get('google_id', '')
        credential = request.data.get('credential', '')
        role = request.data.get('role', 'student')

        if credential and google_id != "mock-google-id":
            try:
                from google.auth.transport import requests as google_requests
                from google.oauth2 import id_token

                payload = id_token.verify_oauth2_token(
                    credential,
                    google_requests.Request(),
                    settings.GOOGLE_OAUTH_CLIENT_ID,
                )
            except Exception:
                return Response(
                    {"detail": "Token Google tidak valid."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            email = payload.get('email')
            first_name = payload.get('given_name', first_name)
            last_name = payload.get('family_name', last_name)
            google_id = payload.get('sub', google_id)
        elif not settings.DEBUG:
            return Response(
                {"detail": "Credential Google wajib dikirim."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not email:
            return Response({"detail": "Email harus diisi."}, status=status.HTTP_400_BAD_REQUEST)

        if 'instructor' in email.lower() or 'dosen' in email.lower():
            role = 'instructor'

        # Try to find user with this email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create user since they don't exist
            username = email.split('@')[0]
            # Handle username collision
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            import secrets
            password = secrets.token_urlsafe(16)
            
            if role == 'instructor':
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    is_instructor=True,
                    is_mahasiswa=False,
                    is_onboarded=False
                )
                
                # Generate random NIDN
                nidn = f"1001{random.randint(100000, 999999)}"
                while InstructorProfile.objects.filter(nidn=nidn).exists():
                    nidn = f"1001{random.randint(100000, 999999)}"
                
                InstructorProfile.objects.create(
                    user=user,
                    nidn=nidn,
                    bidang_keahlian="Umum",
                    universitas="Universitas Indonesia"
                )
            else:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    is_mahasiswa=True,
                    is_instructor=False,
                    is_onboarded=False
                )

                # Generate random NIM
                nim = f"2201{random.randint(100000, 999999)}"
                while Mahasiswa.objects.filter(nim=nim).exists():
                    nim = f"2201{random.randint(100000, 999999)}"

                # Create Mahasiswa profile
                Mahasiswa.objects.create(
                    user=user,
                    nim=nim,
                    jurusan="Informatika",
                    universitas="Universitas Indonesia",
                    semester=1
                )

        # Generate simple JWT tokens
        tokens = get_tokens_for_user(user)
        user_data = UserSerializer(user).data
        return Response({
            "message": "Login Google berhasil.",
            "user": user_data,
            "tokens": tokens
        }, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"detail": "Password lama dan password baru harus diisi."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(old_password):
            return Response(
                {"detail": "Password lama salah."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 6:
            return Response(
                {"detail": "Password baru minimal 6 karakter."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password berhasil diubah."}, status=status.HTTP_200_OK)
