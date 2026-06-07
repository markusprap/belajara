from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
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
        import random
        from django.core.cache import cache
        from django.core.mail import send_mail
        from django.conf import settings

        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.is_active = False
            user.save()

            # Generate 6-digit code
            code = str(random.randint(100000, 999999))
            
            # Save code in cache (24 hours timeout)
            cache.set(f"email_verify_code_{user.email}", code, timeout=86400)
            
            # Send verification email via Resend SMTP
            try:
                send_mail(
                    subject="Verifikasi Email Akun Belajara Anda",
                    message=f"Halo {user.username},\n\nTerima kasih telah mendaftar di Belajara.\nKode verifikasi email Anda adalah: {code}\n\nMasukkan kode ini di aplikasi untuk memverifikasi akun Anda.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"FAILED TO SEND VERIFICATION EMAIL TO {user.email}: {e}")

            # Print code to terminal for easy manual testing
            print(f"========================================")
            print(f"EMAIL VERIFICATION CODE FOR {user.email}: {code}")
            print(f"========================================")

            response_data = {
                "message": "Registrasi berhasil. Silakan cek email Anda untuk kode verifikasi.",
                "email": user.email,
            }
            if settings.DEBUG:
                response_data["code_sandbox"] = code

            return Response(response_data, status=status.HTTP_201_CREATED)
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

                # Log verification attempt (safe fields only)
                print(f"DEBUG: Verifying Google Token for email: {email} with CID: {settings.GOOGLE_OAUTH_CLIENT_ID[:10]}...")

                payload = id_token.verify_oauth2_token(
                    credential,
                    google_requests.Request(),
                    settings.GOOGLE_OAUTH_CLIENT_ID,
                )
            except Exception as e:
                print(f"DEBUG: Google Token Verification Failed: {str(e)}")
                return Response(
                    {"detail": f"Token Google tidak valid: {str(e)}"},
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
            # Ensure user is active if logging in via Google
            if not user.is_active:
                user.is_active = True
                user.save()
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
                    is_onboarded=False,
                    is_active=True  # Ensure active
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
                    is_onboarded=False,
                    is_active=True  # Ensure active
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
        
        response = Response({
            "message": "Login Google berhasil.",
            "user": user_data
        }, status=status.HTTP_200_OK)
        
        secure = not settings.DEBUG
        samesite = 'Lax' if settings.DEBUG else 'None'
        
        access_lifetime = settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME')
        response.set_cookie(
            key='access_token',
            value=tokens['access'],
            max_age=int(access_lifetime.total_seconds()),
            secure=secure,
            httponly=True,
            samesite=samesite
        )
        
        refresh_lifetime = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME')
        response.set_cookie(
            key='refresh_token',
            value=tokens['refresh'],
            max_age=int(refresh_lifetime.total_seconds()),
            secure=secure,
            httponly=True,
            samesite=samesite
        )
        
        return response


class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])
            
        response_data = serializer.validated_data
        access_token = response_data.get('access')
        refresh_token = response_data.get('refresh')
        
        user = serializer.user
        user_data = UserSerializer(user).data
        
        import sys
        is_testing = 'test' in sys.argv or 'pytest' in sys.modules
        
        response_payload = {
            "message": "Login berhasil.",
            "user": user_data
        }
        if is_testing:
            response_payload["access"] = access_token
            response_payload["refresh"] = refresh_token
            
        response = Response(response_payload, status=status.HTTP_200_OK)
        
        secure = not settings.DEBUG
        samesite = 'Lax' if settings.DEBUG else 'None'
        
        access_lifetime = settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME')
        response.set_cookie(
            key='access_token',
            value=access_token,
            max_age=int(access_lifetime.total_seconds()),
            secure=secure,
            httponly=True,
            samesite=samesite
        )
        
        refresh_lifetime = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME')
        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            max_age=int(refresh_lifetime.total_seconds()),
            secure=secure,
            httponly=True,
            samesite=samesite
        )
        
        return response


class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        
        data = request.data.copy()
        if refresh_token:
            data['refresh'] = refresh_token
            
        serializer = self.get_serializer(data=data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])
            
        response_data = serializer.validated_data
        access_token = response_data.get('access')
        new_refresh_token = response_data.get('refresh')
        
        response = Response({
            "detail": "Token berhasil diperbarui."
        }, status=status.HTTP_200_OK)
        
        secure = not settings.DEBUG
        samesite = 'Lax' if settings.DEBUG else 'None'
        
        access_lifetime = settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME')
        response.set_cookie(
            key='access_token',
            value=access_token,
            max_age=int(access_lifetime.total_seconds()),
            secure=secure,
            httponly=True,
            samesite=samesite
        )
        
        if new_refresh_token:
            refresh_lifetime = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME')
            response.set_cookie(
                key='refresh_token',
                value=new_refresh_token,
                max_age=int(refresh_lifetime.total_seconds()),
                secure=secure,
                httponly=True,
                samesite=samesite
            )
            
        return response


class CookieLogoutView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        response = Response({
            "detail": "Logout berhasil."
        }, status=status.HTTP_200_OK)
        
        secure = not settings.DEBUG
        samesite = 'Lax' if settings.DEBUG else 'None'
        
        response.delete_cookie(
            key='access_token',
            path='/',
            domain=None,
            samesite=samesite
        )
        response.delete_cookie(
            key='refresh_token',
            path='/',
            domain=None,
            samesite=samesite
        )
        
        return response



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


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        import random
        from django.core.cache import cache
        from django.contrib.auth import get_user_model
        from django.conf import settings
        from django.core.mail import send_mail

        User = get_user_model()
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email harus diisi."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "Email tidak terdaftar."}, status=status.HTTP_404_NOT_FOUND)
        
        # Generate 6-digit code
        code = str(random.randint(100000, 999999))
        
        # Store in cache for 10 minutes (600 seconds)
        cache.set(f"reset_code_{email}", code, timeout=600)
        
        # Send reset email via Resend SMTP
        try:
            send_mail(
                subject="Reset Password Akun Belajara Anda",
                message=f"Halo,\n\nKami menerima permintaan untuk mereset password akun Belajara Anda.\nKode verifikasi reset password Anda adalah: {code}\n\nKode ini berlaku selama 10 menit.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"FAILED TO SEND RESET PASSWORD EMAIL TO {email}: {e}")

        # Print to terminal for testing
        print(f"========================================")
        print(f"PASSWORD RESET CODE FOR {email}: {code}")
        print(f"========================================")
        
        response_data = {"detail": "Kode verifikasi telah dikirim ke email Anda."}
        if settings.DEBUG:
            response_data["code_sandbox"] = code
            
        return Response(response_data, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.core.cache import cache
        from django.contrib.auth import get_user_model

        User = get_user_model()
        email = request.data.get("email")
        code = request.data.get("code")
        new_password = request.data.get("new_password")

        if not email or not code or not new_password:
            return Response(
                {"detail": "Email, kode verifikasi, dan password baru harus diisi."},
                status=status.HTTP_400_BAD_REQUEST
            )

        cached_code = cache.get(f"reset_code_{email}")
        if not cached_code or cached_code != str(code).strip():
            return Response(
                {"detail": "Kode verifikasi salah atau sudah kedaluwarsa."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 6:
            return Response(
                {"detail": "Password baru minimal 6 karakter."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "Email tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(new_password)
        user.save()

        # Clear code from cache
        cache.delete(f"reset_code_{email}")

        return Response({"detail": "Password berhasil direset. Silakan login kembali."}, status=status.HTTP_200_OK)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.core.cache import cache
        from django.contrib.auth import get_user_model

        User = get_user_model()
        email = request.data.get("email")
        code = request.data.get("code")

        if not email or not code:
            return Response(
                {"detail": "Email dan kode verifikasi harus diisi."},
                status=status.HTTP_400_BAD_REQUEST
            )

        cached_code = cache.get(f"email_verify_code_{email}")
        if not cached_code or cached_code != str(code).strip():
            return Response(
                {"detail": "Kode verifikasi salah atau sudah kedaluwarsa."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "Email tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        user.is_active = True
        user.save()

        # Clear code from cache
        cache.delete(f"email_verify_code_{email}")

        return Response({"detail": "Email berhasil diverifikasi. Akun Anda telah aktif!"}, status=status.HTTP_200_OK)


class InstructorCreditView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not getattr(request.user, 'is_instructor', False):
            return Response(
                {"detail": "Hanya instruktur yang memiliki akses ke saldo kredit."},
                status=status.HTTP_403_FORBIDDEN
            )

        from users.models import InstructorProfile, AICreditTransaction
        instructor, created = InstructorProfile.objects.get_or_create(
            user=request.user,
            defaults={"nidn": f"MOCK-{request.user.id}", "bidang_keahlian": "Umum", "universitas": "Universitas Indonesia"}
        )

        from users.models import AICreditTransaction
        from users.serializers import AICreditTransactionSerializer

        txs = AICreditTransaction.objects.filter(instructor=instructor).order_by('-created_at')
        serializer = AICreditTransactionSerializer(txs, many=True)

        return Response({
            "ai_credits": instructor.ai_credits,
            "transactions": serializer.data
        }, status=status.HTTP_200_OK)

