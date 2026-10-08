from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# One shared limiter, attached to the app in app.py (limiter.init_app(app)).
# Kept in its own module so auth.py / chat.py can import it without a
# circular import on app.py.
limiter = Limiter(key_func=get_remote_address, default_limits=[])
