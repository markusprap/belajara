from typing import Optional
from users.models import User, Mahasiswa

def create_mahasiswa(
    *, 
    username: str, 
    password: str, 
    email: str, 
    nim: str, 
    jurusan: str, 
    universitas: str,
    first_name: str = "",
    last_name: str = ""
) -> Mahasiswa:
    user = User.objects.create_user(
        username=username, 
        password=password, 
        email=email,
        first_name=first_name,
        last_name=last_name,
        is_mahasiswa=True
    )
    mahasiswa = Mahasiswa.objects.create(
        user=user,
        nim=nim,
        jurusan=jurusan,
        universitas=universitas
    )
    return mahasiswa
