import os
import base64
import requests
import uuid

def get_midtrans_headers(server_key: str) -> dict:
    auth_str = f"{server_key}:"
    encoded_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
    return {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Basic {encoded_auth}"
    }

def create_snap_transaction(order_id: str, gross_amount: int, customer_details: dict) -> tuple[str, str]:
    """
    Calls the Midtrans Snap API to initialize a transaction.
    Returns (snap_token, redirect_url).
    Falls back to mock transaction if keys are placeholder.
    """
    server_key = os.environ.get("MIDTRANS_SERVER_KEY", "")
    is_production = os.environ.get("MIDTRANS_IS_PRODUCTION", "False").lower() == "true"
    
    # Check if key is placeholder or empty
    if not server_key or server_key == "your-midtrans-server-key" or server_key.strip() == "":
        # Mock mode
        mock_token = f"mock-snap-token-{uuid.uuid4()}"
        mock_url = f"https://app.sandbox.midtrans.com/snap/v2/vtweb/{mock_token}"
        return mock_token, mock_url

    base_url = "https://app.midtrans.com" if is_production else "https://app.sandbox.midtrans.com"
    snap_endpoint = f"{base_url}/snap/v1/transactions"

    payload = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": int(gross_amount)
        },
        "credit_card": {
            "secure": True
        },
        "customer_details": {
            "first_name": customer_details.get("first_name", ""),
            "email": customer_details.get("email", "")
        }
    }

    try:
        headers = get_midtrans_headers(server_key)
        response = requests.post(snap_endpoint, json=payload, headers=headers, timeout=10)
        
        if response.status_code in (200, 201):
            data = response.json()
            return data.get("token"), data.get("redirect_url")
        else:
            print(f"Midtrans API Error: {response.status_code} - {response.text}")
            # Fallback to mock on error to keep app robust
            mock_token = f"mock-snap-token-{uuid.uuid4()}"
            mock_url = f"https://app.sandbox.midtrans.com/snap/v2/vtweb/{mock_token}"
            return mock_token, mock_url
    except Exception as e:
        print(f"Error connecting to Midtrans: {str(e)}")
        mock_token = f"mock-snap-token-{uuid.uuid4()}"
        mock_url = f"https://app.sandbox.midtrans.com/snap/v2/vtweb/{mock_token}"
        return mock_token, mock_url
