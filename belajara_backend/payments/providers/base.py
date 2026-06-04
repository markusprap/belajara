"""
Payment Provider Abstraction Layer.

Defines the abstract base interface for all payment providers.
This ensures Midtrans can be swapped for Stripe (or other providers)
in the future without touching business logic in views/services.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class SnapTransactionResult:
    """Result from creating a Snap payment transaction."""
    snap_token: str
    redirect_url: str
    order_id: str
    is_mock: bool = False


@dataclass
class SubscriptionResult:
    """Result from creating a recurring subscription."""
    subscription_id: str
    status: str
    is_mock: bool = False


class PaymentProvider(ABC):
    """
    Abstract base class for payment providers.
    All providers must implement this interface.
    """

    @abstractmethod
    def create_snap_transaction(
        self,
        order_id: str,
        gross_amount: int,
        customer_details: dict,
        item_details: Optional[list] = None,
    ) -> SnapTransactionResult:
        """
        Initialize a checkout session (Snap popup / redirect).
        Returns a token and redirect URL for the frontend.
        """
        ...

    @abstractmethod
    def create_subscription(
        self,
        name: str,
        amount: int,
        saved_token_id: str,
        interval: int = 1,
        interval_unit: str = 'month',
        max_interval: Optional[int] = None,
    ) -> SubscriptionResult:
        """
        Create a recurring subscription charge using a saved payment token.
        Requires Midtrans Subscription API approval.
        """
        ...

    @abstractmethod
    def verify_webhook_signature(
        self,
        order_id: str,
        status_code: str,
        gross_amount: str,
        signature_key: str,
        server_key: str,
    ) -> bool:
        """
        Verify that a webhook notification came from the real provider.
        Returns True if valid, False if tampered/invalid.
        """
        ...

    @abstractmethod
    def is_success_status(self, transaction_status: str, fraud_status: Optional[str]) -> bool:
        """
        Returns True if the given transaction status indicates a successful payment.
        """
        ...
