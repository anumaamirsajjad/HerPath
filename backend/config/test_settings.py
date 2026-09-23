import os
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent


def _check(**env):
    base = {k: v for k, v in os.environ.items() if k not in ("DEBUG", "SECRET_KEY", "ALLOWED_HOSTS")}
    return subprocess.run([sys.executable, "manage.py", "check"], cwd=BACKEND, env={**base, **env},
                          capture_output=True, text=True)


def test_debug_defaults_off_and_dev_key_refused():
    r = _check()  # no DEBUG, no SECRET_KEY: must refuse to boot with the committed dev key
    assert r.returncode != 0 and "SECRET_KEY" in r.stderr


def test_prod_key_accepted():
    r = _check(SECRET_KEY="x" * 60, ALLOWED_HOSTS="example.com")
    assert r.returncode == 0, r.stderr


def test_debug_on_allows_dev_key():
    r = _check(DEBUG="1")
    assert r.returncode == 0, r.stderr
