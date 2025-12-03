from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'role_display', 'phone', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'created_at', 'updated_at')
        read_only_fields = ('id', 'date_joined', 'created_at', 'updated_at', 'is_superuser')


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'role', 'phone', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating users by admin."""
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password], allow_blank=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role', 'phone', 'first_name', 'last_name', 'is_active', 'is_staff')
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

