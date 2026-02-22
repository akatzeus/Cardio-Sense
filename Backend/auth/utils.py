from models import User

def authenticate_user(email: str, password: str):
    """
    Validates user credentials.
    Returns User object if valid, else None.
    """
    user = User.query.filter_by(email=email).first()

    if not user:
        return None

    if not user.check_password(password):
        return None

    return user