from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Order, CustomerProfile
from .serializers import OrderSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.get('order', request.data)
        
        # Intercept fake payments
        is_fake = data.get('is_fake_payment', False)
        if is_fake:
            data['status'] = 'PAID_TEST'
            
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def api_register(request):
    data = request.data
    full_name = data.get('fullName', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    address = data.get('address', '').strip()
    password = data.get('password', '').strip()

    if not full_name:
        return Response({'error': 'Full name is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not email or '@' not in email:
        return Response({'error': 'A valid email address is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not password or len(password) < 4:
        return Response({'error': 'Password must be at least 4 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username__iexact=email).exists() or User.objects.filter(email__iexact=email).exists():
        return Response({'error': 'An account with this email address already exists. Please sign in.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=full_name,
    )
    profile = CustomerProfile.objects.create(
        user=user,
        phone=phone or '+977 9801234567',
        delivery_address=address or 'Kathmandu, Nepal'
    )

    return Response({
        'user': {
            'name': user.first_name,
            'email': user.email,
            'phone': profile.phone,
            'address': profile.delivery_address,
            'is_staff': False,
            'memberSince': user.date_joined.strftime('%b %Y'),
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    data = request.data
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return Response({'error': 'Please provide both email and password.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=email).first() or User.objects.filter(username__iexact=email).first()

    if not user:
        return Response({
            'error': 'Account not found. No user exists with this email. Please click "Create Account" to sign up.'
        }, status=status.HTTP_404_NOT_FOUND)

    if not user.check_password(password):
        return Response({
            'error': 'Incorrect password. Please verify your credentials and try again.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    profile, _ = CustomerProfile.objects.get_or_create(user=user)

    return Response({
        'user': {
            'name': user.first_name or user.username,
            'email': user.email,
            'phone': profile.phone or '+977 9801234567',
            'address': profile.delivery_address or 'Kathmandu, Nepal',
            'is_staff': bool(user.is_staff or user.is_superuser),
            'memberSince': user.date_joined.strftime('%b %Y'),
        }
    }, status=status.HTTP_200_OK)
