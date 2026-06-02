from django.urls import path
from discussions.views import CourseDiscussionListView, DiscussionRepliesView

urlpatterns = [
    path('courses/<int:course_id>/discussions/', CourseDiscussionListView.as_view(), name='course_discussions'),
    path('discussions/<int:post_id>/replies/', DiscussionRepliesView.as_view(), name='discussion_replies'),
]
