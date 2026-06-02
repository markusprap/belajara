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

        self.stdout.write(self.style.SUCCESS("Database seeding completed!"))
