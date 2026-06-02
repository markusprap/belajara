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
        from users.models import Mahasiswa

        User = get_user_model()
        email = request.data.get('email')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        # google_id can be mock or real ID
        google_id = request.data.get('google_id', '')

        if not email:
            return Response({"detail": "Email harus diisi."}, status=status.HTTP_400_BAD_REQUEST)

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
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_mahasiswa=True
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

