from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from courses.models import CourseModule
from quizzes.models import Quiz, QuizSubmission
from quizzes.serializers import QuizSerializer, QuizStudentSerializer, QuizSubmissionSerializer
from quizzes.services import generate_quiz_for_module
from users.selectors import get_mahasiswa_by_user

class QuizGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, module_id):
        try:
            quiz = generate_quiz_for_module(module_id)
            serializer = QuizSerializer(quiz)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as ve:
            return Response({"detail": str(ve)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": f"Gagal membuat kuis: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QuizDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(pk=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"detail": "Quiz tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve student profile. If they are an instructor, they can see the full keys.
        is_instructor = not getattr(request.user, 'is_mahasiswa', False)
        if is_instructor:
            serializer = QuizSerializer(quiz)
        else:
            serializer = QuizStudentSerializer(quiz)
        return Response(serializer.data, status=status.HTTP_200_OK)

class QuizSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(pk=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"detail": "Quiz tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        try:
            mahasiswa = get_mahasiswa_by_user(user=request.user)
        except Exception:
            return Response({"detail": "Hanya mahasiswa yang dapat mengumpulkan kuis."}, status=status.HTTP_403_FORBIDDEN)

        answers = request.data.get('answers', {})
        if not isinstance(answers, dict):
            return Response({"detail": "Format jawaban salah. Harus berupa object JSON."}, status=status.HTTP_400_BAD_REQUEST)

        questions = quiz.questions_json
        total_questions = len(questions)
        if total_questions == 0:
            return Response({"detail": "Kuis tidak memiliki pertanyaan."}, status=status.HTTP_400_BAD_REQUEST)

        correct_count = 0
        details = []

        for idx, q in enumerate(questions):
            student_ans = answers.get(str(idx)) or answers.get(idx)  # handle string or integer key
            correct_ans = q.get('correct_answer')
            is_correct = (student_ans == correct_ans)
            if is_correct:
                correct_count += 1
            
            details.append({
                "question_index": idx,
                "question": q.get('question'),
                "chosen_answer": student_ans,
                "correct_answer": correct_ans,
                "is_correct": is_correct,
                "explanation": q.get('explanation')
            })

        score = (correct_count / total_questions) * 100.0
        passed = (score >= 60.0)

        submission = QuizSubmission.objects.create(
            mahasiswa=mahasiswa,
            quiz=quiz,
            answers_json=answers,
            score=score,
            passed=passed
        )

        return Response({
            "submission_id": submission.id,
            "score": score,
            "passed": passed,
            "correct_count": correct_count,
            "total_questions": total_questions,
            "details": details
        }, status=status.HTTP_200_OK)

class QuizSubmissionsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(pk=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"detail": "Quiz tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        # Check if student vs instructor
        if getattr(request.user, 'is_mahasiswa', False):
            try:
                mahasiswa = get_mahasiswa_by_user(user=request.user)
                submissions = QuizSubmission.objects.filter(quiz=quiz, mahasiswa=mahasiswa)
            except Exception:
                submissions = QuizSubmission.objects.none()
        else:
            submissions = QuizSubmission.objects.filter(quiz=quiz)

        serializer = QuizSubmissionSerializer(submissions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
