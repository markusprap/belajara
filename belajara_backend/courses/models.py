from django.db import models

class Course(models.Model):
    code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    sks = models.IntegerField(default=3)
    semester = models.IntegerField(default=1)
    department = models.CharField(max_length=100)  # e.g., "Informatika", "Sistem Informasi"
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_premium = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.code} - {self.title}"

class CourseModule(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=1)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.code} - M{self.order}: {self.title}"

class Enrollment(models.Model):
    mahasiswa = models.ForeignKey('users.Mahasiswa', on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    mode = models.CharField(max_length=20, choices=[('audit', 'Audit'), ('verified', 'Verified')], default='audit')
    status = models.CharField(max_length=20, choices=[('active', 'Active'), ('completed', 'Completed')], default='active')

    class Meta:
        unique_together = ('mahasiswa', 'course')

    def __str__(self):
        return f"{self.mahasiswa.user.username} enrolled in {self.course.code} ({self.mode})"

class SubChapter(models.Model):
    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE, related_name='subchapters')
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=[
        ('video', 'Video'),
        ('reading', 'Reading'),
        ('quiz', 'Quiz'),
        ('forum', 'Forum')
    ])
    order = models.IntegerField(default=1)
    
    # Material content
    video_url = models.URLField(blank=True, null=True)
    content = models.TextField(blank=True, null=True) # Markdown material text
    duration = models.CharField(max_length=20, default="15 mnt")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.module.title} - S{self.order}: {self.title} ({self.type})"


