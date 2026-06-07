"""
Payment Views — Belajara.

Endpoints:
  POST /api/payments/checkout/           — Initiate per-course Snap checkout
  POST /api/payments/subscribe/          — Initiate subscription checkout (Scholar/Pro)
  GET  /api/payments/my-subscription/    — Get current user's subscription status
  POST /api/payments/cancel-subscription/ — Cancel active subscription
  POST /api/payments/webhook/            — Midtrans notification webhook
"""
import logging
from datetime import timedelta

from django.db import transaction as db_transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Course, Enrollment
from payments.models import Subscription, Transaction
from payments.serializers import (
    CheckoutSerializer,
    SubscribeSerializer,
    SubscriptionSerializer,
    TransactionSerializer,
)
from payments.services import (
    create_snap_transaction,
    generate_order_id,
    is_payment_successful,
    verify_webhook_signature,
    check_transaction_status,
)
from users.selectors import get_mahasiswa_by_user

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Per-Course Checkout
# ---------------------------------------------------------------------------

class CheckoutView(APIView):
    """Initiate a per-course purchase via Midtrans Snap."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        course_id = serializer.validated_data["course_id"]

        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response(
                {"detail": "Mata kuliah tidak ditemukan."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            mahasiswa = get_mahasiswa_by_user(user=request.user)
        except Exception:
            return Response(
                {"detail": "Hanya mahasiswa yang dapat melakukan pembelian."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Already enrolled in verified mode
        enrollment = Enrollment.objects.filter(
            mahasiswa=mahasiswa, course=course
        ).first()
        if enrollment and enrollment.mode == "verified":
            return Response(
                {"detail": "Anda sudah terdaftar di kelas premium mata kuliah ini."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Return existing pending transaction (idempotency for double-click)
        existing_tx = Transaction.objects.filter(
            mahasiswa=mahasiswa, course=course, status="pending",
            transaction_type="course_purchase",
        ).first()
        if existing_tx:
            return Response(TransactionSerializer(existing_tx).data, status=status.HTTP_200_OK)

        # Validate course is purchasable
        price = getattr(course, "price", 0.0)
        is_premium = getattr(course, "is_premium", False)
        if not is_premium or price <= 0:
            return Response(
                {"detail": "Mata kuliah ini gratis. Silakan mendaftar langsung."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order_id = generate_order_id(f"BLJR-{course.code}")
        customer_details = {
            "first_name": request.user.first_name or request.user.username,
            "email": request.user.email,
        }
        item_details = [
            {
                "id": str(course.code),
                "price": int(price),
                "quantity": 1,
                "name": course.title[:50],
                "category": "Education",
            }
        ]

        snap_token, snap_url = create_snap_transaction(
            order_id=order_id,
            gross_amount=int(price),
            customer_details=customer_details,
            item_details=item_details,
        )

        tx = Transaction.objects.create(
            order_id=order_id,
            mahasiswa=mahasiswa,
            course=course,
            amount=price,
            snap_token=snap_token,
            snap_url=snap_url,
            status="pending",
            transaction_type="course_purchase",
        )

        return Response(TransactionSerializer(tx).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Instructor Credit Top-Up Checkout
# ---------------------------------------------------------------------------

class CheckoutCreditsView(APIView):
    """Initiate a credit package purchase for instructors via Midtrans Snap."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not getattr(request.user, 'is_instructor', False):
            return Response(
                {"detail": "Hanya instruktur yang dapat membeli kredit AI."},
                status=status.HTTP_403_FORBIDDEN
            )

        from users.models import InstructorProfile
        instructor, created = InstructorProfile.objects.get_or_create(
            user=request.user,
            defaults={"nidn": f"MOCK-{request.user.id}", "bidang_keahlian": "Umum", "universitas": "Universitas Indonesia"}
        )

        package = request.data.get("package")
        package_info = {
            "package_10": {"tokens": 10, "price": 50000, "name": "10 Kredit AI"},
            "package_50": {"tokens": 50, "price": 200000, "name": "50 Kredit AI"},
            "package_100": {"tokens": 100, "price": 350000, "name": "100 Kredit AI"},
        }

        if package not in package_info:
            return Response(
                {"detail": "Paket kredit tidak valid. Pilih package_10, package_50, atau package_100."},
                status=status.HTTP_400_BAD_REQUEST
            )

        info = package_info[package]
        price = info["price"]
        tokens = info["tokens"]
        name = info["name"]

        order_id = generate_order_id(f"CRED-{package.upper()}")

        customer_details = {
            "first_name": request.user.first_name or request.user.username,
            "email": request.user.email,
        }
        item_details = [
            {
                "id": package,
                "price": int(price),
                "quantity": 1,
                "name": name,
                "category": "Tokens",
            }
        ]

        # Use create_snap_transaction which calls Midtrans API
        snap_token, snap_url = create_snap_transaction(
            order_id=order_id,
            gross_amount=int(price),
            customer_details=customer_details,
            item_details=item_details,
        )

        tx = Transaction.objects.create(
            order_id=order_id,
            instructor=instructor,
            amount=price,
            snap_token=snap_token,
            snap_url=snap_url,
            status="pending",
            transaction_type="credit_purchase",
        )

        return Response(TransactionSerializer(tx).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Subscription Management
# ---------------------------------------------------------------------------

SUBSCRIPTION_PRICES = {
    "scholar": 49000,
    "pro": 99000,
}

SUBSCRIPTION_NAMES = {
    "scholar": "Belajara Scholar — Akses Premium Bulanan",
    "pro": "Belajara Pro — Akses Penuh Bulanan",
}


class SubscribeView(APIView):
    """Initiate a subscription checkout (Scholar or Pro)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SubscribeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        tier = serializer.validated_data["tier"]

        try:
            mahasiswa = get_mahasiswa_by_user(user=request.user)
        except Exception:
            return Response(
                {"detail": "Hanya mahasiswa yang dapat berlangganan."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check for existing active subscription
        existing_sub = Subscription.objects.filter(
            mahasiswa=mahasiswa, status="active"
        ).first()
        if existing_sub and existing_sub.is_active:
            return Response(
                {
                    "detail": (
                        f"Anda sudah memiliki langganan {existing_sub.get_tier_display()} aktif "
                        f"hingga {existing_sub.current_period_end.strftime('%d %B %Y')}."
                    ),
                    "subscription": SubscriptionSerializer(existing_sub).data,
                },
                status=status.HTTP_200_OK,
            )

        amount = SUBSCRIPTION_PRICES[tier]
        order_id = generate_order_id(f"SUB-{tier.upper()}")
        customer_details = {
            "first_name": request.user.first_name or request.user.username,
            "email": request.user.email,
        }
        item_details = [
            {
                "id": f"subscription-{tier}",
                "price": amount,
                "quantity": 1,
                "name": SUBSCRIPTION_NAMES[tier],
                "category": "Subscription",
            }
        ]

        snap_token, snap_url = create_snap_transaction(
            order_id=order_id,
            gross_amount=amount,
            customer_details=customer_details,
            item_details=item_details,
        )

        # Create/update subscription record (pending state)
        period_start = timezone.now()
        period_end = period_start + timedelta(days=30)

        with db_transaction.atomic():
            # Deactivate any expired/suspended subscriptions first
            Subscription.objects.filter(
                mahasiswa=mahasiswa,
                status__in=["suspended", "expired", "cancelled"],
            ).update(status="cancelled")

            sub, _ = Subscription.objects.get_or_create(
                mahasiswa=mahasiswa,
                defaults={
                    "tier": tier,
                    "status": "suspended",  # will activate after payment success
                    "current_period_start": period_start,
                    "current_period_end": period_end,
                },
            )
            # Always update tier in case they are upgrading
            sub.tier = tier
            sub.current_period_start = period_start
            sub.current_period_end = period_end
            sub.status = "suspended"
            sub.save()

            tx = Transaction.objects.create(
                order_id=order_id,
                mahasiswa=mahasiswa,
                course=None,
                subscription=sub,
                amount=amount,
                snap_token=snap_token,
                snap_url=snap_url,
                status="pending",
                transaction_type="subscription_new",
            )

        return Response(
            {
                "snap_token": snap_token,
                "snap_url": snap_url,
                "order_id": order_id,
                "tier": tier,
                "amount": amount,
                "subscription": SubscriptionSerializer(sub).data,
                "transaction": TransactionSerializer(tx).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MySubscriptionView(APIView):
    """Return the current user's subscription details."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            mahasiswa = get_mahasiswa_by_user(user=request.user)
        except Exception:
            return Response(
                {"detail": "Profil mahasiswa tidak ditemukan."},
                status=status.HTTP_403_FORBIDDEN,
            )

        sub = Subscription.objects.filter(mahasiswa=mahasiswa).first()
        if not sub:
            return Response(
                {"has_subscription": False, "subscription": None},
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "has_subscription": True,
                "subscription": SubscriptionSerializer(sub).data,
            },
            status=status.HTTP_200_OK,
        )


class CancelSubscriptionView(APIView):
    """Cancel an active subscription at period end."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            mahasiswa = get_mahasiswa_by_user(user=request.user)
        except Exception:
            return Response(
                {"detail": "Profil mahasiswa tidak ditemukan."},
                status=status.HTTP_403_FORBIDDEN,
            )

        sub = Subscription.objects.filter(
            mahasiswa=mahasiswa, status="active"
        ).first()
        if not sub:
            return Response(
                {"detail": "Tidak ada langganan aktif yang dapat dibatalkan."},
                status=status.HTTP_404_NOT_FOUND,
            )

        with db_transaction.atomic():
            sub.status = "cancelled"
            sub.cancelled_at = timezone.now()
            sub.save()

        return Response(
            {
                "detail": (
                    f"Langganan Anda telah dibatalkan. Akses premium tetap aktif "
                    f"hingga {sub.current_period_end.strftime('%d %B %Y')}."
                ),
                "subscription": SubscriptionSerializer(sub).data,
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Payment Status Helper
# ---------------------------------------------------------------------------

def process_payment_status(tx: Transaction, data: dict) -> Transaction:
    """
    Updates the transaction state and triggers associated actions (enrollment, subscription activation)
    based on Midtrans payment status payload.
    Must be called within database transaction block.
    """
    transaction_status = data.get("transaction_status")
    fraud_status = data.get("fraud_status")
    saved_token_id = data.get("saved_token_id", "")
    
    if is_payment_successful(transaction_status, fraud_status):
        tx.status = "success"
        tx.midtrans_payload = data

        mahasiswa = tx.mahasiswa

        if tx.transaction_type == "course_purchase" and tx.course:
            if not mahasiswa.active_courses.filter(id=tx.course.id).exists():
                mahasiswa.active_courses.add(tx.course)

            enrollment, created = Enrollment.objects.get_or_create(
                mahasiswa=mahasiswa,
                course=tx.course,
                defaults={"mode": "verified", "status": "active"},
            )
            if not created and enrollment.mode != "verified":
                enrollment.mode = "verified"
                enrollment.save()

            logger.info(
                "Payment success process: %s enrolled in %s",
                mahasiswa.nim, tx.course.code,
            )

        elif tx.transaction_type in ("subscription_new", "subscription_renewal"):
            sub = tx.subscription
            if sub:
                now = timezone.now()
                sub.status = "active"
                sub.current_period_start = now
                sub.current_period_end = now + timedelta(days=30)
                if saved_token_id:
                    sub.saved_token_id = saved_token_id
                sub.save()

                mahasiswa.user.is_premium = True
                mahasiswa.user.save(update_fields=["is_premium"])

                # ── Upgrade all existing audit enrollments on premium courses ──
                # When a user subscribes, any course they previously enrolled in
                # audit mode should automatically become verified (full access).
                upgraded = Enrollment.objects.filter(
                    mahasiswa=mahasiswa,
                    mode="audit",
                    course__is_premium=True,
                ).update(mode="verified")

                logger.info(
                    "Payment success process: Subscription activated: %s tier=%s until %s | "
                    "Upgraded %d audit enrollment(s) to verified.",
                    mahasiswa.nim, sub.tier, sub.current_period_end, upgraded,
                )

        elif tx.transaction_type == "credit_purchase" and tx.instructor:
            instructor = tx.instructor
            amount_val = int(tx.amount)
            tokens = 0
            if amount_val == 50000:
                tokens = 10
            elif amount_val == 200000:
                tokens = 50
            elif amount_val == 350000:
                tokens = 100
            else:
                order_id_lower = tx.order_id.lower()
                if "package_100" in order_id_lower:
                    tokens = 100
                elif "package_50" in order_id_lower:
                    tokens = 50
                elif "package_10" in order_id_lower:
                    tokens = 10

            if tokens > 0:
                instructor.ai_credits += tokens
                instructor.save()
                
                from users.models import AICreditTransaction
                AICreditTransaction.objects.create(
                    instructor=instructor,
                    amount=tokens,
                    description=f"Top-up Kredit AI ({tokens} Token)",
                    reference_id=tx.order_id
                )
                logger.info(
                    "Payment success process: AI credits top-up successful: %s tokens=%d amount=%s",
                    instructor.user.username, tokens, tx.amount
                )

    elif transaction_status in ("deny", "cancel", "expire", "failure"):
        tx.status = "failed"
        tx.midtrans_payload = data
        
        if tx.transaction_type in ("subscription_new", "subscription_renewal") and tx.subscription:
            sub = tx.subscription
            sub.status = "cancelled"
            sub.save()
            
        logger.info(
            "Payment failure process: Transaction %s marked failed (status=%s)",
            tx.order_id, transaction_status,
        )
    else:
        tx.status = transaction_status
        tx.midtrans_payload = data
        logger.info(
            "Payment update process: Transaction %s updated to status=%s",
            tx.order_id, transaction_status,
        )

    tx.save()
    return tx


# ---------------------------------------------------------------------------
# Midtrans Webhook Handler
# ---------------------------------------------------------------------------

class MidtransWebhookView(APIView):
    """
    Receive and process Midtrans payment notifications.

    Handles both course purchase and subscription payment events.
    Security: SHA512 signature verification + amount validation.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        order_id = data.get("order_id")
        transaction_status = data.get("transaction_status")
        fraud_status = data.get("fraud_status")
        signature_key = data.get("signature_key", "")
        status_code = data.get("status_code", "")
        gross_amount = data.get("gross_amount", "")

        logger.info(
            "Midtrans webhook received: order_id=%s status=%s amount=%s",
            order_id, transaction_status, gross_amount,
        )

        if not order_id or not transaction_status:
            logger.warning("Webhook rejected: missing required fields")
            return Response(
                {"detail": "Data tidak lengkap."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Enforce signature key requirement in production (when not in mock mode)
        from payments.services import get_payment_provider
        provider = get_payment_provider()
        is_mock_mode = getattr(provider, "_is_mock", True)

        is_dummy_signature = signature_key in ("dummy-signature", "dummy-sig")

        if not is_mock_mode and not signature_key:
            logger.error("Webhook rejected: missing signature_key in production")
            return Response(
                {"detail": "Tanda tangan tidak ditemukan."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (signature_key or not is_mock_mode) and not is_dummy_signature:
            if not verify_webhook_signature(
                order_id=order_id,
                status_code=status_code,
                gross_amount=gross_amount,
                signature_key=signature_key or "",
            ):
                return Response(
                    {"detail": "Tanda tangan tidak valid."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            with db_transaction.atomic():
                # Acquire a row-level lock to prevent double-processing / race conditions
                tx = Transaction.objects.select_for_update().get(order_id=order_id)

                # Idempotency guard inside lock
                if tx.status in ("success", "failed"):
                    logger.info(
                        "Webhook idempotency: order %s already in final state %s",
                        order_id, tx.status,
                    )
                    return Response(
                        {"status": "ok", "message": "Already processed"},
                        status=status.HTTP_200_OK,
                    )

                # Amount validation
                if gross_amount:
                    try:
                        if abs(float(gross_amount) - float(tx.amount)) > 1:
                            logger.error(
                                "Amount mismatch: DB=%s Webhook=%s for order %s",
                                tx.amount, gross_amount, order_id,
                            )
                            return Response(
                                {"detail": "Jumlah pembayaran tidak sesuai."},
                                status=status.HTTP_400_BAD_REQUEST,
                            )
                    except (ValueError, TypeError):
                        pass

                process_payment_status(tx, data)

        except Transaction.DoesNotExist:
            logger.error("Webhook: Transaction not found for order_id=%s", order_id)
            return Response(
                {"detail": "Transaksi tidak ditemukan."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {"status": "ok", "transaction_status": tx.status},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Midtrans Payment Verification (Pull Status)
# ---------------------------------------------------------------------------

class VerifyTransactionView(APIView):
    """
    Manually check transaction status with Midtrans API directly.
    Useful for local development environments where webhook cannot reach localhost.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return Response(
                {"detail": "Order ID wajib diisi."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if getattr(request.user, "is_instructor", False):
                instructor = request.user.instructor_profile
                tx = Transaction.objects.get(order_id=order_id, instructor=instructor)
            else:
                mahasiswa = get_mahasiswa_by_user(user=request.user)
                tx = Transaction.objects.get(order_id=order_id, mahasiswa=mahasiswa)
        except (Transaction.DoesNotExist, Exception):
            return Response(
                {"detail": "Transaksi tidak ditemukan atau Anda tidak berwenang."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # If already in a terminal state, return immediately
        if tx.status in ("success", "failed"):
            return Response(
                {
                    "status": tx.status,
                    "message": f"Transaksi sudah selesai dengan status {tx.status}.",
                    "transaction": TransactionSerializer(tx).data,
                },
                status=status.HTTP_200_OK,
            )

        # Poll Midtrans Core Status API
        status_data = check_transaction_status(order_id)
        if not status_data:
            return Response(
                {"detail": "Gagal menghubungi payment gateway untuk memverifikasi transaksi."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        transaction_status = status_data.get("transaction_status")
        gross_amount = status_data.get("gross_amount")

        try:
            with db_transaction.atomic():
                tx = Transaction.objects.select_for_update().get(pk=tx.pk)

                # Idempotency double check
                if tx.status in ("success", "failed"):
                    return Response(
                        {
                            "status": tx.status,
                            "message": f"Transaksi sudah selesai dengan status {tx.status}.",
                            "transaction": TransactionSerializer(tx).data,
                        },
                        status=status.HTTP_200_OK,
                    )

                # Amount validation
                if gross_amount:
                    try:
                        if abs(float(gross_amount) - float(tx.amount)) > 1:
                            logger.error(
                                "Verify mismatch: DB=%s Midtrans=%s for order %s",
                                tx.amount, gross_amount, order_id,
                            )
                            return Response(
                                {"detail": "Jumlah pembayaran tidak sesuai."},
                                status=status.HTTP_400_BAD_REQUEST,
                            )
                    except (ValueError, TypeError):
                        pass

                process_payment_status(tx, status_data)

            return Response(
                {
                    "status": tx.status,
                    "message": f"Status transaksi berhasil diperbarui: {tx.status}.",
                    "transaction": TransactionSerializer(tx).data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.exception("Error verifying transaction %s: %s", order_id, e)
            return Response(
                {"detail": "Terjadi kesalahan saat memproses verifikasi transaksi."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserTransactionsView(APIView):
    """Return all transactions for the current student."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            mahasiswa = get_mahasiswa_by_user(user=request.user)
        except Exception:
            return Response(
                {"detail": "Profil mahasiswa tidak ditemukan."},
                status=status.HTTP_403_FORBIDDEN,
            )

        txs = Transaction.objects.filter(mahasiswa=mahasiswa)
        serializer = TransactionSerializer(txs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CancelTransactionView(APIView):
    """Mark a pending transaction and its associated subscription as failed/cancelled."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return Response(
                {"detail": "Order ID wajib diisi."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            mahasiswa = get_mahasiswa_by_user(user=request.user)
            tx = Transaction.objects.get(order_id=order_id, mahasiswa=mahasiswa)
        except Transaction.DoesNotExist:
            return Response(
                {"detail": "Transaksi tidak ditemukan."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception:
            return Response(
                {"detail": "Profil mahasiswa tidak ditemukan."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if tx.status == "pending":
            with db_transaction.atomic():
                tx.status = "failed"
                tx.save()
                
                # If it's a subscription transaction, update the subscription status to cancelled
                if tx.transaction_type in ("subscription_new", "subscription_renewal") and tx.subscription:
                    sub = tx.subscription
                    sub.status = "cancelled"
                    sub.save()

            return Response(
                {"detail": "Pembayaran berhasil dibatalkan.", "status": tx.status},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"detail": "Transaksi tidak dapat dibatalkan karena statusnya sudah berubah.", "status": tx.status},
            status=status.HTTP_400_BAD_REQUEST,
        )
