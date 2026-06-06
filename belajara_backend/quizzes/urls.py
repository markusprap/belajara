from django.urls import path
from quizzes.views import (
    QuizGenerateView, QuizDetailView, QuizSubmitView,
    QuizSubmissionsListView, QuizManageView, ModuleQuizListView
)

urlpatterns = [
    path('courses/modules/<int:module_id>/quiz/generate/', QuizGenerateView.as_view(), name='quiz_generate'),
    path('courses/modules/<int:module_id>/quiz/manage/', QuizManageView.as_view(), name='quiz_manage'),
    path('modules/<int:module_id>/quizzes/', ModuleQuizListView.as_view(), name='module_quizzes'),
    path('quizzes/<int:quiz_id>/', QuizDetailView.as_view(), name='quiz_detail'),
    path('quizzes/<int:quiz_id>/submit/', QuizSubmitView.as_view(), name='quiz_submit'),
    path('quizzes/<int:quiz_id>/submissions/', QuizSubmissionsListView.as_view(), name='quiz_submissions'),
]
