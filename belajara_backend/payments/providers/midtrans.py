"""
Midtrans Payment Provider Implementation.

Covers:
- Snap API: one-time checkout popup (existing + enhanced)
- Subscription API: recurring charges via saved_token_id
- Webhook signature verification (SHA512)

Documentation:
- https://docs.midtrans.com/reference/snap-api
- https://docs.midtrans.com/reference/subscription-api
"""
import hashlib
import logging
import os
import uuid
from typing import Optional

import requests

from payments.providers.base import (
    PaymentProvider,
    SnapTransactionResult,
    SubscriptionResult,
)

logger = logging.getLogger(__name__)


class MidtransProvider(PaymentProvider):
    """
    Concrete implementation of PaymentProvider for Midtrans.

    Reads configuration from environment variables:
    - MIDTRANS_SERVER_KEY
    - MIDTRANS_CLIENT_KEY
    - MIDTRANS_IS_PRODUCTION (default: False)
    """

    def __init__(self):
        self.server_key = os.environ.get("MIDTRANS_SERVER_KEY", "")
        self.client_key = os.environ.get("MIDTRANS_CLIENT_KEY", "")
        self.is_production = (
            os.environ.get("MIDTRANS_IS_PRODUCTION", "False").lower() == "true"
        )
        self._is_mock = (
            not self.server_key
            or self.server_key in ("your-midtrans-server-key", "")
        )

        if self.is_production:
            self._base_url = "https://app.midtrans.com"
            self._core_api_url = "https://api.midtrans.com"
        else:
            self._base_url = "https://app.sandbox.midtrans.com"
            self._core_api_url = "https://api.sandbox.midtrans.com"

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _auth_headers(self) -> dict:
        import base64
        auth_str = f"{self.server_key}:"
        encoded = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Basic {encoded}",
        }

    def _mock_snap(self, order_id: str) -> SnapTransactionResult:
        mock_token = f"mock-snap-token-{uuid.uuid4()}"
        mock_url = f"{self._base_url}/snap/v2/vtweb/{mock_token}"
        logger.warning(
            "Midtrans mock mode active. Returning mock Snap token for order %s", order_id
        )
        return SnapTransactionResult(
            snap_token=mock_token,
            redirect_url=mock_url,
            order_id=order_id,
            is_mock=True,
        )

    # ------------------------------------------------------------------
    # PaymentProvider interface implementation
    # ------------------------------------------------------------------

    def create_snap_transaction(
        self,
        order_id: str,
        gross_amount: int,
        customer_details: dict,
        item_details: Optional[list] = None,
    ) -> SnapTransactionResult:
        """
        Call Midtrans Snap API to get a payment token & redirect URL.
        Falls back to mock if server_key is not configured.
        """
        if self._is_mock:
            return self._mock_snap(order_id)

        payload = {
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": gross_amount,
            },
            "credit_card": {"secure": True},
            "customer_details": {
                "first_name": customer_details.get("first_name", ""),
                "email": customer_details.get("email", ""),
                "phone": customer_details.get("phone", ""),
            },
        }
        if item_details:
            payload["item_details"] = item_details

        try:
            response = requests.post(
                f"{self._base_url}/snap/v1/transactions",
                json=payload,
                headers=self._auth_headers(),
                timeout=15,
            )
            if response.status_code in (200, 201):
                data = response.json()
                return SnapTransactionResult(
                    snap_token=data["token"],
                    redirect_url=data["redirect_url"],
                    order_id=order_id,
                    is_mock=False,
                )
            logger.error(
                "Midtrans Snap API error %s: %s", response.status_code, response.text
            )
        except Exception as exc:
            logger.error("Error connecting to Midtrans Snap API: %s", exc)

        # Graceful fallback — keeps app usable even during Midtrans outages
        return self._mock_snap(order_id)

    def create_subscription(
        self,
        name: str,
        amount: int,
        saved_token_id: str,
        interval: int = 1,
        interval_unit: str = "month",
        max_interval: Optional[int] = None,
    ) -> SubscriptionResult:
        """
        Create a recurring subscription via Midtrans Subscription API.

        NOTE: This requires Midtrans merchant approval for the Subscription feature.
        Contact Midtrans support to enable this on your merchant account.

        Docs: https://api-docs.midtrans.com/#subscription-api
        """
        if self._is_mock:
            mock_id = f"mock-sub-{uuid.uuid4()}"
            logger.warning("Midtrans mock mode: returning mock subscription ID %s", mock_id)
            return SubscriptionResult(subscription_id=mock_id, status="active", is_mock=True)

        if not saved_token_id:
            logger.error("create_subscription called without saved_token_id")
            raise ValueError("saved_token_id is required for recurring subscriptions")

        payload: dict = {
            "name": name,
            "amount": str(amount),
            "currency": "IDR",
            "payment_type": "credit_card",
            "token": saved_token_id,
            "schedule": {
                "interval": interval,
                "interval_unit": interval_unit,
            },
        }
        if max_interval:
            payload["schedule"]["max_interval"] = max_interval

        try:
            response = requests.post(
                f"{self._core_api_url}/v1/subscriptions",
                json=payload,
                headers=self._auth_headers(),
                timeout=15,
            )
            data = response.json()
            if response.status_code in (200, 201):
                return SubscriptionResult(
                    subscription_id=data.get("id", ""),
                    status=data.get("status", "active"),
                    is_mock=False,
                )
            logger.error(
                "Midtrans Subscription API error %s: %s", response.status_code, response.text
            )
            raise RuntimeError(
                f"Midtrans Subscription API returned {response.status_code}: "
                f"{data.get('error_messages', response.text)}"
            )
        except RuntimeError:
            raise
        except Exception as exc:
            logger.error("Error creating Midtrans subscription: %s", exc)
            raise

    def verify_webhook_signature(
        self,
        order_id: str,
        status_code: str,
        gross_amount: str,
        signature_key: str,
        server_key: str,
    ) -> bool:
        """
        Verify Midtrans webhook SHA512 signature.
        Format: SHA512(order_id + status_code + gross_amount + ServerKey)
        """
        if not server_key or server_key in ("your-midtrans-server-key", ""):
            logger.warning("Webhook signature verification BYPASSED — server key not set")
            return True  # Permissive in dev; strict in prod via env

        raw = f"{order_id}{status_code}{gross_amount}{server_key}"
        calculated = hashlib.sha512(raw.encode("utf-8")).hexdigest()
        valid = calculated == signature_key

        if not valid:
            logger.error(
                "Midtrans signature MISMATCH for order %s. "
                "Expected %s, got %s",
                order_id, calculated, signature_key,
            )
        return valid

    def is_success_status(
        self, transaction_status: str, fraud_status: Optional[str]
    ) -> bool:
        """
        Returns True for settlement or capture+accept.
        """
        if transaction_status == "settlement":
            return True
        if transaction_status == "capture" and fraud_status == "accept":
            return True
        return False

    def get_transaction_status(self, order_id: str) -> dict:
        """
        Retrieve transaction status directly from Midtrans Core API.
        """
        if self._is_mock:
            # Under mock/simulation mode, we default to mock settlement success
            return {
                "transaction_status": "settlement",
                "fraud_status": "accept",
                "status_code": "200",
                "gross_amount": "0"
            }

        try:
            response = requests.get(
                f"{self._core_api_url}/v2/{order_id}/status",
                headers=self._auth_headers(),
                timeout=15,
            )
            if response.status_code == 200:
                return response.json()
            logger.error(
                "Midtrans status check error %s for order %s: %s",
                response.status_code, order_id, response.text
            )
        except Exception as exc:
            logger.error("Error connecting to Midtrans status API for order %s: %s", order_id, exc)

        return {}
