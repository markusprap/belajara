from rest_framework import serializers
from quizzes.models import Quiz, QuizSubmission

class QuizQuestionsStudentField(serializers.Field):
    """
    Custom field to strip correct answers and explanations when presenting the questions to students.
    """
    def to_representation(self, value):
        if not isinstance(value, list):
            return []
        cleaned_questions = []
        for q in value:
            cleaned_q = {
                'question': q.get('question'),
                'options': q.get('options')
            }
            cleaned_questions.append(cleaned_q)
        return cleaned_questions

class QuizStudentSerializer(serializers.ModelSerializer):
    questions = QuizQuestionsStudentField(source='questions_json')
    time_limit = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ('id', 'module', 'questions', 'generated_by_ai', 'time_limit', 'created_at')

    def get_time_limit(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated and request.user.is_premium:
            return 900  # 15 minutes for premium / competency exams
        return 600  # 10 minutes standard duration for free users

class QuizSerializer(serializers.ModelSerializer):
    time_limit = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ('id', 'module', 'questions_json', 'generated_by_ai', 'time_limit', 'created_at')

    def get_time_limit(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated and request.user.is_premium:
            return 900
        return 600

class QuizSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizSubmission
        fields = ('id', 'mahasiswa', 'quiz', 'answers_json', 'score', 'passed', 'graded_at')
        read_only_fields = ('mahasiswa', 'quiz', 'score', 'passed', 'graded_at')
