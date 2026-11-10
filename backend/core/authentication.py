from rest_framework.authentication import SessionAuthentication as BaseSessionAuthentication


class Enforce401SessionAuthentication(BaseSessionAuthentication):
    """
    SessionAuthentication that provides a WWW-Authenticate header so that DRF
    returns HTTP 401 Unauthorized (instead of coercing to HTTP 403 Forbidden)
    when unauthenticated requests hit IsAuthenticated endpoints.
    """

    def authenticate_header(self, request):
        return 'Session realm="api"'
