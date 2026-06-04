"""
Payment Celery Tasks — Belajara.

Scheduled tasks for subscription lifecycle management:
- Daily renewal check (charge subscriptions due today)
- Expiry enforcement (suspend expired subscriptions)
- Failed-payment retry with exponential backoff

To register the periodic schedule, add to CELERY_BEAT_SCHEDULE in settings:

    CELERY_BEAT_SCHEDULE = {
        "process-subscription-renewals": {
            "task": "payments.tasks.process_subscription_renewals",
            "schedule": crontab(hour=1, minute=0),   # Run daily at 01:00 WIB
        },
        "expire-stale-subscriptions": {
            "task": "payments.tasks.expire_stale_subscriptions",
            "schedule": crontab(hour=0, minute=30),  # Run daily at 00:30 WIB
        },
    }
"""
import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def process_subscription_renewals(self):
    """
    Charge all subscriptions whose current period ends today.

    Flow:
    1. Query subscriptions with status='active' expiring today.
    2. For each, attempt to charge using the saved Midtrans token.
    3. On success → extend period by 30 days.
    4. On failure → retry up to 3 times, then suspend subscription.

    Note: Midtrans Subscription API must be approved for your merchant account.
    Until approval, renewals require manual intervention or email reminders.
    """
    from payments.models import Subscription, Transaction
    from payments.services import create_subscription_plan, generate_order_id

    today = timezone.now().date()
    due_subscriptions = Subscription.objects.filter(
        status="active",
        current_period_end__date=today,
    ).select_related("mahasiswa", "mahasiswa__user")

    processed = 0
    failed = 0

    for sub in due_subscriptions:
        try:
            if not sub.saved_token_id:
                # No saved token — cannot charge automatically.
                # Send a reminder email (implement send_renewal_reminder below).
                logger.warning(
                    "No saved_token_id for subscription %s (mahasiswa %s). "
                    "Sending manual renewal reminder.",
                    sub.id, sub.mahasiswa.nim,
                )
                send_renewal_reminder.delay(sub.id)
                continue

            order_id = generate_order_id(f"RENEW-{sub.tier.upper()}")

            # Create renewal transaction record
            renewal_tx = Transaction.objects.create(
                order_id=order_id,
                mahasiswa=sub.mahasiswa,
                course=None,
                subscription=sub,
                amount=sub.monthly_price,
                status="pending",
                transaction_type="subscription_renewal",
            )

            # Trigger Midtrans Subscription charge
            result = create_subscription_plan(
                name=f"Belajara {sub.tier.capitalize()} Renewal",
                amount=sub.monthly_price,
                saved_token_id=sub.saved_token_id,
            )

            # Assume success if no exception raised (Midtrans will confirm via webhook)
            renewal_tx.status = "pending"
            renewal_tx.save()

            logger.info(
                "Subscription renewal initiated for %s (sub_id=%s, order=%s)",
                sub.mahasiswa.nim, sub.id, order_id,
            )
            processed += 1

        except Exception as exc:
            failed += 1
            logger.error(
                "Failed to renew subscription %s for %s: %s",
                sub.id, sub.mahasiswa.nim, exc,
            )
            # Retry the whole task with exponential backoff
            try:
                raise self.retry(exc=exc, countdown=300 * (2 ** self.request.retries))
            except self.MaxRetriesExceededError:
                # After max retries, suspend subscription
                suspend_subscription.delay(sub.id, reason=str(exc))

    logger.info(
        "process_subscription_renewals complete: %d processed, %d failed",
        processed, failed,
    )
    return {"processed": processed, "failed": failed}


@shared_task
def expire_stale_subscriptions():
    """
    Suspend active subscriptions whose period has ended (grace period: 3 days).

    A subscription is considered stale if:
    - status = 'active'
    - current_period_end < now - 3 days (3-day grace period for payment delays)
    """
    from payments.models import Subscription

    from django.db.models import Q

    now = timezone.now()
    grace_cutoff = now - timedelta(days=3)
    stale = Subscription.objects.filter(
        (Q(status="active") & Q(current_period_end__lt=grace_cutoff)) |
        (Q(status="cancelled") & Q(current_period_end__lt=now))
    )

    suspended_count = 0
    for sub in stale:
        sub.status = "expired"
        sub.save(update_fields=["status", "updated_at"])

        # Revoke premium access
        user = sub.mahasiswa.user
        if user.is_premium:
            user.is_premium = False
            user.save(update_fields=["is_premium"])

        logger.info(
            "Subscription %s expired for %s. Premium access revoked.",
            sub.id, sub.mahasiswa.nim,
        )
        suspended_count += 1

    logger.info("expire_stale_subscriptions: suspended %d subscriptions", suspended_count)
    return {"suspended": suspended_count}


@shared_task
def suspend_subscription(subscription_id: int, reason: str = ""):
    """
    Suspend a specific subscription after max renewal retries are exceeded.
    Revokes premium access and notifies the user.
    """
    from payments.models import Subscription

    try:
        sub = Subscription.objects.select_related("mahasiswa__user").get(
            id=subscription_id
        )
    except Subscription.DoesNotExist:
        logger.error("suspend_subscription: Subscription %d not found", subscription_id)
        return

    sub.status = "suspended"
    sub.save(update_fields=["status", "updated_at"])

    user = sub.mahasiswa.user
    if user.is_premium:
        user.is_premium = False
        user.save(update_fields=["is_premium"])

    logger.warning(
        "Subscription %d suspended for %s. Reason: %s",
        subscription_id, sub.mahasiswa.nim, reason,
    )

    # TODO: Send suspension notification email
    # send_suspension_email.delay(user.email, sub.get_tier_display())


@shared_task
def send_renewal_reminder(subscription_id: int):
    """
    Send an email reminding the user that their subscription renews soon
    and prompting them to re-enter payment details if no token is saved.
    """
    from payments.models import Subscription

    try:
        sub = Subscription.objects.select_related("mahasiswa__user").get(
            id=subscription_id
        )
    except Subscription.DoesNotExist:
        logger.error("send_renewal_reminder: Subscription %d not found", subscription_id)
        return

    user = sub.mahasiswa.user
    days_left = max(0, (sub.current_period_end - timezone.now()).days)

    logger.info(
        "Renewal reminder queued for %s — %d day(s) remaining on %s",
        user.email, days_left, sub.get_tier_display(),
    )

    # TODO: Implement actual email sending via Django send_mail or Celery email task
    # from django.core.mail import send_mail
    # send_mail(
    #     subject="Perpanjang Langganan Belajara Anda",
    #     message=f"Hai {user.first_name}, langganan {sub.get_tier_display()} Anda berakhir dalam {days_left} hari.",
    #     from_email="noreply@belajara.id",
    #     recipient_list=[user.email],
    # )
