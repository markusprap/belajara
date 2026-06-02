from django.db import models

class Course(models.Model):
    code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    sks = models.IntegerField(default=3)
    semester = models.IntegerField(default=1)
    department = models.CharField(max_length=100)  # e.g., "Informatika", "Sistem Informasi"

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
