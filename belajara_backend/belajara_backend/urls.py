"""
URL configuration for belajara_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from users.views import StudentDashboardView
from courses.views import CourseListView, CourseEnrollView
from explore.views import PDFAnalyzeView, CurriculumUploadView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('api/courses/', CourseListView.as_view(), name='course-list'),
    path('api/courses/enroll/', CourseEnrollView.as_view(), name='course-enroll'),
    path('api/explore/analyze/', PDFAnalyzeView.as_view(), name='pdf-analyze'),
    path('api/explore/upload-curriculum/', CurriculumUploadView.as_view(), name='curriculum-upload'),
]
