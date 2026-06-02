from django.db import models
from courses.models import Course
from users.models import Mahasiswa

class Transaction(models.Model):
    order_id = models.CharField(max_length=100, unique=True)
    mahasiswa = models.ForeignKey(Mahasiswa, on_delete=models.CASCADE, related_name='transactions')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    snap_token = models.CharField(max_length=255, blank=True, null=True)
    snap_url = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, default='pending') # pending, settlement, capture, deny, cancel, expire, failure
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Transaction {self.order_id} - {self.course.title} - {self.status}"
