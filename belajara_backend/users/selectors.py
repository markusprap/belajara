# Data fetching logic for users app
from .models import User, Mahasiswa

def get_mahasiswa_by_nim(*, nim: str) -> Mahasiswa:
    return Mahasiswa.objects.get(nim=nim)

def get_mahasiswa_by_user(*, user: User) -> Mahasiswa:
    return Mahasiswa.objects.get(user=user)
