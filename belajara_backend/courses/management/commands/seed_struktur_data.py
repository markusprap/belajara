from django.core.management.base import BaseCommand
from courses.models import Course, CourseModule, SubChapter


class Command(BaseCommand):
    help = "Seeds a detailed 'Struktur Data' course with complete module and subchapter content"

    def handle(self, *args, **options):
        YOUTUBE_URL = "https://www.youtube.com/watch?v=q04buHDFT6M"
        YOUTUBE_EMBED = "https://www.youtube.com/embed/q04buHDFT6M"
        self.stdout.write(self.style.MIGRATE_HEADING("=== Seeding Mata Kuliah: Struktur Data ==="))

        # ── 1. Create / update the Course ────────────────────────────────────────
        course, created = Course.objects.update_or_create(
            code="IF103",
            defaults={
                "title": "Struktur Data",
                "description": (
                    "Mata kuliah ini membahas secara mendalam berbagai struktur data fundamental "
                    "yang menjadi tulang-punggung pengembangan perangkat lunak modern. Dimulai dari "
                    "analisis kompleksitas algoritma (Big-O), mahasiswa akan menguasai Array, Linked "
                    "List, Stack, Queue, Tree, Heap, Hash Table, hingga Graph beserta algoritma "
                    "pengurutannya. Setiap topik disertai implementasi kode Python yang dapat langsung "
                    "dipraktikkan."
                ),
                "sks": 3,
                "semester": 2,
                "department": "Informatika",
                "price": 299000.00,
                "is_premium": True,
                "category": "IT & Software",
                "instructor_name": "Dr. Budi Raharjo, M.Kom",
                "instructor_email": "budi.raharjo@belajara.id",
                "thumbnail_url": "/images/daniel_scott_thumbnail.png",
                "status": "public",
                "tags": "struktur data,algoritma,python,linked list,tree,graph,sorting",
                "level": "intermediate",
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"  [+] Course created: {course}"))
        else:
            self.stdout.write(self.style.WARNING(f"  [~] Course updated: {course}"))

        # ── 2. Define Modules + SubChapters ──────────────────────────────────────
        modules_data = [
            # ═══════════════════════════════════════════════════════════════════
            {
                "order": 1,
                "title": "Pendahuluan & Kompleksitas Algoritma",
                "description": (
                    "Pengantar mata kuliah, motivasi belajar struktur data, dan cara menganalisis "
                    "efisiensi algoritma menggunakan notasi Big-O."
                ),
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Video Pengantar: Struktur Data & Algoritma",
                        "type": "video",
                        "duration": "12 mnt",
                        "video_url": YOUTUBE_URL,
                        "content": """# Video Pengantar: Struktur Data & Algoritma\n\nTonton video berikut untuk mendapatkan gambaran besar tentang apa itu Struktur Data dan mengapa sangat penting dalam dunia pemrograman.\n\n> **Catatan:** Setelah menonton video ini, lanjutkan ke materi bacaan di bawah untuk pendalaman konsep dengan kode Python.""",
                    },
                    {
                        "order": 1,
                        "title": "Apa itu Struktur Data?",
                        "type": "reading",
                        "duration": "10 mnt",
                        "content": """\
# Apa itu Struktur Data?

## Definisi
**Struktur data** adalah cara terorganisasi untuk menyimpan dan mengelola data di dalam komputer sehingga dapat diakses dan dimodifikasi secara efisien.

Bayangkan kamu memiliki 10.000 buku di perpustakaan. Jika buku-buku itu ditumpuk sembarangan, mencari satu buku tertentu akan memakan waktu lama. Namun jika diorganisir berdasarkan sistem (misalnya: alfabet pengarang, nomor Dewey Decimal), pencariannya menjadi jauh lebih cepat.

Struktur data melakukan hal yang sama untuk data di dalam komputer.

## Mengapa Penting?
- ✅ **Efisiensi waktu** – operasi lebih cepat
- ✅ **Efisiensi memori** – penggunaan RAM lebih optimal
- ✅ **Kode lebih bersih** – abstraksi yang tepat menyederhanakan logika program
- ✅ **Fondasi wajib** – semua bidang software engineering membutuhkan pemahaman ini

## Klasifikasi Struktur Data

```
Struktur Data
├── Linear (data berurutan)
│   ├── Array
│   ├── Linked List
│   ├── Stack
│   └── Queue
└── Non-Linear (data bercabang / berjaringan)
    ├── Tree
    │   └── Binary Tree, BST, Heap, Trie
    └── Graph
```

## Contoh Nyata dalam Kehidupan Sehari-hari
| Struktur Data | Analogi Nyata |
|---|---|
| Array | Rak buku bernomor urut |
| Stack | Tumpukan piring di dapur |
| Queue | Antrian kasir supermarket |
| Tree | Struktur folder di komputer |
| Graph | Peta kota dengan jalan penghubung |
| Hash Table | Kamus (kata → definisi) |

## Rangkuman
Pada modul ini kita akan mempelajari setiap struktur data di atas secara mendalam, lengkap dengan analisis kompleksitas dan implementasi Python.
""",
                    },
                    {
                        "order": 2,
                        "title": "Notasi Big-O: Mengukur Efisiensi Algoritma",
                        "type": "reading",
                        "duration": "20 mnt",
                        "content": """\
# Notasi Big-O: Mengukur Efisiensi Algoritma

## Apa itu Big-O?
**Notasi Big-O** adalah cara matematis untuk mendeskripsikan batas atas dari waktu berjalan (time complexity) atau penggunaan memori (space complexity) sebuah algoritma, **relatif terhadap ukuran input (n)**.

> Big-O menjawab pertanyaan: *"Seberapa lambat algoritma kita jika datanya tumbuh berlipat ganda?"*

## Aturan Dasar Big-O
1. **Abaikan konstanta**: `O(2n)` → `O(n)`
2. **Ambil suku terbesar**: `O(n² + n)` → `O(n²)`
3. **Worst case**: Big-O selalu mengukur skenario terburuk

## Kompleksitas yang Umum Dijumpai

| Notasi | Nama | Contoh |
|---|---|---|
| O(1) | Konstan | Akses elemen array via index |
| O(log n) | Logaritmik | Binary Search |
| O(n) | Linear | Mencari elemen di list tak terurut |
| O(n log n) | Linearitmik | Merge Sort, Quick Sort |
| O(n²) | Kuadratik | Bubble Sort, Selection Sort |
| O(2ⁿ) | Eksponensial | Recursive Fibonacci naif |
| O(n!) | Faktorial | Brute-force Traveling Salesman |

## Visualisasi Pertumbuhan
```
Waktu
 │                                         O(n!)
 │                              O(2ⁿ)
 │                   O(n²)
 │         O(n log n)
 │    O(n)
 │  O(log n)
 │ O(1)
 └──────────────────────────────────────── n (ukuran input)
```

## Contoh Analisis Kode Python

### O(1) – Konstan
```python
def get_first_element(arr):
    return arr[0]  # Selalu satu operasi, berapapun panjang arr
```

### O(n) – Linear
```python
def find_max(arr):
    max_val = arr[0]
    for x in arr:        # Loop sebanyak n kali
        if x > max_val:
            max_val = x
    return max_val
```

### O(n²) – Kuadratik
```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):           # Loop luar: n kali
        for j in range(n - i - 1):  # Loop dalam: ≈ n kali
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
```

### O(log n) – Logaritmik
```python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1    # Buang separuh kiri
        else:
            right = mid - 1   # Buang separuh kanan
    return -1
```

## Space Complexity
Selain waktu, kita juga harus memperhatikan **penggunaan memori**:
```python
# O(1) space – tidak ada alokasi memori tambahan
def sum_in_place(arr):
    total = 0
    for x in arr:
        total += x
    return total

# O(n) space – membuat salinan array baru
def double_array(arr):
    return [x * 2 for x in arr]  # Membuat list baru berukuran n
```

## Latihan
Tentukan kompleksitas Big-O dari kode berikut:
```python
def mystery(n):
    count = 0
    i = 1
    while i < n:
        count += 1
        i *= 2  # i: 1, 2, 4, 8, 16, ...
    return count
```
<details><summary>Jawaban</summary>
O(log n) – karena i dikali 2 setiap iterasi, jumlah iterasi = log₂(n)
</details>
""",
                    },
                    {
                        "order": 3,
                        "title": "Kuis: Analisis Kompleksitas",
                        "type": "quiz",
                        "duration": "10 mnt",
                        "content": """\
# Kuis: Analisis Kompleksitas Algoritma

Jawab pertanyaan berikut untuk menguji pemahamanmu tentang notasi Big-O.

---

**Soal 1.** Algoritma manakah yang paling efisien untuk input berukuran sangat besar?
- A. O(n²)
- B. O(n log n)
- C. O(2ⁿ)
- D. O(n!)

**Jawaban: B** – O(n log n) tumbuh paling lambat di antara pilihan di atas.

---

**Soal 2.** Berapakah kompleksitas waktu untuk mengakses elemen ke-100 di sebuah array?
- A. O(n)
- B. O(log n)
- C. O(1)
- D. O(100)

**Jawaban: C** – Array mendukung akses acak (random access) dalam O(1).

---

**Soal 3.** Perhatikan kode berikut:
```python
for i in range(n):
    for j in range(n):
        for k in range(n):
            print(i, j, k)
```
Berapa kompleksitas Big-O-nya?
- A. O(n²)
- B. O(3n)
- C. O(n³)
- D. O(log n)

**Jawaban: C** – Tiga loop bersarang → O(n × n × n) = O(n³).

---

**Soal 4.** Apa yang dimaksud dengan Space Complexity?
- A. Jumlah baris kode program
- B. Jumlah memori yang digunakan algoritma relatif terhadap ukuran input
- C. Kecepatan prosesor yang dibutuhkan
- D. Ukuran file program

**Jawaban: B** – Space complexity mengukur alokasi memori tambahan yang dibutuhkan.

---

**Soal 5.** Algoritma Binary Search memiliki kompleksitas:
- A. O(n)
- B. O(n log n)
- C. O(log n)
- D. O(1)

**Jawaban: C** – Setiap langkah memotong ruang pencarian menjadi setengah → O(log n).
""",
                    },
                ],
            },
            # ═══════════════════════════════════════════════════════════════════
            {
                "order": 2,
                "title": "Array & String",
                "description": (
                    "Memahami array statis dan dinamis, operasi dasar, serta teknik manipulasi "
                    "string yang sering muncul dalam wawancara teknis."
                ),
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Video: Array & Manipulasi Data di Python",
                        "type": "video",
                        "duration": "12 mnt",
                        "video_url": YOUTUBE_URL,
                        "content": """# Video: Array & Manipulasi Data di Python\n\nPelajari konsep Array secara visual melalui video ini sebelum masuk ke implementasi kode Python lengkap.""",
                    },
                    {
                        "order": 1,
                        "title": "Array: Konsep & Implementasi Python",
                        "type": "reading",
                        "duration": "20 mnt",
                        "content": """\
# Array: Konsep & Implementasi Python

## Apa itu Array?
**Array** adalah kumpulan elemen bertipe sama yang disimpan di lokasi memori yang **berurutan (contiguous)**. Setiap elemen dapat diakses langsung menggunakan **indeks**.

```
Index:   0    1    2    3    4
       ┌────┬────┬────┬────┬────┐
Array: │ 10 │ 25 │  7 │ 42 │ 3  │
       └────┴────┴────┴────┴────┘
         ↑
       arr[0] = 10
```

## Karakteristik Array
| Properti | Nilai |
|---|---|
| Ukuran | Tetap (static) atau dinamis (dynamic list) |
| Tipe data | Homogen (semua elemen bertipe sama) |
| Akses elemen | O(1) via indeks |
| Pencarian (unsorted) | O(n) |
| Penyisipan di tengah | O(n) – harus menggeser elemen |
| Penghapusan di tengah | O(n) – harus menggeser elemen |

## Array di Python (List)
Python menggunakan **List** sebagai implementasi array dinamis:

```python
# Membuat array
arr = [10, 25, 7, 42, 3]

# Akses elemen – O(1)
print(arr[0])    # 10
print(arr[-1])   # 3 (indeks negatif: dari belakang)

# Mengubah elemen – O(1)
arr[2] = 99
print(arr)       # [10, 25, 99, 42, 3]

# Panjang array
print(len(arr))  # 5

# Menambah elemen di akhir – O(1) amortized
arr.append(50)
print(arr)       # [10, 25, 99, 42, 3, 50]

# Menyisipkan di posisi tertentu – O(n)
arr.insert(1, 100)
print(arr)       # [10, 100, 25, 99, 42, 3, 50]

# Menghapus elemen – O(n)
arr.pop(1)       # Hapus indeks 1
arr.remove(99)   # Hapus nilai 99 (pertama ditemukan)

# Slicing – O(k) dimana k = panjang slice
print(arr[1:4])  # Elemen indeks 1, 2, 3
```

## Teknik Penting: Two Pointers
**Two Pointers** adalah teknik menggunakan dua indeks untuk menyelesaikan masalah array dengan efisien.

### Contoh: Cek Palindrom
```python
def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True

print(is_palindrome("katak"))   # True
print(is_palindrome("python"))  # False
```

### Contoh: Reverse Array
```python
def reverse_array(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1
    return arr

print(reverse_array([1, 2, 3, 4, 5]))  # [5, 4, 3, 2, 1]
```

## Teknik: Sliding Window
Untuk subarray berurutan dengan ukuran tetap:
```python
def max_sum_subarray(arr, k):
    \"\"\"Cari jumlah maksimum subarray berukuran k – O(n)\"\"\"
    n = len(arr)
    if n < k:
        return -1

    # Hitung jumlah window pertama
    window_sum = sum(arr[:k])
    max_sum = window_sum

    # Geser window ke kanan
    for i in range(k, n):
        window_sum += arr[i] - arr[i - k]  # Tambah baru, kurangi lama
        max_sum = max(max_sum, window_sum)

    return max_sum

print(max_sum_subarray([2, 1, 5, 1, 3, 2], 3))  # 9 (5+1+3)
```

## Array 2D (Matriks)
```python
# Membuat matriks 3x3
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

# Akses elemen – matrix[baris][kolom]
print(matrix[1][2])  # 6

# Iterasi semua elemen
for row in matrix:
    for val in row:
        print(val, end=" ")
    print()

# Transpose matriks – O(n²)
def transpose(matrix):
    n = len(matrix)
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    return matrix
```
""",
                    },
                    {
                        "order": 2,
                        "title": "Manipulasi String & Teknik Hashing",
                        "type": "reading",
                        "duration": "15 mnt",
                        "content": """\
# Manipulasi String & Teknik Hashing

## String di Python
String di Python bersifat **immutable** – tidak bisa diubah setelah dibuat.

```python
s = "Struktur Data"

# Operasi dasar
print(len(s))          # 13
print(s[0])            # 'S'
print(s[-1])           # 'a'
print(s[0:8])          # 'Struktur'
print(s.lower())       # 'struktur data'
print(s.upper())       # 'STRUKTUR DATA'
print(s.split())       # ['Struktur', 'Data']
print(s.replace("Data", "Algoritma"))  # 'Struktur Algoritma'
print("Data" in s)     # True
```

## Anagram Check menggunakan Hashing
```python
from collections import Counter

def is_anagram(s1, s2):
    \"\"\"
    Cek apakah dua string adalah anagram.
    Anagram: kata yang menggunakan huruf yang sama, susunan berbeda.
    Contoh: 'listen' dan 'silent' adalah anagram.
    Kompleksitas: O(n) waktu, O(1) ruang (26 huruf alfabet)
    \"\"\"
    return Counter(s1.lower()) == Counter(s2.lower())

print(is_anagram("listen", "silent"))   # True
print(is_anagram("hello", "world"))     # False
print(is_anagram("Belajara", "abelajar"))  # True (case-insensitive)
```

## Longest Unique Substring (Sliding Window)
```python
def length_of_longest_substring(s):
    \"\"\"
    Cari panjang substring terpanjang tanpa karakter berulang.
    Contoh: 'abcabcbb' → 3 ('abc')
    Kompleksitas: O(n)
    \"\"\"
    char_index = {}
    max_len = 0
    left = 0

    for right, char in enumerate(s):
        if char in char_index and char_index[char] >= left:
            left = char_index[char] + 1
        char_index[char] = right
        max_len = max(max_len, right - left + 1)

    return max_len

print(length_of_longest_substring("abcabcbb"))  # 3
print(length_of_longest_substring("bbbbb"))     # 1
print(length_of_longest_substring("pwwkew"))    # 3
```

## String Builder Pattern
Karena string Python immutable, **hindari concatenation dalam loop**:
```python
# ❌ BURUK – O(n²) karena setiap += membuat string baru
result = ""
for word in words:
    result += word + " "

# ✅ BAIK – O(n) menggunakan list + join
parts = []
for word in words:
    parts.append(word)
result = " ".join(parts)

# Atau dengan list comprehension
result = " ".join(word for word in words)
```
""",
                    },
                ],
            },
            # ═══════════════════════════════════════════════════════════════════
            {
                "order": 3,
                "title": "Linked List",
                "description": (
                    "Implementasi Singly Linked List, Doubly Linked List, dan Circular Linked List "
                    "dari nol menggunakan Python, beserta semua operasi CRUD-nya."
                ),
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Video: Linked List – Singly, Doubly & Circular",
                        "type": "video",
                        "duration": "12 mnt",
                        "video_url": YOUTUBE_URL,
                        "content": """# Video: Linked List\n\nPahami cara kerja Linked List secara visual — bagaimana node saling terhubung melalui pointer — sebelum mengimplementasikannya di Python.""",
                    },
                    {
                        "order": 1,
                        "title": "Singly Linked List: Teori & Implementasi",
                        "type": "reading",
                        "duration": "25 mnt",
                        "content": """\
# Singly Linked List: Teori & Implementasi

## Mengapa Linked List?
Array menyimpan data di memori yang **berurutan**. Ini artinya:
- Penyisipan / penghapusan di tengah = O(n) karena harus menggeser elemen
- Ukuran harus diketahui di awal (pada static array)

**Linked List** menyimpan data di **node** yang tersebar di memori, dihubungkan oleh **pointer**.

```
HEAD
  │
  ▼
┌──────┬──────┐     ┌──────┬──────┐     ┌──────┬──────┐
│  10  │  ●───┼────▶│  25  │  ●───┼────▶│  7   │ NULL │
└──────┴──────┘     └──────┴──────┘     └──────┴──────┘
  Node 1               Node 2               Node 3
 (data|next)
```

## Perbandingan Array vs Linked List
| Operasi | Array | Linked List |
|---|---|---|
| Akses elemen (index) | O(1) | O(n) |
| Pencarian | O(n) | O(n) |
| Penyisipan di depan | O(n) | **O(1)** |
| Penyisipan di belakang | O(1) amortized | O(n) atau O(1) dengan tail |
| Penyisipan di tengah | O(n) | O(n) pencarian + **O(1)** sisip |
| Penghapusan | O(n) | O(n) pencarian + **O(1)** hapus |
| Memori | Lebih efisien | Overhead pointer (8 byte/node) |

## Implementasi Lengkap

```python
class Node:
    \"\"\"Satu node dalam linked list.\"\"\"
    def __init__(self, data):
        self.data = data
        self.next = None   # Pointer ke node berikutnya

    def __repr__(self):
        return f"Node({self.data})"


class SinglyLinkedList:
    \"\"\"Implementasi Singly Linked List.\"\"\"

    def __init__(self):
        self.head = None
        self._size = 0

    def __len__(self):
        return self._size

    def __repr__(self):
        nodes = []
        current = self.head
        while current:
            nodes.append(str(current.data))
            current = current.next
        return " → ".join(nodes) + " → NULL"

    # ─── Penyisipan ───────────────────────────────────────────────────────────

    def prepend(self, data):
        \"\"\"Sisipkan di depan (HEAD) – O(1).\"\"\"
        new_node = Node(data)
        new_node.next = self.head
        self.head = new_node
        self._size += 1

    def append(self, data):
        \"\"\"Sisipkan di belakang – O(n).\"\"\"
        new_node = Node(data)
        if not self.head:
            self.head = new_node
        else:
            current = self.head
            while current.next:
                current = current.next
            current.next = new_node
        self._size += 1

    def insert_at(self, index, data):
        \"\"\"Sisipkan di posisi tertentu – O(n).\"\"\"
        if index < 0 or index > self._size:
            raise IndexError("Index di luar batas")
        if index == 0:
            self.prepend(data)
            return
        new_node = Node(data)
        current = self.head
        for _ in range(index - 1):
            current = current.next
        new_node.next = current.next
        current.next = new_node
        self._size += 1

    # ─── Penghapusan ──────────────────────────────────────────────────────────

    def delete_first(self):
        \"\"\"Hapus node pertama – O(1).\"\"\"
        if not self.head:
            raise ValueError("List kosong")
        data = self.head.data
        self.head = self.head.next
        self._size -= 1
        return data

    def delete_value(self, value):
        \"\"\"Hapus node dengan nilai tertentu (pertama ditemukan) – O(n).\"\"\"
        if not self.head:
            raise ValueError("List kosong")
        if self.head.data == value:
            return self.delete_first()
        current = self.head
        while current.next:
            if current.next.data == value:
                current.next = current.next.next
                self._size -= 1
                return value
            current = current.next
        raise ValueError(f"Nilai {value} tidak ditemukan")

    # ─── Pencarian ────────────────────────────────────────────────────────────

    def search(self, value):
        \"\"\"Cari nilai – kembalikan indeks atau -1 – O(n).\"\"\"
        current = self.head
        index = 0
        while current:
            if current.data == value:
                return index
            current = current.next
            index += 1
        return -1

    # ─── Operasi Lanjutan ────────────────────────────────────────────────────

    def reverse(self):
        \"\"\"Balik urutan linked list – O(n).\"\"\"
        prev = None
        current = self.head
        while current:
            next_node = current.next
            current.next = prev
            prev = current
            current = next_node
        self.head = prev

    def has_cycle(self):
        \"\"\"
        Deteksi siklus menggunakan Floyd's Cycle Detection (Tortoise & Hare).
        Kompleksitas: O(n) waktu, O(1) ruang.
        \"\"\"
        slow = fast = self.head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast:
                return True
        return False


# ── Penggunaan ───────────────────────────────────────────────────────────────
ll = SinglyLinkedList()
ll.append(10)
ll.append(25)
ll.append(7)
ll.prepend(5)
ll.insert_at(2, 15)

print(ll)            # 5 → 10 → 15 → 25 → 7 → NULL
print(len(ll))       # 5
print(ll.search(25)) # 3

ll.reverse()
print(ll)            # 7 → 25 → 15 → 10 → 5 → NULL

ll.delete_value(15)
print(ll)            # 7 → 25 → 10 → 5 → NULL
```

## Linked List vs Python List
Python built-in `list` sudah sangat optimal (C-implementation). Dalam praktik sehari-hari, kamu akan lebih sering melihat linked list dalam:
- Implementasi `collections.deque`
- Sistem file dan alokasi memori
- Undo/Redo di editor teks
- Browser history
""",
                    },
                    {
                        "order": 2,
                        "title": "Doubly & Circular Linked List",
                        "type": "reading",
                        "duration": "20 mnt",
                        "content": """\
# Doubly & Circular Linked List

## Doubly Linked List
Setiap node memiliki **dua pointer**: ke node sebelumnya (`prev`) dan berikutnya (`next`).

```
NULL ←─── ┌──────┬──────┬──────┐ ───▶ ┌──────┬──────┬──────┐ ───▶ NULL
           │ prev │ data │ next │      │ prev │ data │ next │
           └──────┴──────┴──────┘ ◀─── └──────┴──────┴──────┘
              Node 1  (head)                 Node 2
```

### Keunggulan vs Singly LL
- Traversal **dua arah** (maju dan mundur)
- Penghapusan **O(1)** jika node sudah diketahui (tidak perlu cari predecessor)

```python
class DNode:
    def __init__(self, data):
        self.data = data
        self.prev = None
        self.next = None


class DoublyLinkedList:
    def __init__(self):
        self.head = None
        self.tail = None
        self._size = 0

    def append(self, data):
        \"\"\"Tambah di belakang – O(1) dengan tail pointer.\"\"\"
        node = DNode(data)
        if not self.tail:
            self.head = self.tail = node
        else:
            node.prev = self.tail
            self.tail.next = node
            self.tail = node
        self._size += 1

    def prepend(self, data):
        \"\"\"Tambah di depan – O(1).\"\"\"
        node = DNode(data)
        if not self.head:
            self.head = self.tail = node
        else:
            node.next = self.head
            self.head.prev = node
            self.head = node
        self._size += 1

    def delete_node(self, node):
        \"\"\"Hapus node yang sudah diketahui – O(1).\"\"\"
        if node.prev:
            node.prev.next = node.next
        else:
            self.head = node.next

        if node.next:
            node.next.prev = node.prev
        else:
            self.tail = node.prev

        self._size -= 1

    def traverse_forward(self):
        result = []
        current = self.head
        while current:
            result.append(current.data)
            current = current.next
        return result

    def traverse_backward(self):
        result = []
        current = self.tail
        while current:
            result.append(current.data)
            current = current.prev
        return result


dll = DoublyLinkedList()
for v in [10, 20, 30, 40]:
    dll.append(v)

print(dll.traverse_forward())   # [10, 20, 30, 40]
print(dll.traverse_backward())  # [40, 30, 20, 10]
```

## Circular Linked List
Node terakhir menunjuk **kembali ke head**, membentuk lingkaran.

```
    ┌─────────────────────────────────┐
    ▼                                 │
┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐
│  10  │───▶│  20  │───▶│  30  │───▶│  40  │
└──────┘    └──────┘    └──────┘    └──────┘
```

**Kasus Penggunaan:**
- Round-robin scheduling (giliran proses di OS)
- Music playlist looping
- Buffer sirkuler (circular buffer)

```python
class CircularLinkedList:
    def __init__(self):
        self.head = None

    def append(self, data):
        node = Node(data)
        if not self.head:
            self.head = node
            node.next = self.head  # Menunjuk ke diri sendiri
        else:
            current = self.head
            while current.next != self.head:
                current = current.next
            current.next = node
            node.next = self.head

    def display(self, max_rounds=1):
        \"\"\"Tampilkan elemen (max_rounds kali putaran untuk menghindari infinite loop).\"\"\"
        if not self.head:
            return
        result = []
        current = self.head
        count = 0
        total = max_rounds * self._count()
        while count < total:
            result.append(str(current.data))
            current = current.next
            count += 1
        return " → ".join(result) + " → (HEAD)"

    def _count(self):
        if not self.head:
            return 0
        count = 1
        current = self.head.next
        while current != self.head:
            count += 1
            current = current.next
        return count


cll = CircularLinkedList()
for v in [10, 20, 30, 40]:
    cll.append(v)
print(cll.display())  # 10 → 20 → 30 → 40 → (HEAD)
```

## Aplikasi: LRU Cache dengan Doubly LL + Hash Map

**LRU Cache** (Least Recently Used) adalah salah satu implementasi paling terkenal yang menggunakan Doubly Linked List:

```python
from collections import OrderedDict

class LRUCache:
    \"\"\"
    LRU Cache – O(1) get dan put.
    Menggunakan OrderedDict sebagai kombinasi Hash Map + Doubly LL.
    \"\"\"
    def __init__(self, capacity: int):
        self.cache = OrderedDict()
        self.capacity = capacity

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)  # Pindahkan ke 'paling baru dipakai'
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)  # Hapus yang paling lama tidak dipakai


lru = LRUCache(3)
lru.put(1, "A")
lru.put(2, "B")
lru.put(3, "C")
print(lru.get(1))   # "A" – 1 jadi paling baru
lru.put(4, "D")     # Evict 2 (paling lama tidak dipakai)
print(lru.get(2))   # -1 (sudah dievict)
```
""",
                    },
                ],
            },
            # ═══════════════════════════════════════════════════════════════════
            {
                "order": 4,
                "title": "Stack & Queue",
                "description": (
                    "Memahami prinsip LIFO (Stack) dan FIFO (Queue), implementasi dari scratch, "
                    "serta aplikasi nyata seperti evaluasi ekspresi, BFS, dan Deque."
                ),
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Video: Stack & Queue – LIFO dan FIFO",
                        "type": "video",
                        "duration": "12 mnt",
                        "video_url": YOUTUBE_URL,
                        "content": """# Video: Stack & Queue\n\nTonton video ini untuk memahami prinsip LIFO (Stack) dan FIFO (Queue) secara visual sebelum mempelajari implementasinya di Python.""",
                    },
                    {
                        "order": 1,
                        "title": "Stack: LIFO & Aplikasinya",
                        "type": "reading",
                        "duration": "20 mnt",
                        "content": """\
# Stack: LIFO & Aplikasinya

## Konsep Stack
**Stack** (tumpukan) adalah struktur data linear yang mengikuti prinsip **LIFO** (Last In, First Out) – elemen yang terakhir masuk adalah yang pertama keluar.

```
PUSH →  ┌─────┐
        │  5  │  ← TOP (paling baru)
        ├─────┤
        │  3  │
        ├─────┤
        │  1  │  ← BOTTOM
        └─────┘
POP  ←  TOP
```

**Analogi:** Tumpukan piring. Piring terakhir yang ditaruh adalah yang pertama diambil.

## Operasi Stack
| Operasi | Deskripsi | Kompleksitas |
|---|---|---|
| `push(x)` | Tambah elemen di atas | O(1) |
| `pop()` | Hapus & kembalikan elemen teratas | O(1) |
| `peek()` | Lihat elemen teratas tanpa menghapus | O(1) |
| `is_empty()` | Cek apakah stack kosong | O(1) |
| `size()` | Jumlah elemen | O(1) |

## Implementasi Stack

### Menggunakan Python List (paling simpel)
```python
stack = []

# Push
stack.append(10)
stack.append(20)
stack.append(30)
print(stack)         # [10, 20, 30]

# Peek
print(stack[-1])     # 30 (elemen teratas)

# Pop
print(stack.pop())   # 30
print(stack.pop())   # 20
print(stack)         # [10]
```

### Implementasi Class (lebih formal)
```python
class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        if self.is_empty():
            raise IndexError("Stack underflow: stack kosong")
        return self._items.pop()

    def peek(self):
        if self.is_empty():
            raise IndexError("Stack kosong")
        return self._items[-1]

    def is_empty(self):
        return len(self._items) == 0

    def size(self):
        return len(self._items)

    def __repr__(self):
        return f"Stack({self._items}) ← TOP"
```

## Aplikasi Stack #1: Cek Kurung Seimbang
```python
def is_balanced(expression):
    \"\"\"
    Cek apakah semua tanda kurung, kurung kotak, dan kurung kurawal
    dalam ekspresi sudah seimbang.
    Contoh: '({[]})' → True | '({[})' → False
    \"\"\"
    stack = Stack()
    matching = {')': '(', ']': '[', '}': '{'}
    opening = set('([{')

    for char in expression:
        if char in opening:
            stack.push(char)
        elif char in matching:
            if stack.is_empty() or stack.pop() != matching[char]:
                return False
    return stack.is_empty()

print(is_balanced("({[]})"))   # True
print(is_balanced("([)]"))     # False
print(is_balanced("{[()]}"))   # True
```

## Aplikasi Stack #2: Evaluasi Ekspresi Postfix (RPN)
```python
def evaluate_postfix(expression):
    \"\"\"
    Evaluasi ekspresi Postfix (Reverse Polish Notation).
    Contoh: '3 4 + 2 *' = (3+4)*2 = 14
    \"\"\"
    stack = Stack()
    operators = {'+', '-', '*', '/'}

    for token in expression.split():
        if token not in operators:
            stack.push(float(token))
        else:
            b = stack.pop()
            a = stack.pop()
            if token == '+':
                stack.push(a + b)
            elif token == '-':
                stack.push(a - b)
            elif token == '*':
                stack.push(a * b)
            elif token == '/':
                stack.push(a / b)

    return stack.pop()

print(evaluate_postfix("3 4 + 2 *"))    # 14.0
print(evaluate_postfix("5 1 2 + 4 * + 3 -"))  # 14.0
```

## Aplikasi Stack #3: Undo/Redo
```python
class TextEditor:
    def __init__(self):
        self.text = ""
        self.undo_stack = Stack()
        self.redo_stack = Stack()

    def type(self, chars):
        self.undo_stack.push(self.text)
        self.redo_stack = Stack()  # Hapus redo history
        self.text += chars

    def undo(self):
        if not self.undo_stack.is_empty():
            self.redo_stack.push(self.text)
            self.text = self.undo_stack.pop()

    def redo(self):
        if not self.redo_stack.is_empty():
            self.undo_stack.push(self.text)
            self.text = self.redo_stack.pop()

editor = TextEditor()
editor.type("Hello")
editor.type(" World")
print(editor.text)   # "Hello World"
editor.undo()
print(editor.text)   # "Hello"
editor.redo()
print(editor.text)   # "Hello World"
```
""",
                    },
                    {
                        "order": 2,
                        "title": "Queue, Deque & Priority Queue",
                        "type": "reading",
                        "duration": "20 mnt",
                        "content": """\
# Queue, Deque & Priority Queue

## Konsep Queue
**Queue** (antrian) adalah struktur data FIFO (First In, First Out) – elemen yang pertama masuk adalah yang pertama keluar.

```
ENQUEUE →   REAR                          FRONT  → DEQUEUE
           ┌─────┬─────┬─────┬─────┐
           │  40 │  30 │  20 │  10 │
           └─────┴─────┴─────┴─────┘
           (terakhir masuk)    (pertama keluar)
```

## Implementasi Queue di Python
```python
from collections import deque

# Cara terbaik: gunakan collections.deque
q = deque()

# Enqueue (tambah di belakang) – O(1)
q.append(10)
q.append(20)
q.append(30)

# Dequeue (hapus dari depan) – O(1)
print(q.popleft())  # 10
print(q.popleft())  # 20

# Peek depan
print(q[0])         # 30
```

### Implementasi Class
```python
class Queue:
    def __init__(self):
        self._items = deque()

    def enqueue(self, item):
        self._items.append(item)

    def dequeue(self):
        if self.is_empty():
            raise IndexError("Queue underflow: antrian kosong")
        return self._items.popleft()

    def peek(self):
        if self.is_empty():
            raise IndexError("Antrian kosong")
        return self._items[0]

    def is_empty(self):
        return len(self._items) == 0

    def size(self):
        return len(self._items)
```

## Aplikasi Queue: BFS (Breadth-First Search)
```python
from collections import deque

def bfs(graph, start):
    \"\"\"
    Traversal BFS pada graph menggunakan queue.
    graph: dict {node: [neighbor1, neighbor2, ...]}
    \"\"\"
    visited = set()
    queue = deque([start])
    visited.add(start)
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    return order

graph = {
    'A': ['B', 'C'],
    'B': ['D', 'E'],
    'C': ['F'],
    'D': [], 'E': [], 'F': []
}
print(bfs(graph, 'A'))  # ['A', 'B', 'C', 'D', 'E', 'F']
```

## Deque (Double-Ended Queue)
`deque` mendukung penambahan dan penghapusan dari **kedua ujung** dalam O(1).

```python
from collections import deque

d = deque()
d.append(10)        # Tambah kanan
d.append(20)
d.appendleft(5)     # Tambah kiri
d.appendleft(1)
print(d)            # deque([1, 5, 10, 20])

print(d.popleft())  # 1 – hapus kiri
print(d.pop())      # 20 – hapus kanan
print(d)            # deque([5, 10])
```

## Priority Queue (Heap Queue)
Dalam Priority Queue, elemen dengan **prioritas tertinggi** (nilai terkecil) keluar pertama.

```python
import heapq

# Heap di Python adalah MIN-HEAP
pq = []
heapq.heappush(pq, (3, "Task C"))
heapq.heappush(pq, (1, "Task A"))  # Prioritas 1 (tertinggi)
heapq.heappush(pq, (2, "Task B"))

print(heapq.heappop(pq))  # (1, 'Task A')
print(heapq.heappop(pq))  # (2, 'Task B')
print(heapq.heappop(pq))  # (3, 'Task C')

# MAX-HEAP: gunakan nilai negatif
max_pq = []
heapq.heappush(max_pq, -10)
heapq.heappush(max_pq, -30)
heapq.heappush(max_pq, -20)
print(-heapq.heappop(max_pq))  # 30 (terbesar)
```
""",
                    },
                ],
            },
            # ═══════════════════════════════════════════════════════════════════
            {
                "order": 5,
                "title": "Tree & Binary Search Tree",
                "description": (
                    "Memahami konsep tree, binary tree, Binary Search Tree (BST), "
                    "AVL Tree, dan berbagai traversal."
                ),
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Video: Tree & Binary Search Tree",
                        "type": "video",
                        "duration": "12 mnt",
                        "video_url": YOUTUBE_URL,
                        "content": """# Video: Tree & Binary Search Tree\n\nPelajari konsep hierarki Tree dan cara kerja BST secara visual — termasuk traversal Inorder, Preorder, dan Postorder.""",
                    },
                    {
                        "order": 1,
                        "title": "Binary Tree & Traversal",
                        "type": "reading",
                        "duration": "25 mnt",
                        "content": """\
# Binary Tree & Traversal

## Apa itu Tree?
**Tree** adalah struktur data hierarkis yang terdiri dari **node** yang terhubung oleh **edge**. Tidak ada siklus.

```
           ┌───┐
           │ 1 │  ← Root
           └─┬─┘
        ┌────┴────┐
       ┌─┴─┐     ┌─┴─┐
       │ 2 │     │ 3 │  ← Internal nodes
       └─┬─┘     └─┬─┘
      ┌──┴──┐      └──┐
     ┌─┴─┐ ┌─┴─┐  ┌──┴─┐
     │ 4 │ │ 5 │  │  6  │  ← Leaf nodes
     └───┘ └───┘  └─────┘
```

## Terminologi Tree
| Istilah | Definisi |
|---|---|
| Root | Node teratas, tidak punya parent |
| Leaf | Node tanpa anak |
| Height | Jumlah edge dari root ke leaf terdalam |
| Depth | Jarak node dari root |
| Subtree | Sebuah node dan semua turunannya |
| Binary Tree | Setiap node punya maksimal 2 anak |

## Implementasi Binary Tree
```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

    def __repr__(self):
        return f"TreeNode({self.val})"

# Membuat tree secara manual
root = TreeNode(1)
root.left = TreeNode(2)
root.right = TreeNode(3)
root.left.left = TreeNode(4)
root.left.right = TreeNode(5)
root.right.right = TreeNode(6)
```

## Tree Traversal (DFS)
Ada 3 cara traversal DFS (Depth-First Search):

### 1. Inorder (Kiri → Root → Kanan)
```python
def inorder(node, result=None):
    if result is None:
        result = []
    if node:
        inorder(node.left, result)
        result.append(node.val)
        inorder(node.right, result)
    return result

print(inorder(root))  # [4, 2, 5, 1, 3, 6]
```
> 💡 Pada BST, Inorder menghasilkan urutan terurut (ascending)!

### 2. Preorder (Root → Kiri → Kanan)
```python
def preorder(node, result=None):
    if result is None:
        result = []
    if node:
        result.append(node.val)
        preorder(node.left, result)
        preorder(node.right, result)
    return result

print(preorder(root))  # [1, 2, 4, 5, 3, 6]
```
> 💡 Preorder berguna untuk menyalin / serialisasi tree.

### 3. Postorder (Kiri → Kanan → Root)
```python
def postorder(node, result=None):
    if result is None:
        result = []
    if node:
        postorder(node.left, result)
        postorder(node.right, result)
        result.append(node.val)
    return result

print(postorder(root))  # [4, 5, 2, 6, 3, 1]
```
> 💡 Postorder berguna untuk menghapus tree (hapus anak dulu, baru parent).

## Tree Traversal (BFS / Level-Order)
```python
from collections import deque

def level_order(root):
    \"\"\"Traversal per level menggunakan Queue.\"\"\"
    if not root:
        return []
    result = []
    queue = deque([root])
    while queue:
        level_size = len(queue)
        level = []
        for _ in range(level_size):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    return result

print(level_order(root))  # [[1], [2, 3], [4, 5, 6]]
```

## Soal Klasik: Maximum Depth of Binary Tree
```python
def max_depth(root):
    \"\"\"
    Hitung kedalaman maksimum binary tree.
    Kompleksitas: O(n) waktu, O(h) ruang (h = tinggi tree)
    \"\"\"
    if not root:
        return 0
    left_depth = max_depth(root.left)
    right_depth = max_depth(root.right)
    return 1 + max(left_depth, right_depth)

print(max_depth(root))  # 3
```
""",
                    },
                    {
                        "order": 2,
                        "title": "Binary Search Tree (BST)",
                        "type": "reading",
                        "duration": "25 mnt",
                        "content": """\
# Binary Search Tree (BST)

## Properti BST
**BST** adalah Binary Tree dengan aturan tambahan:
- Semua node di **subtree kiri** < node saat ini
- Semua node di **subtree kanan** > node saat ini

```
           ┌────┐
           │  8 │
           └──┬─┘
        ┌─────┴─────┐
       ┌─┴─┐       ┌─┴─┐
       │  3 │      │ 10 │
       └─┬─┘       └─┬─┘
     ┌───┴───┐        └──┐
   ┌─┴─┐   ┌─┴─┐      ┌──┴─┐
   │  1 │  │  6 │     │  14 │
   └───┘   └─┬─┘      └────┘
          ┌──┴──┐
         ┌─┴─┐ ┌─┴─┐
         │  4 │ │  7 │
         └───┘ └───┘
```

## Kompleksitas BST
| Operasi | Average | Worst (Skewed) |
|---|---|---|
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |

> ⚠️ Worst case terjadi saat tree menjadi "skewed" (seperti linked list). Solusinya: **AVL Tree** atau **Red-Black Tree** yang *self-balancing*.

## Implementasi BST
```python
class BST:
    def __init__(self):
        self.root = None

    def insert(self, val):
        \"\"\"Insert nilai baru ke BST – O(log n) average.\"\"\"
        self.root = self._insert(self.root, val)

    def _insert(self, node, val):
        if not node:
            return TreeNode(val)
        if val < node.val:
            node.left = self._insert(node.left, val)
        elif val > node.val:
            node.right = self._insert(node.right, val)
        # val == node.val: abaikan duplikat
        return node

    def search(self, val):
        \"\"\"Cari nilai di BST – O(log n) average.\"\"\"
        return self._search(self.root, val)

    def _search(self, node, val):
        if not node:
            return False
        if val == node.val:
            return True
        elif val < node.val:
            return self._search(node.left, val)
        else:
            return self._search(node.right, val)

    def delete(self, val):
        \"\"\"Hapus nilai dari BST – O(log n) average.\"\"\"
        self.root = self._delete(self.root, val)

    def _delete(self, node, val):
        if not node:
            return None
        if val < node.val:
            node.left = self._delete(node.left, val)
        elif val > node.val:
            node.right = self._delete(node.right, val)
        else:
            # Node ditemukan – 3 kasus:
            # Kasus 1: Leaf node
            if not node.left and not node.right:
                return None
            # Kasus 2: Satu anak
            if not node.left:
                return node.right
            if not node.right:
                return node.left
            # Kasus 3: Dua anak
            # Ganti dengan in-order successor (terkecil di subtree kanan)
            successor = self._min_node(node.right)
            node.val = successor.val
            node.right = self._delete(node.right, successor.val)
        return node

    def _min_node(self, node):
        while node.left:
            node = node.left
        return node

    def inorder(self):
        \"\"\"Menghasilkan elemen terurut ascending.\"\"\"
        result = []
        self._inorder(self.root, result)
        return result

    def _inorder(self, node, result):
        if node:
            self._inorder(node.left, result)
            result.append(node.val)
            self._inorder(node.right, result)


# ── Demo ─────────────────────────────────────────────────────────────────────
bst = BST()
for v in [8, 3, 10, 1, 6, 14, 4, 7]:
    bst.insert(v)

print(bst.inorder())      # [1, 3, 4, 6, 7, 8, 10, 14]
print(bst.search(6))      # True
print(bst.search(9))      # False

bst.delete(3)
print(bst.inorder())      # [1, 4, 6, 7, 8, 10, 14]
```

## Validasi BST
```python
def is_valid_bst(root, min_val=float('-inf'), max_val=float('inf')):
    \"\"\"
    Cek apakah sebuah binary tree adalah BST yang valid.
    Setiap node harus berada dalam range (min_val, max_val).
    \"\"\"
    if not root:
        return True
    if not (min_val < root.val < max_val):
        return False
    return (is_valid_bst(root.left, min_val, root.val) and
            is_valid_bst(root.right, root.val, max_val))
```
""",
                    },
                ],
            },
            # ═══════════════════════════════════════════════════════════════════
            {
                "order": 6,
                "title": "Hash Table",
                "description": (
                    "Mempelajari konsep hashing, collision resolution (chaining & open addressing), "
                    "dan implementasi hash table dari scratch."
                ),
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Video: Hash Table & Hashing",
                        "type": "video",
                        "duration": "12 mnt",
                        "video_url": YOUTUBE_URL,
                        "content": """# Video: Hash Table & Hashing\n\nSimak penjelasan visual tentang bagaimana Hash Table memetakan key ke value, dan apa yang terjadi saat terjadi collision.""",
                    },
                    {
                        "order": 1,
                        "title": "Hash Table: Teori & Collision Handling",
                        "type": "reading",
                        "duration": "25 mnt",
                        "content": """\
# Hash Table: Teori & Collision Handling

## Apa itu Hash Table?
**Hash Table** (atau Hash Map) adalah struktur data yang memetakan **key** ke **value** menggunakan fungsi hash. Ini memungkinkan operasi **insert, search, delete dalam O(1) average**.

```
key: "apple"                    Hash Table (size=7)
         │                      Index │  Value
         ▼                      ──────┼──────────
   hash("apple") % 7 = 4        0    │  None
                                 1    │  None
                                 2    │  None
                                 3    │  None
                                 4    │  ("apple", 1.5) ← 🍎
                                 5    │  None
                                 6    │  None
```

## Hash Function
Fungsi hash yang baik harus:
1. **Deterministic** – input sama → output sama
2. **Uniform distribution** – menyebarkan key secara merata
3. **Cepat** – O(1) untuk komputasi

```python
# Contoh hash function sederhana
def simple_hash(key, table_size):
    return sum(ord(c) for c in key) % table_size

print(simple_hash("apple", 7))   # 4
print(simple_hash("banana", 7))  # 2
```

## Collision
**Collision** terjadi ketika dua key berbeda menghasilkan hash yang sama.

### Solusi 1: Chaining (Separate Chaining)
Setiap slot menyimpan **linked list** dari key-value pairs yang collision.

```python
class HashTableChaining:
    def __init__(self, size=16):
        self.size = size
        self.table = [[] for _ in range(size)]  # Array of lists

    def _hash(self, key):
        return hash(key) % self.size

    def put(self, key, value):
        idx = self._hash(key)
        bucket = self.table[idx]
        # Update jika key sudah ada
        for i, (k, v) in enumerate(bucket):
            if k == key:
                bucket[i] = (key, value)
                return
        bucket.append((key, value))

    def get(self, key):
        idx = self._hash(key)
        for k, v in self.table[idx]:
            if k == key:
                return v
        raise KeyError(key)

    def delete(self, key):
        idx = self._hash(key)
        bucket = self.table[idx]
        for i, (k, v) in enumerate(bucket):
            if k == key:
                bucket.pop(i)
                return
        raise KeyError(key)

    def __repr__(self):
        items = []
        for bucket in self.table:
            for k, v in bucket:
                items.append(f"{k!r}: {v!r}")
        return "{" + ", ".join(items) + "}"


ht = HashTableChaining()
ht.put("apple", 1.5)
ht.put("banana", 0.75)
ht.put("cherry", 2.0)
print(ht)                  # {'apple': 1.5, 'banana': 0.75, 'cherry': 2.0}
print(ht.get("banana"))    # 0.75
ht.delete("apple")
print(ht)                  # {'banana': 0.75, 'cherry': 2.0}
```

### Solusi 2: Open Addressing (Linear Probing)
Jika slot sudah terisi, cari slot kosong berikutnya.

```python
class HashTableLinearProbing:
    DELETED = object()  # Sentinel untuk slot yang dihapus

    def __init__(self, size=16):
        self.size = size
        self.keys = [None] * size
        self.values = [None] * size
        self.count = 0

    def _hash(self, key):
        return hash(key) % self.size

    def put(self, key, value):
        if self.count / self.size > 0.7:  # Load factor > 70% → resize
            self._resize()
        idx = self._hash(key)
        while self.keys[idx] is not None and self.keys[idx] != key:
            idx = (idx + 1) % self.size  # Linear probing
        if self.keys[idx] is None or self.keys[idx] is self.DELETED:
            self.count += 1
        self.keys[idx] = key
        self.values[idx] = value

    def get(self, key):
        idx = self._hash(key)
        while self.keys[idx] is not None:
            if self.keys[idx] == key:
                return self.values[idx]
            idx = (idx + 1) % self.size
        raise KeyError(key)

    def _resize(self):
        old_keys = self.keys
        old_values = self.values
        self.size *= 2
        self.keys = [None] * self.size
        self.values = [None] * self.size
        self.count = 0
        for k, v in zip(old_keys, old_values):
            if k is not None and k is not self.DELETED:
                self.put(k, v)
```

## Python dict = Hash Table
Python's built-in `dict` adalah hash table yang sangat dioptimasi:

```python
# Penggunaan sehari-hari
phone_book = {}
phone_book["Budi"] = "0812-3456-7890"
phone_book["Siti"] = "0821-9876-5432"

print(phone_book.get("Budi"))           # '0812-3456-7890'
print(phone_book.get("Andi", "N/A"))    # 'N/A' (default)
print("Siti" in phone_book)             # True

# Menghitung frekuensi kata – O(n)
words = ["apel", "jeruk", "apel", "mangga", "jeruk", "apel"]
freq = {}
for word in words:
    freq[word] = freq.get(word, 0) + 1
print(freq)  # {'apel': 3, 'jeruk': 2, 'mangga': 1}

# Atau lebih singkat dengan Counter
from collections import Counter
print(Counter(words))  # Counter({'apel': 3, 'jeruk': 2, 'mangga': 1})
```

## Two Sum Problem (Hash Table Klassik)
```python
def two_sum(nums, target):
    \"\"\"
    Cari dua indeks yang nilainya berjumlah target.
    Kompleksitas: O(n) waktu, O(n) ruang
    \"\"\"
    seen = {}  # {value: index}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

print(two_sum([2, 7, 11, 15], 9))   # [0, 1]  (2 + 7 = 9)
print(two_sum([3, 2, 4], 6))        # [1, 2]  (2 + 4 = 6)
```
""",
                    },
                ],
            },
            # ═══════════════════════════════════════════════════════════════════
            {
                "order": 7,
                "title": "Graph & Algoritma Traversal",
                "description": (
                    "Representasi graph (adjacency list & matrix), traversal BFS/DFS, "
                    "deteksi siklus, dan algoritma Dijkstra untuk shortest path."
                ),
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Video: Graph & Algoritma Traversal (DFS/BFS)",
                        "type": "video",
                        "duration": "12 mnt",
                        "video_url": YOUTUBE_URL,
                        "content": """# Video: Graph & Algoritma Traversal\n\nPelajari cara merepresentasikan graph dan bagaimana DFS & BFS bekerja secara visual, sebelum masuk ke implementasi kode dan algoritma Dijkstra.""",
                    },
                    {
                        "order": 1,
                        "title": "Representasi Graph & DFS/BFS",
                        "type": "reading",
                        "duration": "30 mnt",
                        "content": """\
# Representasi Graph & DFS/BFS

## Apa itu Graph?
**Graph** G = (V, E) adalah kumpulan **vertices** (simpul) dan **edges** (sisi penghubung).

**Jenis Graph:**
- **Directed (Digraph)**: Edge memiliki arah (A → B, bukan B → A)
- **Undirected**: Edge tanpa arah (A ─ B)
- **Weighted**: Edge memiliki bobot/jarak
- **Unweighted**: Semua edge setara

## Representasi Graph

### Adjacency List (paling umum)
```python
# Undirected Graph
graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F'],
    'D': ['B'],
    'E': ['B', 'F'],
    'F': ['C', 'E']
}
```
- Space: O(V + E) ← Efisien untuk sparse graph
- Edge check: O(degree)

### Adjacency Matrix
```python
# 4 nodes: 0, 1, 2, 3
#    0  1  2  3
matrix = [
    [0, 1, 1, 0],   # Node 0 terhubung ke 1, 2
    [1, 0, 0, 1],   # Node 1 terhubung ke 0, 3
    [1, 0, 0, 1],   # Node 2 terhubung ke 0, 3
    [0, 1, 1, 0],   # Node 3 terhubung ke 1, 2
]
```
- Space: O(V²) ← Boros untuk sparse graph
- Edge check: O(1)

## DFS (Depth-First Search)
Eksplorasi sedalam mungkin sebelum backtrack.

```python
def dfs_recursive(graph, node, visited=None):
    \"\"\"DFS Rekursif – menggunakan call stack.\"\"\"
    if visited is None:
        visited = set()
    visited.add(node)
    print(node, end=" ")
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs_recursive(graph, neighbor, visited)
    return visited

def dfs_iterative(graph, start):
    \"\"\"DFS Iteratif – menggunakan explicit stack.\"\"\"
    visited = set()
    stack = [start]
    order = []

    while stack:
        node = stack.pop()  # LIFO
        if node not in visited:
            visited.add(node)
            order.append(node)
            # Tambahkan tetangga dalam urutan terbalik untuk menjaga urutan
            for neighbor in reversed(graph[node]):
                if neighbor not in visited:
                    stack.append(neighbor)
    return order

graph = {
    'A': ['B', 'C'],
    'B': ['D', 'E'],
    'C': ['F'],
    'D': [], 'E': [], 'F': []
}
print(dfs_iterative(graph, 'A'))   # ['A', 'B', 'D', 'E', 'C', 'F']
```

## BFS (Breadth-First Search)
Eksplorasi per level, menggunakan queue.

```python
from collections import deque

def bfs(graph, start):
    \"\"\"BFS – menggunakan Queue.\"\"\"
    visited = set([start])
    queue = deque([start])
    order = []

    while queue:
        node = queue.popleft()  # FIFO
        order.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return order

print(bfs(graph, 'A'))   # ['A', 'B', 'C', 'D', 'E', 'F']
```

## Perbandingan DFS vs BFS
| | DFS | BFS |
|---|---|---|
| Struktur data | Stack | Queue |
| Penggunaan memori | O(h) – h = kedalaman | O(w) – w = lebar |
| Menemukan shortest path | ❌ (tidak guaranteed) | ✅ (pada unweighted graph) |
| Cocok untuk | Maze solving, cycle detection, topological sort | Shortest path, level traversal |

## Deteksi Siklus (Undirected Graph)
```python
def has_cycle_undirected(graph):
    \"\"\"
    Deteksi siklus di undirected graph menggunakan DFS.
    Jika kita mencapai node yang sudah dikunjungi (bukan parent), ada siklus.
    \"\"\"
    visited = set()

    def dfs(node, parent):
        visited.add(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                if dfs(neighbor, node):
                    return True
            elif neighbor != parent:  # Bukan parent = ada back edge = siklus
                return True
        return False

    for node in graph:
        if node not in visited:
            if dfs(node, None):
                return True
    return False

graph_cycle = {'A': ['B', 'C'], 'B': ['A', 'C'], 'C': ['A', 'B']}
graph_no_cycle = {'A': ['B', 'C'], 'B': ['A'], 'C': ['A']}
print(has_cycle_undirected(graph_cycle))     # True
print(has_cycle_undirected(graph_no_cycle))  # False
```
""",
                    },
                    {
                        "order": 2,
                        "title": "Algoritma Dijkstra: Shortest Path",
                        "type": "reading",
                        "duration": "25 mnt",
                        "content": """\
# Algoritma Dijkstra: Shortest Path

## Konsep
**Dijkstra's Algorithm** mencari **jalur terpendek** dari satu sumber ke semua vertex lain di **weighted graph** (bobot non-negatif).

**Contoh Graph:**
```
        2         3
   A ─────── B ─────── C
   │         │          │
 6 │       8 │        7 │
   │         │          │
   D ─────── E ─────── F
        5         9
```

## Algoritma (Menggunakan Min-Heap)

```python
import heapq
from collections import defaultdict

def dijkstra(graph, start):
    \"\"\"
    Dijkstra's algorithm menggunakan min-heap (priority queue).

    Args:
        graph: dict {node: [(neighbor, weight), ...]}
        start: node awal

    Returns:
        distances: dict {node: jarak_terpendek_dari_start}
        parents: dict {node: node_sebelumnya} untuk rekonstruksi path
    \"\"\"
    # Inisialisasi semua jarak sebagai tak hingga
    distances = defaultdict(lambda: float('inf'))
    distances[start] = 0

    parents = {start: None}

    # Min-heap: (jarak, node)
    heap = [(0, start)]

    while heap:
        curr_dist, curr_node = heapq.heappop(heap)

        # Skip jika sudah menemukan jarak yang lebih pendek sebelumnya
        if curr_dist > distances[curr_node]:
            continue

        for neighbor, weight in graph[curr_node]:
            new_dist = curr_dist + weight

            if new_dist < distances[neighbor]:
                distances[neighbor] = new_dist
                parents[neighbor] = curr_node
                heapq.heappush(heap, (new_dist, neighbor))

    return dict(distances), parents

def reconstruct_path(parents, start, end):
    \"\"\"Rekonstruksi jalur terpendek dari parents dict.\"\"\"
    path = []
    node = end
    while node is not None:
        path.append(node)
        node = parents.get(node)
    path.reverse()
    if path[0] != start:
        return []  # Tidak ada jalur
    return path


# ── Demo ─────────────────────────────────────────────────────────────────────
graph = {
    'A': [('B', 2), ('D', 6)],
    'B': [('A', 2), ('C', 3), ('E', 8)],
    'C': [('B', 3), ('F', 7)],
    'D': [('A', 6), ('E', 5)],
    'E': [('B', 8), ('D', 5), ('F', 9)],
    'F': [('C', 7), ('E', 9)]
}

distances, parents = dijkstra(graph, 'A')
print("Jarak terpendek dari A:")
for node, dist in sorted(distances.items()):
    path = reconstruct_path(parents, 'A', node)
    print(f"  {node}: {dist} | Path: {' → '.join(path)}")

# Output:
# A: 0  | Path: A
# B: 2  | Path: A → B
# C: 5  | Path: A → B → C
# D: 6  | Path: A → D
# E: 11 | Path: A → D → E
# F: 12 | Path: A → B → C → F
```

## Kompleksitas Dijkstra
| Implementasi | Waktu | Cocok untuk |
|---|---|---|
| Array linear | O(V²) | Dense graph |
| Binary Heap (heapq) | O((V + E) log V) | Sparse graph |
| Fibonacci Heap | O(E + V log V) | Teoritis optimal |

## Keterbatasan Dijkstra
> ⚠️ Dijkstra **tidak bisa** menangani **negative weight edges**. Untuk graph dengan bobot negatif, gunakan **Bellman-Ford Algorithm**.

## Aplikasi Nyata
- 🗺️ **Google Maps / GPS** – mencari rute tercepat
- 🌐 **Network routing** – protokol OSPF
- 🎮 **Game pathfinding** – A* (modifikasi Dijkstra dengan heuristik)
- 📦 **Logistik** – optimasi rute pengiriman
""",
                    },
                ],
            },
            # ═══════════════════════════════════════════════════════════════════
            {
                "order": 8,
                "title": "Sorting Algorithms",
                "description": (
                    "Analisis mendalam terhadap algoritma pengurutan: Bubble, Selection, "
                    "Insertion, Merge Sort, Quick Sort, dan Heap Sort."
                ),
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Video: Algoritma Sorting – Dari O(n²) ke O(n log n)",
                        "type": "video",
                        "duration": "12 mnt",
                        "video_url": YOUTUBE_URL,
                        "content": """# Video: Algoritma Sorting\n\nTonton video ini untuk memahami perbedaan antara algoritma sorting O(n²) (Bubble, Selection, Insertion) dan O(n log n) (Merge Sort, Quick Sort, Heap Sort) secara visual dan intuitif.""",
                    },
                    {
                        "order": 1,
                        "title": "Sorting O(n²): Bubble, Selection, Insertion",
                        "type": "reading",
                        "duration": "20 mnt",
                        "content": """\
# Sorting O(n²): Bubble, Selection, Insertion

## Mengapa Belajar Sorting?
Pengurutan adalah operasi fundamental. Python's `sorted()` menggunakan **Timsort** (O(n log n)), namun memahami algoritma dasar membangun intuisi yang kuat untuk:
- Analisis kompleksitas
- Wawancara teknis
- Kasus penggunaan khusus (data hampir terurut, data kecil, dll.)

## 1. Bubble Sort – O(n²)
Elemen yang lebih besar "menggelembung" ke atas (kanan) di setiap iterasi.

```python
def bubble_sort(arr):
    \"\"\"
    Bandingkan pasangan bersebelahan, tukar jika salah urutan.
    Best case: O(n) saat array sudah terurut (dengan flag).
    \"\"\"
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:  # Optimasi: stop jika tidak ada swap
            break
    return arr

arr = [64, 34, 25, 12, 22, 11, 90]
print(bubble_sort(arr))  # [11, 12, 22, 25, 34, 64, 90]
```

**Visualisasi:**
```
Pass 1: [34, 25, 12, 22, 11, 64, 90]  (90 ke posisi akhir)
Pass 2: [25, 12, 22, 11, 34, 64, 90]  (64 ke posisi akhir)
Pass 3: [12, 22, 11, 25, 34, 64, 90]
...
```

## 2. Selection Sort – O(n²)
Cari elemen terkecil, taruh di posisi paling depan, ulangi.

```python
def selection_sort(arr):
    \"\"\"
    Setiap iterasi: cari minimum di sisa array, swap ke posisi i.
    Kompleksitas: O(n²) selalu (tidak ada optimasi best case).
    Keunggulan: maksimal n-1 swaps (bagus untuk memori mahal).
    \"\"\"
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr

arr = [64, 25, 12, 22, 11]
print(selection_sort(arr))  # [11, 12, 22, 25, 64]
```

## 3. Insertion Sort – O(n²) / O(n) best case
Ambil satu elemen, sisipkan di posisi yang tepat di bagian yang sudah terurut.

```python
def insertion_sort(arr):
    \"\"\"
    Mirip cara manusia mengurutkan kartu remi.
    Best case O(n): jika sudah hampir terurut.
    Sangat efisien untuk n kecil (n < 50) atau hampir terurut.
    \"\"\"
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        # Geser elemen yang lebih besar dari key ke kanan
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr

arr = [12, 11, 13, 5, 6]
print(insertion_sort(arr))  # [5, 6, 11, 12, 13]
```

## Perbandingan O(n²) Algorithms
| Algoritma | Best | Average | Worst | Space | Stable? |
|---|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | ❌ |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |

> **Stable Sort** = elemen dengan nilai sama mempertahankan urutan relatifnya.
""",
                    },
                    {
                        "order": 2,
                        "title": "Sorting O(n log n): Merge Sort & Quick Sort",
                        "type": "reading",
                        "duration": "25 mnt",
                        "content": """\
# Sorting O(n log n): Merge Sort & Quick Sort

## 4. Merge Sort – O(n log n)
Strategi **Divide & Conquer**: bagi array menjadi dua, urutkan masing-masing, lalu gabungkan.

```
[38, 27, 43, 3, 9, 82, 10]

          Divide
    [38, 27, 43]    [3, 9, 82, 10]
  [38, 27] [43]   [3, 9]  [82, 10]
 [38] [27]        [3] [9] [82] [10]

          Merge (Conquer)
  [27, 38] [43]   [3, 9]  [10, 82]
    [27, 38, 43]    [3, 9, 10, 82]
       [3, 9, 10, 27, 38, 43, 82]
```

```python
def merge_sort(arr):
    \"\"\"
    Merge Sort – O(n log n) waktu, O(n) ruang.
    Stabil, konsisten (tidak ada worst case O(n²)).
    \"\"\"
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    \"\"\"Gabungkan dua sorted array – O(n).\"\"\"
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    # Tambahkan sisa elemen
    result.extend(left[i:])
    result.extend(right[j:])
    return result

arr = [38, 27, 43, 3, 9, 82, 10]
print(merge_sort(arr))  # [3, 9, 10, 27, 38, 43, 82]
```

## 5. Quick Sort – O(n log n) avg, O(n²) worst
Pilih **pivot**, partisi array sehingga elemen kiri < pivot dan kanan > pivot, ulangi rekursif.

```python
def quick_sort(arr, low=0, high=None):
    \"\"\"
    Quick Sort in-place – O(n log n) average, O(n²) worst case.
    Dalam praktik sering lebih cepat dari Merge Sort (cache-friendly).
    \"\"\"
    if high is None:
        high = len(arr) - 1
    if low < high:
        pivot_idx = partition(arr, low, high)
        quick_sort(arr, low, pivot_idx - 1)
        quick_sort(arr, pivot_idx + 1, high)
    return arr

def partition(arr, low, high):
    \"\"\"Lomuto partition scheme.\"\"\"
    pivot = arr[high]
    i = low - 1  # Indeks elemen kecil
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

arr = [10, 7, 8, 9, 1, 5]
print(quick_sort(arr))  # [1, 5, 7, 8, 9, 10]
```

## 6. Heap Sort – O(n log n)
Menggunakan struktur **Max-Heap** untuk mengurutkan.

```python
def heap_sort(arr):
    \"\"\"
    Heap Sort – O(n log n) waktu, O(1) ruang.
    Tidak stabil, tapi in-place.
    \"\"\"
    n = len(arr)

    # Bangun max-heap
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)

    # Ekstrak elemen dari heap satu per satu
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]  # Pindahkan max ke akhir
        heapify(arr, i, 0)

    return arr

def heapify(arr, n, i):
    largest = i
    left = 2 * i + 1
    right = 2 * i + 2

    if left < n and arr[left] > arr[largest]:
        largest = left
    if right < n and arr[right] > arr[largest]:
        largest = right

    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)

arr = [12, 11, 13, 5, 6, 7]
print(heap_sort(arr))  # [5, 6, 7, 11, 12, 13]
```

## Perbandingan Semua Algoritma Sorting
| Algoritma | Best | Average | Worst | Space | Stable |
|---|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | ❌ |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ |
| **Python Timsort** | **O(n)** | **O(n log n)** | **O(n log n)** | **O(n)** | **✅** |

## Kapan Menggunakan Apa?
- **Data kecil (n < 50)**: Insertion Sort
- **Hampir terurut**: Insertion Sort
- **Butuh stabilitas + konsisten**: Merge Sort
- **In-place, rata-rata cepat**: Quick Sort (dengan random pivot)
- **Worst-case O(n log n) + in-place**: Heap Sort
- **Praktik sehari-hari**: `sorted()` Python (Timsort)
""",
                    },
                    {
                        "order": 3,
                        "title": "Kuis Final: Sorting & Struktur Data",
                        "type": "quiz",
                        "duration": "15 mnt",
                        "content": """\
# Kuis Final: Sorting & Struktur Data

Uji pemahamanmu terhadap seluruh materi Struktur Data!

---

**Soal 1.** Manakah algoritma sorting yang memiliki worst-case O(n²) tetapi average-case O(n log n)?
- A. Merge Sort
- B. Heap Sort
- C. **Quick Sort** ✅
- D. Insertion Sort

**Penjelasan:** Quick Sort mengalami worst-case O(n²) jika pivot selalu terpilih sebagai elemen terbesar/terkecil (contoh: array sudah terurut). Solusinya: random pivot.

---

**Soal 2.** Struktur data apa yang paling tepat digunakan untuk implementasi **browser history** (tombol Back)?
- A. Queue
- B. **Stack** ✅
- C. Array
- D. Graph

**Penjelasan:** Stack (LIFO) – halaman terakhir dikunjungi adalah yang pertama kembali saat klik Back.

---

**Soal 3.** Apa keunggulan utama Doubly Linked List dibanding Singly Linked List?
- A. Menggunakan lebih sedikit memori
- B. Pencarian lebih cepat (O(log n))
- C. **Traversal bisa dua arah & delete O(1) jika node diketahui** ✅
- D. Akses random O(1)

---

**Soal 4.** Algoritma BFS menggunakan struktur data apa?
- A. Stack
- B. **Queue** ✅
- C. Priority Queue
- D. Array

**Penjelasan:** BFS menjelajahi graph level per level, membutuhkan FIFO → Queue.

---

**Soal 5.** Pada Binary Search Tree (BST), traversal manakah yang menghasilkan elemen dalam urutan **ascending**?
- A. Preorder
- B. Postorder
- C. Level-Order
- D. **Inorder** ✅

**Penjelasan:** Inorder (Kiri → Root → Kanan) pada BST secara otomatis menghasilkan urutan terurut menaik.

---

**Soal 6.** Algoritma Dijkstra TIDAK bisa digunakan pada graph dengan:
- A. Vertex yang tidak terhubung
- B. **Edge berbobot negatif** ✅
- C. Graph yang tidak berarah
- D. Graph yang sangat besar

---

**Soal 7.** Manakah pernyataan yang BENAR tentang Hash Table?
- A. Selalu O(1) untuk semua operasi
- B. Tidak pernah terjadi collision
- C. **Average case O(1) untuk insert, search, delete** ✅
- D. Membutuhkan data yang terurut

---

**Soal 8.** Apa strategi yang digunakan Merge Sort?
- A. Greedy
- B. Dynamic Programming
- C. **Divide and Conquer** ✅
- D. Backtracking

---

**Soal 9.** Berapa kompleksitas waktu untuk mencari elemen di Binary Search Tree yang balanced?
- A. O(1)
- B. **O(log n)** ✅
- C. O(n)
- D. O(n log n)

---

**Soal 10.** Kapan kamu harus menggunakan Priority Queue daripada Queue biasa?
- A. Saat urutan kedatangan tidak penting
- B. Saat data perlu disimpan secara permanen
- C. **Saat elemen harus diproses berdasarkan prioritas (bukan urutan kedatangan)** ✅
- D. Saat data berukuran sangat besar

**Contoh:** Algoritma Dijkstra memproses vertex dengan jarak terpendek terlebih dahulu → Priority Queue.

---

## 🎓 Selamat!
Kamu telah menyelesaikan seluruh modul **Struktur Data**. Kamu kini memiliki pemahaman mendalam tentang:
- ✅ Analisis kompleksitas (Big-O)
- ✅ Array, String, dan teknik Two Pointers/Sliding Window
- ✅ Linked List (Singly, Doubly, Circular)
- ✅ Stack & Queue (termasuk Priority Queue)
- ✅ Tree & Binary Search Tree
- ✅ Hash Table & Collision Resolution
- ✅ Graph & Algoritma Traversal (DFS, BFS, Dijkstra)
- ✅ Sorting Algorithms (O(n²) dan O(n log n))

**Langkah Selanjutnya:**
1. Praktikkan semua kode di atas di Python interpreter
2. Coba selesaikan soal LeetCode/HackerRank menggunakan konsep ini
3. Lanjutkan ke mata kuliah **Desain & Analisis Algoritma**
""",
                    },
                ],
            },
        ]

        # ── 3. Seed Modules & SubChapters ────────────────────────────────────
        for m_data in modules_data:
            module, m_created = CourseModule.objects.update_or_create(
                course=course,
                order=m_data["order"],
                defaults={
                    "title": m_data["title"],
                    "description": m_data["description"],
                },
            )
            action = "Created" if m_created else "Updated"
            self.stdout.write(f"  [{action}] Module {module.order}: {module.title}")

            for s_data in m_data["subchapters"]:
                sub, s_created = SubChapter.objects.update_or_create(
                    module=module,
                    order=s_data["order"],
                    defaults={
                        "title": s_data["title"],
                        "type": s_data["type"],
                        "duration": s_data["duration"],
                        "content": s_data["content"],
                        "video_url": s_data.get("video_url"),  # None for non-video types
                    },
                )
                s_action = "Created" if s_created else "Updated"
                self.stdout.write(
                    f"      [{s_action}] SubChapter {sub.order}: {sub.title} ({sub.type})"
                )

        # ── 4. Enroll test mahasiswa ──────────────────────────────────────────
        from django.contrib.auth import get_user_model
        from users.models import Mahasiswa

        User = get_user_model()
        try:
            user = User.objects.get(username="mahasiswa")
            mahasiswa = Mahasiswa.objects.get(user=user)
            mahasiswa.active_courses.add(course)
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n  Enrolled '{user.username}' into '{course.title}'"
                )
            )
        except (User.DoesNotExist, Mahasiswa.DoesNotExist):
            self.stdout.write(
                self.style.WARNING(
                    "\n  Test mahasiswa not found – skipping enrollment. "
                    "Run `seed_courses` first."
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅  Seeding selesai! "
                f"Course '{course.title}' ({course.code}) berhasil dibuat dengan "
                f"{len(modules_data)} modul."
            )
        )
