from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from courses.models import Course
from discussions.models import DiscussionPost
from discussions.serializers import DiscussionPostSerializer

class CourseDiscussionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response({"detail": "Mata kuliah tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        # Get only top-level posts (parent is None)
        posts = DiscussionPost.objects.filter(course=course, parent=None)
        serializer = DiscussionPostSerializer(posts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, course_id):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response({"detail": "Mata kuliah tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        serializer = DiscussionPostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, course=course, parent=None)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DiscussionRepliesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        try:
            parent_post = DiscussionPost.objects.get(pk=post_id)
        except DiscussionPost.DoesNotExist:
            return Response({"detail": "Diskusi utama tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        replies = DiscussionPost.objects.filter(parent=parent_post)
        serializer = DiscussionPostSerializer(replies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, post_id):
        try:
            parent_post = DiscussionPost.objects.get(pk=post_id)
        except DiscussionPost.DoesNotExist:
            return Response({"detail": "Diskusi utama tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        serializer = DiscussionPostSerializer(data=request.data)
        if serializer.is_valid():
            # Reply inherits the course of its parent post
            serializer.save(user=request.user, course=parent_post.course, parent=parent_post)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
