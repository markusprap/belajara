from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.dashboard_service import get_student_dashboard_data

class StudentDashboardView(APIView):
    permission_classes = []  # Allow open access for ease of integration

    def get(self, request):
        try:
            data = get_student_dashboard_data(request.user)
            return Response(data, status=status.HTTP_200_OK)
        except ValueError as ve:
            return Response({"detail": str(ve)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": f"Terjadi kesalahan internal: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
