from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, v):
        v = v.lower()
        if User.objects.filter(email=v).exists():
            # Do not confirm that the address has an account.
            raise serializers.ValidationError("We couldn't create an account with this email. If you already use HerPath, log in or reset your password.")
        return v

    def validate_password(self, v):
        validate_password(v)
        return v

    def create(self, data):
        return User.objects.create_user(**data)


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    lang = serializers.ChoiceField(["en", "ur"], default="en")


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField()

    def validate_password(self, v):
        validate_password(v)
        return v


from . import choices  # noqa: E402
from .models import Profile  # noqa: E402


class StrictFloat(serializers.FloatField):
    def to_internal_value(self, v):
        if isinstance(v, str):
            raise serializers.ValidationError("Must be a number, not text.")
        return super().to_internal_value(v)


class StrictInt(serializers.IntegerField):
    def to_internal_value(self, v):
        if isinstance(v, str):
            raise serializers.ValidationError("Must be a number, not text.")
        return super().to_internal_value(v)


class TestsSerializer(serializers.Serializer):
    # Real-world bounds for each standardized test
    TEST_BOUNDS = {
        "mdcat": (0, 200),
        "ecat": (0, 300),
        "nat": (0, 200),
        "gat": (0, 100),
        "hat": (0, 100),
        "ielts": (0, 9),
        "toefl": (0, 120),
        "duolingo": (0, 160),
        "gre": (0, 340),
    }

    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        for t in choices.TESTS:
            min_v, max_v = self.TEST_BOUNDS.get(t, (0, 1000))
            self.fields[t] = StrictFloat(min_value=min_v, max_value=max_v, required=False, allow_null=True)


class DocumentsSerializer(serializers.Serializer):
    def __init__(self, *a, **k):
        super().__init__(*a, **k)
        for d in choices.DOCUMENTS:
            self.fields[d] = serializers.BooleanField(required=False)


class ProfileDataSerializer(serializers.Serializer):
    age = StrictInt(min_value=10, max_value=70, required=False, allow_null=True)
    domicile = serializers.ChoiceField(choices.PROVINCES, required=False, allow_null=True)
    district = serializers.CharField(max_length=80, allow_blank=True, required=False, allow_null=True)
    categories = serializers.ListField(child=serializers.ChoiceField(choices.CATEGORIES), required=False)
    board = serializers.ChoiceField(choices.BOARDS, required=False, allow_null=True)
    matricPercent = StrictFloat(min_value=0, max_value=100, required=False, allow_null=True)
    interPercent = StrictFloat(min_value=0, max_value=100, required=False, allow_null=True)
    interStream = serializers.ChoiceField(choices.STREAMS, required=False, allow_null=True)
    level = serializers.ChoiceField(choices.LEVELS, required=False, allow_null=True)
    targetLevel = serializers.ChoiceField(choices.TARGET_LEVELS, required=False, allow_null=True)
    degree = serializers.CharField(max_length=120, allow_blank=True, required=False, allow_null=True)
    yearsOfEducation = StrictInt(min_value=10, max_value=22, required=False, allow_null=True)
    cgpa = StrictFloat(min_value=0, max_value=4, required=False, allow_null=True)
    universityType = serializers.ChoiceField(choices.UNIVERSITY_TYPES, required=False, allow_null=True)
    enrolledUniversity = serializers.CharField(max_length=120, allow_blank=True, required=False, allow_null=True)
    tests = TestsSerializer(required=False)
    monthlyIncome = StrictInt(min_value=0, max_value=10000000, required=False, allow_null=True)  # ~$35k USD
    workYears = StrictFloat(min_value=0, max_value=50, required=False, allow_null=True)
    volunteering = serializers.BooleanField(required=False)
    leadership = serializers.BooleanField(required=False)
    documents = DocumentsSerializer(required=False)
    studyIn = serializers.ChoiceField(choices.STUDY_IN, required=False, allow_null=True)
    preferredCountries = serializers.ListField(child=serializers.CharField(max_length=60), required=False)
    fields = serializers.ListField(child=serializers.CharField(max_length=60), required=False)

    def to_internal_value(self, data):
        # Nested serializers drop unknown keys silently; reject them so typos surface.
        unknown = set(data) - set(self.fields)
        if unknown:
            raise serializers.ValidationError({"non_field_errors": [f"Unknown fields: {sorted(unknown)}"]})
        bad_docs = set(data.get("documents") or {}) - set(choices.DOCUMENTS)
        if bad_docs:
            raise serializers.ValidationError({"documents": [f"Unknown documents: {sorted(bad_docs)}"]})
        return super().to_internal_value(data)


class ProfileSerializer(serializers.ModelSerializer):
    data = ProfileDataSerializer()

    class Meta:
        model = Profile
        fields = ["data", "analytics_opt_out", "updated_at"]
        read_only_fields = ["updated_at"]

    # ModelSerializer refuses nested writes by default; `data` is a plain JSONField so write it directly.
    def create(self, validated):
        return Profile.objects.create(**validated)

    def update(self, instance, validated):
        for k, v in validated.items():
            setattr(instance, k, v)
        instance.save()
        return instance
