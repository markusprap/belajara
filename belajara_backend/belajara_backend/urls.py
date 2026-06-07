from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from users.views import StudentDashboardView, RegisterView, MeView, GoogleOAuthView, ChangePasswordView
from courses.views import (
    CourseListView, CourseEnrollView, CourseDetailView,
    CourseCreateView, CourseUpdateDeleteView,
    ModuleCreateView, ModuleUpdateDeleteView,
    SubChapterCreateView, SubChapterUpdateDeleteView,
    MaterialAIGenerateView,
    CourseCertificateView, CourseClaimCertificateView,
)
from explore.views import PDFAnalyzeView, CurriculumUploadView, AIRecommendationStatusView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication endpoints
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/google/', GoogleOAuthView.as_view(), name='auth_google'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', MeView.as_view(), name='auth_me'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='auth_change_password'),

    # Student endpoints
    path('api/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('api/courses/', CourseListView.as_view(), name='course-list'),
    path('api/courses/enroll/', CourseEnrollView.as_view(), name='course-enroll'),

    # Instructor CRUD endpoints
    path('api/courses/create/', CourseCreateView.as_view(), name='course-create'),
    path('api/courses/<str:code>/', CourseDetailView.as_view(), name='course-detail'),
    path('api/courses/<str:code>/certificate/', CourseCertificateView.as_view(), name='course-certificate'),
    path('api/courses/<str:code>/claim-certificate/', CourseClaimCertificateView.as_view(), name='course-claim-certificate'),
    path('api/courses/<str:code>/manage/', CourseUpdateDeleteView.as_view(), name='course-manage'),
    path('api/courses/<str:code>/modules/create/', ModuleCreateView.as_view(), name='module-create'),
    path('api/modules/<int:pk>/manage/', ModuleUpdateDeleteView.as_view(), name='module-manage'),
    path('api/modules/<int:module_id>/subchapters/create/', SubChapterCreateView.as_view(), name='subchapter-create'),
    path('api/subchapters/<int:pk>/manage/', SubChapterUpdateDeleteView.as_view(), name='subchapter-manage'),

    # Material AI Generation endpoint
    path('api/courses/ai/generate-material/', MaterialAIGenerateView.as_view(), name='material-ai-generate'),

    # Explore / AI endpoints
    path('api/explore/analyze/', PDFAnalyzeView.as_view(), name='pdf-analyze'),
    path('api/explore/upload-curriculum/', CurriculumUploadView.as_view(), name='curriculum-upload'),
    path('api/explore/recommendations/status/<int:curriculum_id>/', AIRecommendationStatusView.as_view(), name='ai-recommendation-status'),

    # App-level url includes
    path('api/', include('quizzes.urls')),
    path('api/', include('discussions.urls')),
    path('api/', include('payments.urls')),
]
