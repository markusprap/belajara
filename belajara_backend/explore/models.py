from django.db import models
from users.models import Mahasiswa

class Curriculum(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='curricula')
    file_name = models.CharField(max_length=255)
    file_url = models.FileField(upload_to='curricula/', blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.file_name}"

class AIRecommendation(models.Model):
    mahasiswa = models.ForeignKey(Mahasiswa, on_delete=models.CASCADE, related_name='ai_recommendations')
    curriculum = models.ForeignKey(Curriculum, on_delete=models.SET_NULL, null=True, blank=True, related_name='recommendations')
    recommendations_data = models.JSONField()  # Store recommendations as an array/list of JSON objects
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Recommendation for {self.mahasiswa.nim} at {self.created_at}"
