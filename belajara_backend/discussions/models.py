from django.db import models
from django.conf import settings
from courses.models import Course

class DiscussionPost(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='discussions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='discussions')
    content = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        user_name = self.user.get_full_name() or self.user.username
        post_type = "Reply" if self.parent else "Post"
        return f"{post_type} by {user_name} on {self.course.title} at {self.created_at}"
