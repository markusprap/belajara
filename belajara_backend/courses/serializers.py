from rest_framework import serializers
from .models import Course, CourseModule

class CourseModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseModule
        fields = ['id', 'title', 'description', 'order']

class CourseSerializer(serializers.ModelSerializer):
    modules = CourseModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'code', 'title', 'description', 'sks', 'semester', 'department', 'modules']
