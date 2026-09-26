from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle, SimpleRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.views import APIView
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import SignupSerializer

User = get_user_model()


def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class AuthThrottle(ScopedRateThrottle):
    scope = "auth"


class LoginEmailThrottle(SimpleRateThrottle):
    """Limits password guesses against one account, whatever IP they come from."""
    scope = "login"

    def get_cache_key(self, request, view):
        email = str(request.data.get("email", "")).strip().lower()
        return self.cache_format % {"scope": self.scope, "ident": email} if email else None


class LoginView(TokenObtainPairView):
    throttle_classes = [AuthThrottle, LoginEmailThrottle]
    throttle_scope = "auth"


class LogoutView(APIView):
    """Revokes the refresh token so a copied token stops working after she logs out."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthThrottle]
    throttle_scope = "auth"

    def post(self, request):
        try:
            RefreshToken(str(request.data.get("refresh", ""))).blacklist()
        except TokenError:
            pass  # already invalid: nothing to revoke
        return Response(status=status.HTTP_204_NO_CONTENT)


class SignupView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthThrottle]
    throttle_scope = "auth"

    def post(self, request):
        s = SignupSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        return Response(tokens_for(s.save()), status=status.HTTP_201_CREATED)


class MeView(APIView):
    def get(self, request):
        u = request.user
        return Response({"id": u.id, "email": u.email, "has_profile": hasattr(u, "profile")})

    def delete(self, request):
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


from django.shortcuts import get_object_or_404  # noqa: E402

from .models import Profile  # noqa: E402
from .serializers import ProfileSerializer  # noqa: E402


class ProfileView(APIView):
    def get(self, request):
        return Response(ProfileSerializer(get_object_or_404(Profile, user=request.user)).data)

    def put(self, request):
        profile = Profile.objects.filter(user=request.user).first()
        old = profile.data if profile else None
        s = ProfileSerializer(profile, data=request.data)
        s.is_valid(raise_exception=True)
        profile = s.save(user=request.user)
        from counters.diff import record_profile_change

        record_profile_change(request.user, old, profile.data)
        return Response(ProfileSerializer(profile).data)

    def patch(self, request):
        if "data" in request.data:
            return Response({"data": ["Use PUT to change profile data."]}, status=400)
        profile = get_object_or_404(Profile, user=request.user)
        s = ProfileSerializer(profile, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        return Response(ProfileSerializer(s.save()).data)
