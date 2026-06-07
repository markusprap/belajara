from django.core.management.base import BaseCommand
from courses.models import Course, CourseModule

class Command(BaseCommand):
    help = 'Seeds initial course and module data for Belajara'

    def handle(self, *args, **options):
        # List of courses to seed
        courses_data = [
            {
                "code": "IF101",
                "title": "Algoritma & Struktur Data",
                "description": "Mempelajari konsep algoritma efisien dan struktur data dasar seperti array, linked list, stack, queue, tree, dan graph.",
                "sks": 3,
                "semester": 2,
                "department": "Informatika",
                "modules": [
                    {"title": "Pendahuluan & Konsep Array", "description": "Pengenalan kompleksitas algoritma (Big O) dan operasi array.", "order": 1},
                    {"title": "Linked List", "description": "Implementasi Single, Double, dan Circular Linked List.", "order": 2},
                    {"title": "Stack & Queue", "description": "Struktur data LIFO dan FIFO beserta aplikasinya.", "order": 3},
                    {"title": "Tree & Graph", "description": "Representasi pohon biner, traversal tree, dan algoritma graph.", "order": 4},
                    {"title": "Sorting & Searching", "description": "Algoritma pengurutan (bubble, quick, merge) dan pencarian (linear, binary).", "order": 5}
                ]
            },
            {
                "code": "IF201",
                "title": "Basis Data",
                "description": "Pembelajaran mengenai pemodelan data relasional, ER-Diagram, SQL, normalisasi, dan manajemen transaksi.",
                "sks": 4,
                "semester": 3,
                "department": "Informatika",
                "modules": [
                    {"title": "Pengenalan Basis Data & ERD", "description": "Konsep sistem database dan Entity-Relationship Diagram.", "order": 1},
                    {"title": "Relational Model & SQL DDL", "description": "Membuat tabel dan relasi menggunakan DDL.", "order": 2},
                    {"title": "SQL DML & Join Operations", "description": "Query kompleks menggunakan SELECT, WHERE, GROUP BY, dan JOIN.", "order": 3},
                    {"title": "Normalisasi Basis Data", "description": "Proses normalisasi data 1NF, 2NF, dan 3NF.", "order": 4},
                    {"title": "Transaksi & Concurrency Control", "description": "Konsep ACID, locking, dan concurrency control.", "order": 5}
                ]
            },
            {
                "code": "IF202",
                "title": "Pemrograman Berorientasi Objek",
                "description": "Fokus pada paradigma OOP menggunakan bahasa Java/Python, meliputi enkapsulasi, pewarisan, polimorfisme, dan interface.",
                "sks": 3,
                "semester": 3,
                "department": "Informatika",
                "modules": [
                    {"title": "Class, Object, & Encapsulation", "description": "Membuat kelas, instansiasi objek, dan access modifiers.", "order": 1},
                    {"title": "Inheritance & Polymorphism", "description": "Konsep pewarisan kelas dan dynamic dispatch.", "order": 2},
                    {"title": "Abstraction & Interface", "description": "Penggunaan abstract class dan interface.", "order": 3},
                    {"title": "Exception Handling", "description": "Menangani error runtime dengan try-catch.", "order": 4},
                    {"title": "Design Patterns", "description": "Pengenalan Singleton, Factory, dan Observer pattern.", "order": 5}
                ]
            },
            {
                "code": "IF301",
                "title": "Rekayasa Perangkat Lunak",
                "description": "Metodologi pengembangan sistem software mulai dari analisis kebutuhan, perancangan, implementasi, hingga pengujian.",
                "sks": 3,
                "semester": 4,
                "department": "Informatika",
                "modules": [
                    {"title": "Software Development Life Cycle (SDLC)", "description": "Pengenalan model Waterfall, Agile, dan Spiral.", "order": 1},
                    {"title": "Requirements Engineering", "description": "Analisis kebutuhan fungsional dan non-fungsional.", "order": 2},
                    {"title": "Software Design & Architecture", "description": "UML Diagram dan arsitektur MVC/Clean.", "order": 3},
                    {"title": "Testing & Quality Assurance", "description": "Konsep White Box, Black Box, dan Unit Testing.", "order": 4},
                    {"title": "Agile & Scrum Methodology", "description": "Praktek Scrum, sprint planning, dan daily standup.", "order": 5}
                ]
            },
            {
                "code": "IF302",
                "title": "Pemrograman Web",
                "description": "Membangun aplikasi web interaktif responsif dari frontend hingga backend menggunakan Javascript modern.",
                "sks": 3,
                "semester": 4,
                "department": "Informatika",
                "modules": [
                    {"title": "HTML5, CSS3, & Responsive Design", "description": "Struktur dokumen web dan styling responsif.", "order": 1},
                    {"title": "JavaScript Modern (ES6+)", "description": "Konsep asynchronous, fetch API, dan DOM manipulation.", "order": 2},
                    {"title": "Node.js & Express", "description": "Membangun REST API backend dengan Express.", "order": 3},
                    {"title": "Frontend Frameworks (React/Next.js)", "description": "State management, React Hooks, dan routing.", "order": 4},
                    {"title": "Web Security & Deployment", "description": "Autentikasi JWT, CORS, dan deployment web.", "order": 5}
                ]
            },
            {
                "code": "IF401",
                "title": "Kecerdasan Buatan",
                "description": "Pengenalan konsep kecerdasan buatan, algoritma pencarian, logika, representasi pengetahuan, dan dasar pembelajaran mesin.",
                "sks": 3,
                "semester": 5,
                "department": "Informatika",
                "modules": [
                    {"title": "Pengenalan AI & Agen Cerdas", "description": "Definisi AI dan arsitektur agen cerdas.", "order": 1},
                    {"title": "Search Algorithms (BFS, DFS, A*)", "description": "Pencarian heuristik dan uninformed search.", "order": 2},
                    {"title": "Knowledge Representation & Logic", "description": "Logika proposisional dan first-order logic.", "order": 3},
                    {"title": "Pengenalan Machine Learning", "description": "Konsep supervised, unsupervised, dan reinforcement learning.", "order": 4},
                    {"title": "Deep Learning & Neural Networks", "description": "Pengenalan perseptron dan arsitektur saraf tiruan.", "order": 5}
                ]
            },
            {
                "code": "IF402",
                "title": "Pembelajaran Mesin",
                "description": "Fokus mendalam pada algoritma machine learning, pemodelan data, training, evaluasi, dan aplikasinya pada data nyata.",
                "sks": 3,
                "semester": 6,
                "department": "Informatika",
                "modules": [
                    {"title": "Pengenalan ML & Preprocessing", "description": "Pembersihan data, scaling, dan split dataset.", "order": 1},
                    {"title": "Regresi Linier & Logistik", "description": "Model regresi untuk prediksi numerik dan klasifikasi.", "order": 2},
                    {"title": "Decision Trees & Random Forests", "description": "Konsep entropy, information gain, dan ensemble learning.", "order": 3},
                    {"title": "Support Vector Machines & KNN", "description": "Algoritma klasifikasi berbasis margin dan kedekatan tetangga.", "order": 4},
                    {"title": "Clustering (K-Means)", "description": "Algoritma pembelajaran tanpa pengawasan untuk segmentasi data.", "order": 5}
                ]
            },
            {
                "code": "SI101",
                "title": "Pengantar Sistem Informasi",
                "description": "Mempelajari konsep dasar sistem informasi, peran TI dalam bisnis, dan e-commerce.",
                "sks": 3,
                "semester": 1,
                "department": "Sistem Informasi",
                "modules": [
                    {"title": "Konsep Dasar Sistem Informasi", "description": "Pengenalan hardware, software, database, dan telekomunikasi.", "order": 1},
                    {"title": "Sistem Informasi dalam Organisasi", "description": "Bagaimana TI mendukung proses bisnis dan strategi bersaing.", "order": 2},
                    {"title": "E-Commerce & Digital Market", "description": "Model bisnis digital dan teknologi e-commerce.", "order": 3}
                ]
            },
            {
                "code": "SI201",
                "title": "Analisis & Perancangan Sistem Informasi",
                "description": "Metodologi analisis kebutuhan sistem, pemodelan UML, rancangan database, dan user interface.",
                "sks": 3,
                "semester": 3,
                "department": "Sistem Informasi",
                "modules": [
                    {"title": "Analisis Kebutuhan Sistem", "description": "Identifikasi problem, requirement gathering, dan feasibility study.", "order": 1},
                    {"title": "Pemodelan UML & Use Case", "description": "Merancang diagram kelas, use case, dan activity diagram.", "order": 2},
                    {"title": "Desain UI/UX & Database", "description": "Prinsip perancangan antarmuka pengguna dan skema data.", "order": 3}
                ]
            },
            {
                "code": "SI301",
                "title": "Arsitektur Enterprise",
                "description": "Perancangan arsitektur enterprise menggunakan framework TOGAF untuk menyelaraskan bisnis dengan strategi TI.",
                "sks": 3,
                "semester": 5,
                "department": "Sistem Informasi",
                "modules": [
                    {"title": "Pengenalan Arsitektur Enterprise", "description": "Konsep dasar, manfaat, dan arsitektur bisnis vs teknologi.", "order": 1},
                    {"title": "TOGAF ADM Framework", "description": "Tahapan siklus pengembangan arsitektur TOGAF.", "order": 2},
                    {"title": "Tata Kelola & Implementasi TI", "description": "Strategi migrasi dan tata kelola arsitektur IT.", "order": 3}
                ]
            },
            {
                "code": "AKT101",
                "title": "Pengantar Akuntansi",
                "description": "Dasar-dasar akuntansi keuangan, siklus akuntansi untuk perusahaan jasa dan dagang, serta pembuatan laporan keuangan dasar.",
                "sks": 3,
                "semester": 1,
                "department": "Akuntansi",
                "modules": [
                    {"title": "Persamaan Dasar Akuntansi & Jurnal", "description": "Pencatatan transaksi keuangan menggunakan prinsip debit-kredit.", "order": 1},
                    {"title": "Siklus Akuntansi & Buku Besar", "description": "Posting ke buku besar dan penyusunan neraca saldo.", "order": 2},
                    {"title": "Jurnal Penyesuaian & Laporan Keuangan", "description": "Penyusunan laporan laba rugi, perubahan modal, dan neraca.", "order": 3}
                ]
            },
            {
                "code": "AKT201",
                "title": "Akuntansi Keuangan Menengah",
                "description": "Membahas perlakuan akuntansi untuk aset lancar, aset tetap, kewajiban jangka pendek, dan pengakuan pendapatan sesuai SAK.",
                "sks": 4,
                "semester": 3,
                "department": "Akuntansi",
                "modules": [
                    {"title": "Kas, Piutang & Persediaan", "description": "Penilaian dan pelaporan instrumen keuangan lancar.", "order": 1},
                    {"title": "Aset Tetap & Depresiasi", "description": "Perolehan aset tetap, penyusutan, dan pelepasan aset.", "order": 2},
                    {"title": "Kewajiban Jangka Pendek & Provisi", "description": "Pencatatan liabilitas lancar dan kontinjensi.", "order": 3}
                ]
            },
            {
                "code": "AKT301",
                "title": "Perpajakan",
                "description": "Ketentuan umum perpajakan di Indonesia, perhitungan PPh Pasal 21, 22, 23, 24, dan PPN.",
                "sks": 3,
                "semester": 4,
                "department": "Akuntansi",
                "modules": [
                    {"title": "Ketentuan Umum & Tata Cara Perpajakan", "description": "Hak dan kewajiban wajib pajak, NPWP, dan SPT.", "order": 1},
                    {"title": "Pajak Penghasilan (PPh) Orang Pribadi & Badan", "description": "Perhitungan PPh Pasal 21 untuk karyawan dan PPh Badan.", "order": 2},
                    {"title": "Pajak Pertambahan Nilai (PPN)", "description": "Konsep faktur pajak, pajak masukan, dan pajak keluaran.", "order": 3}
                ]
            },
            {
                "code": "AKT302",
                "title": "Auditing & Assurance",
                "description": "Prinsip pengauditan laporan keuangan, standar audit SPAP, penentuan risiko audit, bukti audit, dan laporan opini auditor.",
                "sks": 3,
                "semester": 5,
                "department": "Akuntansi",
                "modules": [
                    {"title": "Profesi Akuntan Publik & Standar Audit", "description": "Etika profesi auditor dan standar asurans.", "order": 1},
                    {"title": "Risiko Audit & Bukti Audit", "description": "Materialitas, sampling audit, dan prosedur substantif.", "order": 2},
                    {"title": "Laporan Auditor & Opini", "description": "Pemberian opini wajar tanpa pengecualian hingga opini tidak menyatakan pendapat.", "order": 3}
                ]
            }
        ]

        self.stdout.write("Seeding courses and modules...")
        for c_info in courses_data:
            course, created = Course.objects.get_or_create(
                code=c_info["code"],
                defaults={
                    "title": c_info["title"],
                    "description": c_info["description"],
                    "sks": c_info["sks"],
                    "semester": c_info["semester"],
                    "department": c_info["department"]
                }
            )
            if created:
                self.stdout.write(f"Created Course: {course.title}")
            else:
                self.stdout.write(f"Course {course.title} already exists.")

            # Seed modules
            for m_info in c_info["modules"]:
                module, m_created = CourseModule.objects.get_or_create(
                    course=course,
                    order=m_info["order"],
                    defaults={
                        "title": m_info["title"],
                        "description": m_info["description"]
                    }
                )
                if m_created:
                    self.stdout.write(f"  - Created Module {module.order}: {module.title}")

        # Seed a default student user for testing
        from django.contrib.auth import get_user_model
        from users.models import Mahasiswa
        
        User = get_user_model()
        username = "mahasiswa"
        password = "password123"
        email = "mahasiswa@belajara.id"
        nim = "2201010101"
        
        user, u_created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "first_name": "Budi",
                "last_name": "Santoso",
                "is_mahasiswa": True
            }
        )
        if u_created:
            user.set_password(password)
            user.save()
            self.stdout.write(f"Created test user: {username}")
        else:
            self.stdout.write(f"Test user {username} already exists.")
            
        mahasiswa, m_created = Mahasiswa.objects.get_or_create(
            user=user,
            defaults={
                "nim": nim,
                "jurusan": "Informatika",
                "universitas": "Universitas Indonesia",
                "semester": 3
            }
        )
        if m_created:
            self.stdout.write(f"Created Mahasiswa profile for: {user.first_name} {user.last_name}")
        else:
            self.stdout.write("Mahasiswa profile already exists.")
            
        # Enroll student in courses: IF101, IF201, IF202
        active_codes = ["IF101", "IF201", "IF202"]
        active_courses = Course.objects.filter(code__in=active_codes)
        mahasiswa.active_courses.set(active_courses)
        self.stdout.write(f"Enrolled {mahasiswa.nim} in courses: {[c.title for c in active_courses]}")

        # Seed quizzes for all modules
        from quizzes.models import Quiz
        self.stdout.write("Seeding quizzes for all modules...")
        for course in Course.objects.all():
            for module in course.modules.all():
                if not Quiz.objects.filter(module=module).exists():
                    questions = [
                        {
                            "question": f"Apa konsep utama yang dibahas pada {module.title}?",
                            "options": {
                                "A": "Konsep dasar dan implementasi praktis terkait topik.",
                                "B": "Struktur data acak tanpa kegunaan khusus.",
                                "C": "Penggunaan basis data relasional untuk semua kasus.",
                                "D": "Tidak ada jawaban yang benar."
                            },
                            "correct_answer": "A",
                            "explanation": "Pilihan A adalah jawaban paling tepat yang mendefinisikan fokus utama dari modul ini."
                        },
                        {
                            "question": f"Mengapa pemahaman tentang {module.title} penting?",
                            "options": {
                                "A": "Karena tidak berguna untuk pemrograman modern.",
                                "B": "Untuk mengoptimalkan efisiensi, performa, dan skalabilitas sistem.",
                                "C": "Hanya sebagai pelengkap akademis formal.",
                                "D": "Semua jawaban salah."
                            },
                            "correct_answer": "B",
                            "explanation": "Materi modul ini bertujuan untuk membekali mahasiswa dengan kemampuan optimasi sistem, efisiensi waktu (Big O), dan manajemen resource."
                        }
                    ]
                    Quiz.objects.create(
                        module=module,
                        questions_json=questions,
                        generated_by_ai=False
                    )
                    self.stdout.write(f"  - Created Quiz for Module: {module.title}")

        self.stdout.write(self.style.SUCCESS("Database seeding completed!"))
