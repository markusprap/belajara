import os
import json
import google.generativeai as genai
from courses.models import CourseModule
from quizzes.models import Quiz

def generate_quiz_for_module(module_id: int) -> Quiz:
    try:
        module = CourseModule.objects.get(pk=module_id)
    except CourseModule.DoesNotExist:
        raise ValueError("CourseModule tidak ditemukan.")

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "your-gemini-api-key" or api_key.strip() == "":
        raise ValueError("Kunci API Gemini tidak dikonfigurasi. Silakan atur GEMINI_API_KEY di lingkungan sistem.")

    prompt = f"""
Anda adalah pembuat soal kuis pendidikan profesional untuk platform e-learning Belajara di Indonesia.
Tugas Anda adalah membuat kuis pilihan ganda berisi 5 soal berdasarkan judul modul dan deskripsi modul berikut.

Judul Modul: {module.title}
Deskripsi Modul: {module.description}
Nama Kursus: {module.course.title}

Buatlah kuis pilihan ganda sebanyak 5 pertanyaan. Setiap pertanyaan harus memiliki 4 pilihan jawaban ('A', 'B', 'C', 'D'), kunci jawaban yang benar, dan penjelasan singkat mengapa jawaban tersebut benar.

Kembalikan respon hanya berupa JSON array of objects yang valid tanpa format tambahan seperti ```json ... ``` atau penjelasan lainnya. Struktur objek JSON harus seperti berikut:
[
  {{
    "question": "Pertanyaan kuis pertama...",
    "options": {{
      "A": "Pilihan A",
      "B": "Pilihan B",
      "C": "Pilihan C",
      "D": "Pilihan D"
    }},
    "correct_answer": "A",
    "explanation": "Penjelasan mengapa pilihan A benar."
  }}
]
"""

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-3.5-flash')
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean response string if it has markdown formatting
        if response_text.startswith("```"):
            lines = response_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            response_text = "\n".join(lines).strip()
            
        questions = json.loads(response_text)
        
        # Validate questions format
        if not isinstance(questions, list) or len(questions) == 0:
            raise ValueError("Invalid JSON format from AI")
            
        # Ensure keys are present
        for q in questions:
            if not all(k in q for k in ('question', 'options', 'correct_answer', 'explanation')):
                raise ValueError("Missing keys in AI response")
                
    except Exception as e:
        print(f"Error calling Gemini: {str(e)}")
        raise e

    quiz = Quiz.objects.create(
        module=module,
        questions_json=questions,
        generated_by_ai=True
    )
    return quiz
