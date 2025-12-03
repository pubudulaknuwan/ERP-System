from .models import AuditLog


def log_action(
    user,
    action,
    model_name,
    object_id=None,
    object_repr='',
    changes=None,
    ip_address=None,
    user_agent=None,
    notes='',
):
    """Helper function to create audit log entries."""
    return AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=object_id,
        object_repr=object_repr,
        changes=changes or {},
        ip_address=ip_address,
        user_agent=user_agent,
        notes=notes,
    )

