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
    
    # If API key is not configured or is a placeholder
    if not api_key or api_key == "your-gemini-api-key" or api_key.strip() == "":
        questions = get_mock_questions(module)
        quiz = Quiz.objects.create(
            module=module,
            questions_json=questions,
            generated_by_ai=True
        )
        return quiz

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
        model = genai.GenerativeModel('gemini-1.5-flash')
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
        questions = get_mock_questions(module)

    quiz = Quiz.objects.create(
        module=module,
        questions_json=questions,
        generated_by_ai=True
    )
    return quiz

def get_mock_questions(module: CourseModule) -> list:
    """
    Returns 5 high-quality mock questions based on the module title and description.
    """
    title = module.title
    return [
        {
            "question": f"Apa konsep dasar yang paling penting dibahas dalam modul '{title}'?",
            "options": {
                "A": "Implementasi praktis dan studi kasus mendalam.",
                "B": "Definisi teori dasar dan pemahaman konseptual awal.",
                "C": "Penggunaan resource komputasi tingkat tinggi secara langsung.",
                "D": "Optimalisasi database relasional skala enterprise."
            },
            "correct_answer": "B",
            "explanation": "Sebagai tahap awal dalam modul pembelajaran, pemahaman konseptual awal dan definisi dasar adalah prioritas utama sebelum melangkah ke implementasi."
        },
        {
            "question": f"Berdasarkan deskripsi modul '{title}', manakah pernyataan berikut yang paling tepat?",
            "options": {
                "A": "Materi modul ini tidak membutuhkan pemahaman prasyarat sama sekali.",
                "B": "Tujuan utama modul adalah melatih kemampuan analitis mahasiswa di bidang terkait.",
                "C": "Modul ini ditujukan khusus untuk instruktur dan pengajar saja.",
                "D": "Seluruh materi dalam modul ini bersifat opsional bagi mahasiswa."
            },
            "correct_answer": "B",
            "explanation": "Setiap modul terstruktur dalam kurikulum Belajara dirancang untuk membangun dan melatih kompetensi serta kemampuan analitis mahasiswa."
        },
        {
            "question": f"Mengapa pemahaman terhadap '{title}' krusial dalam lingkup program studi ini?",
            "options": {
                "A": "Karena materi ini sering diuji dalam sertifikasi global.",
                "B": "Sebagai fondasi penting untuk memahami materi lanjutan di modul-modul berikutnya.",
                "C": "Karena materi ini hanya memiliki teori tanpa adanya praktik.",
                "D": "Untuk memenuhi syarat kelulusan administrasi saja."
            },
            "correct_answer": "B",
            "explanation": "Pembelajaran yang terstruktur membangun pengetahuan secara inkremental, sehingga modul awal menjadi fondasi yang krusial."
        },
        {
            "question": f"Manakah di bawah ini yang merupakan salah satu tantangan utama saat mempelajari '{title}'?",
            "options": {
                "A": "Menghubungkan teori akademis dengan penerapannya di dunia nyata.",
                "B": "Mengingat seluruh istilah tanpa memahami logikanya.",
                "C": "Kurangnya dokumentasi dan referensi belajar di internet.",
                "D": "Bahasa pemrograman yang digunakan sudah usang."
            },
            "correct_answer": "A",
            "explanation": "Tantangan terbesar e-learning adalah jembatan antara konsep akademis murni dengan aplikasi industri nyata."
        },
        {
            "question": f"Dalam modul '{title}', bagaimana cara terbaik untuk memverifikasi pemahaman kita?",
            "options": {
                "A": "Membaca modul berulang kali secara pasif.",
                "B": "Mengerjakan latihan soal kuis interaktif dan menganalisis penjelasannya.",
                "C": "Melewati modul ini langsung ke modul berikutnya.",
                "D": "Menunggu instruktur memberikan nilai akhir tanpa belajar."
            },
            "correct_answer": "B",
            "explanation": "Kuis interaktif berbasis AI memberikan umpan balik langsung untuk membantu mengevaluasi dan memperkuat pemahaman belajar mahasiswa."
        }
    ]
