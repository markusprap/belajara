from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom user model for Belajara.
    """
    is_mahasiswa = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)
    is_instructor = models.BooleanField(default=False)
    is_onboarded = models.BooleanField(default=True)
    
    # Override groups and user_permissions if needed, or leave as default.
    # AbstractUser provides username, first_name, last_name, email, password.

class Mahasiswa(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mahasiswa_profile')
    nim = models.CharField(max_length=20, unique=True)
    jurusan = models.CharField(max_length=100)
    universitas = models.CharField(max_length=150)
    semester = models.IntegerField(default=1)
    active_courses = models.ManyToManyField('courses.Course', blank=True, related_name='students')

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.nim})"

class InstructorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='instructor_profile')
    nidn = models.CharField(max_length=20, unique=True)
    bidang_keahlian = models.CharField(max_length=100)
    universitas = models.CharField(max_length=150)
    ai_credits = models.IntegerField(default=20)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.nidn})"


class AICreditTransaction(models.Model):
    instructor = models.ForeignKey(InstructorProfile, on_delete=models.CASCADE, related_name='credit_transactions')
    amount = models.IntegerField()  # positive for top-up, negative for consumption
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    reference_id = models.CharField(max_length=100, blank=True, null=True)  # transaction order_id if top-up

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.instructor.user.username} — {self.amount} ({self.description})"


