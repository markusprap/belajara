from users.models import User, InstructorProfile

def create_instructor(
    *, 
    username: str, 
    password: str, 
    email: str, 
    nidn: str, 
    bidang_keahlian: str, 
    universitas: str,
    first_name: str = "",
    last_name: str = ""
) -> InstructorProfile:
    user = User.objects.create_user(
        username=username, 
        password=password, 
        email=email,
        first_name=first_name,
        last_name=last_name,
        is_instructor=True,
        is_mahasiswa=False
    )
    instructor = InstructorProfile.objects.create(
        user=user,
        nidn=nidn,
        bidang_keahlian=bidang_keahlian,
        universitas=universitas
    )
    return instructor
