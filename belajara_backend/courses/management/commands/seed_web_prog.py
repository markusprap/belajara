from django.core.management.base import BaseCommand
from courses.models import Course, CourseModule, SubChapter
from django.contrib.auth import get_user_model
from users.models import Mahasiswa

class Command(BaseCommand):
    help = "Seeds a detailed 'Pemrograman Web' course with complete module and subchapter content"

    def handle(self, *args, **options):
        YOUTUBE_URL = "https://www.youtube.com/watch?v=w7ejDZ8SWv8"
        self.stdout.write(self.style.MIGRATE_HEADING("=== Seeding Mata Kuliah: Pemrograman Web ==="))

        # ── 1. Create / update the Course ────────────────────────────────────────
        course, created = Course.objects.update_or_create(
            code="IF302",
            defaults={
                "title": "Pemrograman Web",
                "description": (
                    "Pelajari cara membangun aplikasi web modern dari awal. Mata kuliah ini "
                    "mencakup dasar-dasar HTML5 dan CSS3, pemrograman JavaScript modern (ES6+), "
                    "hingga penggunaan framework populer seperti React dan Next.js. "
                    "Mahasiswa akan belajar membuat antarmuka yang responsif, interaktif, "
                    "dan terhubung dengan API backend."
                ),
                "sks": 3,
                "semester": 4,
                "department": "Informatika",
                "price": 399000.00,
                "is_premium": True,
                "category": "IT & Software",
                "instructor_name": "Sarah Aulia, S.T., M.Cs",
                "instructor_email": "sarah.aulia@belajara.id",
                "thumbnail_url": "/images/asian_instructor_thumbnail.png",
                "status": "public",
                "tags": "web,html,css,javascript,react,nextjs",
                "level": "intermediate",
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"  [+] Course created: {course}"))
        else:
            self.stdout.write(self.style.WARNING(f"  [~] Course updated: {course}"))

        # ── 2. Define Modules + SubChapters ──────────────────────────────────────
        modules_data = [
            {
                "order": 1,
                "title": "Dasar HTML5 & CSS3 Modern",
                "description": "Membangun pondasi struktur web dan desain visual yang responsif.",
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Video: Evolusi Web & HTML5",
                        "type": "video",
                        "duration": "12 mnt",
                        "video_url": YOUTUBE_URL,
                        "content": "# Evolusi Web\n\nTonton video ini untuk melihat bagaimana teknologi web berkembang dari halaman statis hingga aplikasi web modern.",
                    },
                    {
                        "order": 1,
                        "title": "Struktur Dokumen & Tag Semantik",
                        "type": "reading",
                        "duration": "20 mnt",
                        "content": """# Struktur Dokumen & Tag Semantik

HTML5 memperkenalkan tag semantik yang membantu browser dan mesin pencari memahami konten web dengan lebih baik.

## Tag Semantik Utama
- `<header>`: Bagian atas halaman atau artikel.
- `<nav>`: Kumpulan navigasi.
- `<main>`: Konten utama dokumen.
- `<article>`: Konten mandiri (blog post, news).
- `<section>`: Bagian tematik dari konten.
- `<footer>`: Bagian kaki halaman.

## Mengapa Semantik Penting?
1. **SEO**: Mesin pencari lebih mudah mengindeks situs.
2. **Accessibility**: Screen reader dapat menavigasi situs dengan lebih mudah.
3. **Maintainability**: Kode lebih mudah dibaca oleh developer lain.
""",
                    },
                    {
                        "order": 2,
                        "title": "Flexbox & CSS Grid",
                        "type": "reading",
                        "duration": "25 mnt",
                        "content": """# Layout Modern: Flexbox & Grid

## CSS Flexbox
Digunakan untuk layout satu dimensi (baris atau kolom).
```css
.container {
    display: flex;
    justify-content: center;
    align-items: center;
}
```

## CSS Grid
Digunakan untuk layout dua dimensi (baris DAN kolom).
```css
.grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}
```
""",
                    },
                ]
            },
            {
                "order": 2,
                "title": "JavaScript Modern (ES6+)",
                "description": "Menguasai logika pemrograman web dengan standar JavaScript terbaru.",
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Arrow Functions & Destructuring",
                        "type": "reading",
                        "duration": "15 mnt",
                        "content": """# Fitur Baru ES6+

### Arrow Functions
```javascript
const add = (a, b) => a + b;
```

### Destructuring Assignment
```javascript
const user = { name: 'Budi', age: 20 };
const { name, age } = user;
```

### Template Literals
```javascript
console.log(`Halo, nama saya ${name}`);
```
""",
                    },
                    {
                        "order": 1,
                        "title": "Asynchronous JS: Promise & Async/Await",
                        "type": "reading",
                        "duration": "20 mnt",
                        "content": """# Pemrograman Asynchronous

JavaScript adalah single-threaded, jadi kita butuh async untuk operasi yang memakan waktu (seperti fetch API).

### Fetch API dengan Async/Await
```javascript
async function getData() {
    try {
        const response = await fetch('https://api.example.com/data');
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
```
""",
                    },
                ]
            },
            {
                "order": 3,
                "title": "Pengenalan React & Next.js",
                "description": "Membangun UI berbasis komponen dengan framework paling populer saat ini.",
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Konsep Komponen & Props",
                        "type": "reading",
                        "duration": "20 mnt",
                        "content": """# Komponen React

Di React, UI dipecah menjadi bagian-bagian kecil yang dapat digunakan kembali.

```jsx
function Welcome(props) {
  return <h1>Halo, {props.name}</h1>;
}

function App() {
  return (
    <div>
      <Welcome name="Sara" />
      <Welcome name="Cahal" />
      <Welcome name="Edite" />
    </div>
  );
}
```
""",
                    },
                    {
                        "order": 1,
                        "title": "Next.js: App Router & Server Components",
                        "type": "reading",
                        "duration": "25 mnt",
                        "content": """# Mengenal Next.js

Next.js adalah framework React untuk produksi.

## Fitur Unggulan
- **Server Side Rendering (SSR)**: Performa lebih cepat dan SEO-friendly.
- **File-based Routing**: Folder dalam `src/app` otomatis menjadi route.
- **Optimization**: Gambar, font, dan script otomatis dioptimalkan.
""",
                    },
                ]
            }
        ]

        # ── 3. Execute Seeding ───────────────────────────────────────────────────
        for m_data in modules_data:
            module, m_created = CourseModule.objects.update_or_create(
                course=course,
                order=m_data["order"],
                defaults={
                    "title": m_data["title"],
                    "description": m_data["description"],
                },
            )
            msg = "Created" if m_created else "Updated"
            self.stdout.write(f"  [{msg}] Module {module.order}: {module.title}")

            for s_data in m_data["subchapters"]:
                sub, s_created = SubChapter.objects.update_or_create(
                    module=module,
                    order=s_data["order"],
                    defaults={
                        "title": s_data["title"],
                        "type": s_data["type"],
                        "duration": s_data["duration"],
                        "video_url": s_data.get("video_url"),
                        "content": s_data.get("content"),
                    },
                )
                s_msg = "Created" if s_created else "Updated"
                self.stdout.write(f"      [{s_msg}] SubChapter {sub.order}: {sub.title} ({sub.type})")

        # ── 4. Enrollment for 'mahasiswa' ────────────────────────────────────────
        User = get_user_model()
        user = User.objects.filter(username="mahasiswa").first()
        if user:
            mahasiswa = Mahasiswa.objects.filter(user=user).first()
            if mahasiswa:
                mahasiswa.active_courses.add(course)
                self.stdout.write(self.style.SUCCESS(f"  Enrolled 'mahasiswa' into '{course.title}'"))

        self.stdout.write(self.style.SUCCESS("\n✅  Seeding selesai! Course 'Pemrograman Web' (IF302) berhasil dibuat."))
