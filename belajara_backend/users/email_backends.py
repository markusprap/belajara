import os
import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

class ResendHTTPBackend(BaseEmailBackend):
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = getattr(settings, 'RESEND_API_KEY', None) or os.environ.get('RESEND_API_KEY')
        self.api_url = "https://api.resend.com/emails"

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        if not self.api_key:
            if not self.fail_silently:
                raise ValueError("RESEND_API_KEY must be set in settings or environment variables.")
            return 0

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        num_sent = 0
        for message in email_messages:
            try:
                # Handle recipients
                to_emails = message.to
                if isinstance(to_emails, str):
                    to_emails = [to_emails]

                # Check for HTML content in alternatives
                html_content = None
                if hasattr(message, 'alternatives'):
                    for alternative in message.alternatives:
                        if len(alternative) >= 2 and alternative[1] == 'text/html':
                            html_content = alternative[0]
                            break

                payload = {
                    "from": message.from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'onboarding@resend.dev'),
                    "to": to_emails,
                    "subject": message.subject,
                }

                if html_content:
                    payload["html"] = html_content
                    if message.body:
                        payload["text"] = message.body
                else:
                    payload["text"] = message.body

                if message.cc:
                    payload["cc"] = message.cc
                if message.bcc:
                    payload["bcc"] = message.bcc
                if message.reply_to:
                    payload["reply_to"] = message.reply_to

                response = requests.post(self.api_url, json=payload, headers=headers)
                if response.status_code in (200, 201):
                    num_sent += 1
                else:
                    if not self.fail_silently:
                        response.raise_for_status()
            except Exception as e:
                if not self.fail_silently:
                    raise e
        return num_sent
