from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

class CsrfExemptForTokenMiddleware(MiddlewareMixin):
    """
    Middleware che esenta gli endpoint di autenticazione JWT dalla protezione CSRF.
    """
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Esenta gli endpoint per il token JWT dalla protezione CSRF
        path = request.path_info.lstrip('/')
        if path.startswith('api/token/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None
