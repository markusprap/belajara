import hashlib
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction as db_transaction
from courses.models import Course
from users.selectors import get_mahasiswa_by_user
from payments.models import Transaction
from payments.serializers import CheckoutSerializer, TransactionSerializer
from payments.services import create_snap_transaction

class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        course_id = serializer.validated_data['course_id']
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response({"detail": "Mata kuliah tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        try:
            mahasiswa = get_mahasiswa_by_user(user=request.user)
        except Exception:
            return Response({"detail": "Hanya mahasiswa yang dapat melakukan pembelian."}, status=status.HTTP_403_FORBIDDEN)

        # Check if already enrolled
        if mahasiswa.active_courses.filter(id=course.id).exists():
            return Response({"detail": "Anda sudah terdaftar di mata kuliah ini."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if a pending transaction already exists
        existing_tx = Transaction.objects.filter(mahasiswa=mahasiswa, course=course, status='pending').first()
        if existing_tx:
            tx_serializer = TransactionSerializer(existing_tx)
            return Response(tx_serializer.data, status=status.HTTP_200_OK)

        # Check if the course is free
        price = getattr(course, 'price', 0.0)
        is_premium = getattr(course, 'is_premium', False)
        if not is_premium or price <= 0:
            return Response({"detail": "Mata kuliah ini gratis. Silakan mendaftar langsung."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate a unique order_id
        import time
        import random
        timestamp = int(time.time())
        rand_num = random.randint(1000, 9999)
        order_id = f"BLJR-{course.code}-{mahasiswa.nim}-{timestamp}-{rand_num}"

        # Setup customer details for Midtrans
        customer_details = {
            "first_name": request.user.first_name or request.user.username,
            "email": request.user.email
        }

        # Initialize Snap transaction
        snap_token, snap_url = create_snap_transaction(
            order_id=order_id,
            gross_amount=int(price),
            customer_details=customer_details
        )

        # Create Transaction record
        tx = Transaction.objects.create(
            order_id=order_id,
            mahasiswa=mahasiswa,
            course=course,
            amount=price,
            snap_token=snap_token,
            snap_url=snap_url,
            status='pending'
        )

        tx_serializer = TransactionSerializer(tx)
        return Response(tx_serializer.data, status=status.HTTP_201_CREATED)

class MidtransWebhookView(APIView):
    permission_classes = [AllowAny]  # Midtrans calls this webhook directly

    def post(self, request):
        data = request.data
        order_id = data.get('order_id')
        transaction_status = data.get('transaction_status')
        fraud_status = data.get('fraud_status')
        signature_key = data.get('signature_key')
        status_code = data.get('status_code')
        gross_amount = data.get('gross_amount')

        if not order_id or not transaction_status:
            return Response({"detail": "Data tidak lengkap."}, status=status.HTTP_400_BAD_REQUEST)

        # Signature validation
        server_key = os.environ.get("MIDTRANS_SERVER_KEY", "")
        if server_key and server_key != "your-midtrans-server-key" and signature_key:
            input_str = f"{order_id}{status_code}{gross_amount}{server_key}"
            calculated_signature = hashlib.sha512(input_str.encode('utf-8')).hexdigest()
            if calculated_signature != signature_key:
                print(f"Signature mismatch! Calculated: {calculated_signature}, Received: {signature_key}")
                return Response({"detail": "Tanda tangan tidak valid."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tx = Transaction.objects.get(order_id=order_id)
        except Transaction.DoesNotExist:
            return Response({"detail": "Transaksi tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        # Handle status logic
        success_statuses = ['settlement']
        if transaction_status == 'capture':
            if fraud_status == 'accept':
                success_statuses.append('capture')

        with db_transaction.atomic():
            if transaction_status in success_statuses:
                tx.status = 'success'
                # Enroll student
                mahasiswa = tx.mahasiswa
                mahasiswa.active_courses.add(tx.course)
                mahasiswa.save()
            elif transaction_status in ['deny', 'cancel', 'expire', 'failure']:
                tx.status = 'failed'
            else:
                tx.status = transaction_status
            
            tx.save()

        return Response({"status": "ok", "transaction_status": tx.status}, status=status.HTTP_200_OK)
