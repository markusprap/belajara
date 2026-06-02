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

    class Meta:
        model = Quiz
        fields = ('id', 'module', 'questions', 'generated_by_ai', 'created_at')

class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ('id', 'module', 'questions_json', 'generated_by_ai', 'created_at')

class QuizSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizSubmission
        fields = ('id', 'mahasiswa', 'quiz', 'answers_json', 'score', 'passed', 'graded_at')
        read_only_fields = ('mahasiswa', 'quiz', 'score', 'passed', 'graded_at')
