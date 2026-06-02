from django.db import models
from courses.models import CourseModule
from users.models import Mahasiswa

class Quiz(models.Model):
    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE, related_name='quizzes')
    questions_json = models.JSONField(help_text="Store questions as list of objects: [{'question': str, 'options': {'A': str, 'B': str, 'C': str, 'D': str}, 'correct_answer': str, 'explanation': str}]")
    generated_by_ai = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quiz for module {self.module.title} (ID: {self.id})"

class QuizSubmission(models.Model):
    mahasiswa = models.ForeignKey(Mahasiswa, on_delete=models.CASCADE, related_name='quiz_submissions')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='submissions')
    answers_json = models.JSONField(help_text="Store student answers as object: {'0': 'A', '1': 'B'}")
    score = models.FloatField(default=0.0)
    passed = models.BooleanField(default=False)
    graded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Submission by {self.mahasiswa.nim} for Quiz {self.quiz_id} - Score: {self.score}"
