from django.db import models
from django.utils import timezone
from courses.models import Course
from users.models import Mahasiswa


class Subscription(models.Model):
    """
    Represents a recurring subscription plan (Scholar or Pro tier).
    Linked to Midtrans Subscription API via saved_token_id.
    """
    TIER_CHOICES = [
        ('scholar', 'Scholar — Rp49.000/bulan'),
        ('pro', 'Pro — Rp99.000/bulan'),
    ]
    STATUS_CHOICES = [
        ('active', 'Aktif'),
        ('suspended', 'Ditangguhkan'),
        ('cancelled', 'Dibatalkan'),
        ('expired', 'Kedaluwarsa'),
    ]

    mahasiswa = models.OneToOneField(
        Mahasiswa, on_delete=models.CASCADE,
        related_name='subscription',
        verbose_name='Mahasiswa'
    )
    tier = models.CharField(
        max_length=20, choices=TIER_CHOICES,
        verbose_name='Tier Berlangganan'
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES,
        default='active', verbose_name='Status'
    )
    # Midtrans saved token for recurring charge (stored server-side, PCI-DSS compliant)
    saved_token_id = models.CharField(
        max_length=255, blank=True, default='',
        verbose_name='Midtrans Saved Token ID'
    )
    current_period_start = models.DateTimeField(
        default=timezone.now,
        verbose_name='Mulai Periode'
    )
    current_period_end = models.DateTimeField(
        verbose_name='Akhir Periode'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Langganan'
        verbose_name_plural = 'Langganan'

    def __str__(self):
        return f"{self.mahasiswa} — {self.get_tier_display()} ({self.status})"

    @property
    def is_active(self):
        return (
            self.status in ('active', 'cancelled') and
            self.current_period_end > timezone.now()
        )

    @property
    def monthly_price(self):
        prices = {'scholar': 49000, 'pro': 99000}
        return prices.get(self.tier, 0)


class Transaction(models.Model):
    """
    Records every payment transaction — either a per-course purchase
    or a subscription initiation/renewal.
    """
    TRANSACTION_TYPE_CHOICES = [
        ('course_purchase', 'Pembelian Kursus'),
        ('subscription_new', 'Langganan Baru'),
        ('subscription_renewal', 'Perpanjangan Langganan'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Menunggu'),
        ('success', 'Berhasil'),
        ('failed', 'Gagal'),
        ('expire', 'Kedaluwarsa'),
        ('cancel', 'Dibatalkan'),
    ]

    order_id = models.CharField(max_length=100, unique=True)
    mahasiswa = models.ForeignKey(
        Mahasiswa, on_delete=models.CASCADE,
        related_name='transactions'
    )
    # course is nullable — subscription transactions don't tie to a single course
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE,
        related_name='transactions',
        null=True, blank=True
    )
    subscription = models.ForeignKey(
        Subscription, on_delete=models.SET_NULL,
        related_name='transactions',
        null=True, blank=True,
        verbose_name='Langganan Terkait'
    )
    transaction_type = models.CharField(
        max_length=30, choices=TRANSACTION_TYPE_CHOICES,
        default='course_purchase',
        verbose_name='Jenis Transaksi'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    snap_token = models.CharField(max_length=255, blank=True, null=True)
    snap_url = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(
        max_length=50, choices=STATUS_CHOICES,
        default='pending'
    )
    # Raw Midtrans notification payload for audit trail
    midtrans_payload = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Transaksi'
        verbose_name_plural = 'Transaksi'

    def __str__(self):
        if self.course:
            return f"Transaction {self.order_id} — {self.course.title} — {self.status}"
        return f"Transaction {self.order_id} — {self.get_transaction_type_display()} — {self.status}"
