"""Serve the Django WSGI app with a thread pool (Windows stand-in for gunicorn gthread)."""
import argparse

import django
from django.core.wsgi import get_wsgi_application
from waitress import serve

parser = argparse.ArgumentParser()
parser.add_argument("--port", type=int, default=8765)
parser.add_argument("--threads", type=int, default=8)
args = parser.parse_args()

django.setup()
application = get_wsgi_application()
print(f"Serving on 127.0.0.1:{args.port} with {args.threads} threads", flush=True)
serve(application, host="127.0.0.1", port=args.port, threads=args.threads, connection_limit=1000)
