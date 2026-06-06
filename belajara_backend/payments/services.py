"""
Payment Service Facade.

High-level interface used by views. Hides provider specifics behind
a clean API. Currently delegates to MidtransProvider; swap by
changing get_payment_provider().
"""
import logging
import random
import time
from typing import Optional

from payments.providers.base import SnapTransactionResult, SubscriptionResult
from payments.providers.midtrans import MidtransProvider

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Provider factory — swap provider here without touching views/models
# ---------------------------------------------------------------------------

def get_payment_provider() -> MidtransProvider:
    """Return the active payment provider instance."""
    return MidtransProvider()


# ---------------------------------------------------------------------------
# Public service functions (called from views)
# ---------------------------------------------------------------------------

def create_snap_transaction(
    order_id: str,
    gross_amount: int,
    customer_details: dict,
    item_details: Optional[list] = None,
) -> tuple[str, str]:
    """
    Initialise a Midtrans Snap checkout session.

    Returns:
        (snap_token, redirect_url) — both strings.
    """
    provider = get_payment_provider()
    result: SnapTransactionResult = provider.create_snap_transaction(
        order_id=order_id,
        gross_amount=gross_amount,
        customer_details=customer_details,
        item_details=item_details,
    )
    return result.snap_token, result.redirect_url


def create_subscription_plan(
    name: str,
    amount: int,
    saved_token_id: str,
    interval: int = 1,
    interval_unit: str = "month",
    max_interval: Optional[int] = None,
) -> SubscriptionResult:
    """
    Create a Midtrans recurring subscription.
    Requires the merchant to have Subscription API enabled.

    Returns:
        SubscriptionResult with subscription_id and status.
    """
    provider = get_payment_provider()
    return provider.create_subscription(
        name=name,
        amount=amount,
        saved_token_id=saved_token_id,
        interval=interval,
        interval_unit=interval_unit,
        max_interval=max_interval,
    )


def verify_webhook_signature(
    order_id: str,
    status_code: str,
    gross_amount: str,
    signature_key: str,
) -> bool:
    """
    Verify Midtrans webhook SHA512 signature.
    """
    import os
    server_key = os.environ.get("MIDTRANS_SERVER_KEY", "")
    provider = get_payment_provider()
    return provider.verify_webhook_signature(
        order_id=order_id,
        status_code=status_code,
        gross_amount=gross_amount,
        signature_key=signature_key,
        server_key=server_key,
    )


def is_payment_successful(transaction_status: str, fraud_status: Optional[str] = None) -> bool:
    """
    Returns True if a Midtrans transaction status represents a successful payment.
    """
    provider = get_payment_provider()
    return provider.is_success_status(transaction_status, fraud_status)


def check_transaction_status(order_id: str) -> dict:
    """
    Query provider directly to check the current payment status of an order.
    """
    provider = get_payment_provider()
    if hasattr(provider, "get_transaction_status"):
        return provider.get_transaction_status(order_id)
    return {}


def generate_order_id(prefix: str = "BLJR") -> str:
    """
    Generate a unique order ID for a transaction.
    Format: BLJR-{PREFIX}-{TIMESTAMP}-{RAND}
    """
    timestamp = int(time.time())
    rand_num = random.randint(1000, 9999)
    return f"{prefix}-{timestamp}-{rand_num}"
