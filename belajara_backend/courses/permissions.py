from rest_framework.permissions import BasePermission


class IsInstructor(BasePermission):
    """Allow access only to authenticated users with is_instructor=True."""

    message = "Hanya dosen yang dapat mengakses endpoint ini."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'is_instructor', False)
        )
