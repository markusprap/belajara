from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from users.views import StudentDashboardView, RegisterView, MeView
from courses.views import (
    CourseListView, CourseEnrollView,
    CourseCreateView, CourseUpdateDeleteView,
    ModuleCreateView, ModuleUpdateDeleteView,
)
from explore.views import PDFAnalyzeView, CurriculumUploadView, AIRecommendationStatusView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication endpoints
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', MeView.as_view(), name='auth_me'),

    # Student endpoints
    path('api/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('api/courses/', CourseListView.as_view(), name='course-list'),
    path('api/courses/enroll/', CourseEnrollView.as_view(), name='course-enroll'),

    # Instructor CRUD endpoints
    path('api/courses/create/', CourseCreateView.as_view(), name='course-create'),
    path('api/courses/<str:code>/manage/', CourseUpdateDeleteView.as_view(), name='course-manage'),
    path('api/courses/<str:code>/modules/create/', ModuleCreateView.as_view(), name='module-create'),
    path('api/modules/<int:pk>/manage/', ModuleUpdateDeleteView.as_view(), name='module-manage'),

    # Explore / AI endpoints
    path('api/explore/analyze/', PDFAnalyzeView.as_view(), name='pdf-analyze'),
    path('api/explore/upload-curriculum/', CurriculumUploadView.as_view(), name='curriculum-upload'),
    path('api/explore/recommendations/status/<int:curriculum_id>/', AIRecommendationStatusView.as_view(), name='ai-recommendation-status'),

    # App-level url includes
    path('api/', include('quizzes.urls')),
    path('api/', include('discussions.urls')),
    path('api/', include('payments.urls')),
]
