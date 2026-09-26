web: python backend/manage.py migrate --noinput && python backend/manage.py collectstatic --noinput && gunicorn config.wsgi --bind 0.0.0.0:$PORT --chdir backend
