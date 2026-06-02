from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from users.views import StudentDashboardView, RegisterView, MeView
from courses.views import CourseListView, CourseEnrollView
from explore.views import PDFAnalyzeView, CurriculumUploadView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', MeView.as_view(), name='auth_me'),

    # Existing endpoints
    path('api/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('api/courses/', CourseListView.as_view(), name='course-list'),
    path('api/courses/enroll/', CourseEnrollView.as_view(), name='course-enroll'),
    path('api/explore/analyze/', PDFAnalyzeView.as_view(), name='pdf-analyze'),
    path('api/explore/upload-curriculum/', CurriculumUploadView.as_view(), name='curriculum-upload'),

    # New app endpoints
    path('api/', include('quizzes.urls')),
    path('api/', include('discussions.urls')),
    path('api/', include('payments.urls')),
]
