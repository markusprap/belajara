from rest_framework import serializers
from .models import Course, CourseModule, SubChapter

class SubChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubChapter
        fields = ['id', 'module', 'title', 'type', 'order', 'video_url', 'content', 'duration']
        read_only_fields = ['module']

class CourseModuleSerializer(serializers.ModelSerializer):
    subchapters = SubChapterSerializer(many=True, read_only=True)

    class Meta:
        model = CourseModule
        fields = ['id', 'title', 'description', 'order', 'subchapters']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not data.get('subchapters'):
            clean_title = instance.title
            if ":" in clean_title:
                clean_title = clean_title.split(":", 1)[1].strip()
            # remove 'Modul X:' if present
            import re
            clean_title = re.sub(r'^Modul\s+\d+:\s*', '', clean_title, flags=re.IGNORECASE).strip()

            data['subchapters'] = [
                {
                    "id": f"{instance.id}_sub1",
                    "module": instance.id,
                    "title": f"Sub Bab 1: Video - {clean_title}",
                    "type": "video",
                    "order": 1,
                    "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                    "content": "",
                    "duration": "10 mnt"
                },
                {
                    "id": f"{instance.id}_sub2",
                    "module": instance.id,
                    "title": f"Sub Bab 2: Materi Utama - {clean_title}",
                    "type": "reading",
                    "order": 2,
                    "video_url": None,
                    "content": f"# Pengenalan {clean_title}\n\nSelamat datang di materi utama Modul {instance.order}. Silakan pelajari konsep dasar, definisi, dan mekanisme kerja untuk topik ini.",
                    "duration": "15 mnt"
                },
                {
                    "id": f"{instance.id}_sub3",
                    "module": instance.id,
                    "title": "Sub Bab 3: Studi Kasus & Analisis Mendalam",
                    "type": "reading",
                    "order": 3,
                    "video_url": None,
                    "content": f"# Studi Kasus: {clean_title}\n\nDi sini kita akan mempelajari analisis mendalam dan studi kasus nyata terkait implementasi {clean_title} di industri.",
                    "duration": "15 mnt"
                },
                {
                    "id": f"{instance.id}_sub4",
                    "module": instance.id,
                    "title": f"Kuis Kompetensi Modul {instance.order}",
                    "type": "quiz",
                    "order": 4,
                    "video_url": None,
                    "content": "",
                    "duration": "15 mnt"
                },
                {
                    "id": f"{instance.id}_sub5",
                    "module": instance.id,
                    "title": f"Diskusi Tanya Jawab Modul {instance.order}",
                    "type": "forum",
                    "order": 5,
                    "video_url": None,
                    "content": "",
                    "duration": "10 mnt"
                }
            ]
        return data

class CourseSerializer(serializers.ModelSerializer):
    modules = CourseModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'code', 'title', 'description', 'sks', 'semester', 'department', 'price', 'is_premium', 'modules']


