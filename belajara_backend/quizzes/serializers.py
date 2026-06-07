from rest_framework import serializers
from quizzes.models import Quiz, QuizSubmission

class QuizQuestionsStudentField(serializers.Field):
    """
    Custom field to strip correct answers and explanations when presenting the questions to students.
    Transforms data to match frontend expectation: { id, text, options: [{id, text}] }
    """
    def to_representation(self, value):
        if not isinstance(value, list):
            return []
        cleaned_questions = []
        for idx, q in enumerate(value):
            # Transform options from {'A': '...', 'B': '...'} to [{'id': 'A', 'text': '...'}]
            options_dict = q.get('options', {})
            formatted_options = [
                {'id': k, 'text': v} for k, v in options_dict.items()
            ]
            
            cleaned_q = {
                'id': str(idx),
                'text': q.get('question'),
                'options': formatted_options
            }
            cleaned_questions.append(cleaned_q)
        return cleaned_questions

class QuizStudentSerializer(serializers.ModelSerializer):
    questions = QuizQuestionsStudentField(source='questions_json')
    title = serializers.SerializerMethodField()
    time_limit = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ('id', 'module', 'title', 'questions', 'generated_by_ai', 'time_limit', 'created_at')

    def get_title(self, obj):
        return f"Evaluasi: {obj.module.title}"

    def get_time_limit(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated and request.user.is_premium:
            return 900  # 15 minutes for premium / competency exams
        return 600  # 10 minutes standard duration for free users

class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionsStudentField(source='questions_json') # Keep consistent with student view for UI compatibility
    title = serializers.SerializerMethodField()
    time_limit = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ('id', 'module', 'title', 'questions', 'questions_json', 'generated_by_ai', 'time_limit', 'created_at')

    def get_title(self, obj):
        return f"Evaluasi: {obj.module.title}"

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
