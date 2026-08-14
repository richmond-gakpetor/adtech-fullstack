import os

bind = "0.0.0.0:8000"
workers = int(os.getenv("GUNICORN_WORKERS", 2))
worker_class = "uvicorn.workers.UvicornWorker"
max_requests = 1000
max_requests_jitter = 50
timeout = 120

# Allow large file uploads (up to 15MB)
# Note: Nginx client_max_body_size must also be configured
limit_request_line = 8190
limit_request_fields = 100
limit_request_field_size = 8190

accesslog = "-"
errorlog = "-"
loglevel = os.getenv("GUNICORN_LOG_LEVEL", "info")

access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

proc_name = "xposure-gh-api"
