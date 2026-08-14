# Xposure GH - Backend API

**Billboard Advertising Marketplace for Ghana** 🇬🇭

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?style=flat&logo=FastAPI)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg?style=flat&logo=python)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-316192.svg?style=flat&logo=postgresql)](https://postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A complete backend API for connecting billboard owners with advertisers in Ghana. Features real-time chat, payment processing (Paystack), file uploads (AWS S3), email notifications, reviews, and admin dashboard.

---

## Features

### **Core Functionality:**
- 🔐 **JWT Authentication** - Secure login with access & refresh tokens
- 📋 **Billboard Listings** - Complete CRUD with search & filters
- 💬 **Real-time Chat** - WebSocket-based messaging with Redis pub/sub
- 📁 **File Uploads** - AWS S3 integration with CloudFront CDN
- 💳 **Payments** - Paystack integration for Ghana (GHS)
- ⭐ **Review System** - Rate billboards, owners, and advertisers
- 📧 **Email Notifications** - Automated emails via Resend API
- 👤 **Admin Dashboard** - User & billboard management

### **Technical Highlights:**
- ✅ Async/await throughout (FastAPI + SQLAlchemy)
- ✅ 49 REST API endpoints
- ✅ PostgreSQL with Alembic migrations
- ✅ Role-based access control (RBAC)
- ✅ Comprehensive input validation (Pydantic)
- ✅ Production-ready deployment configs
- ✅ Extensive documentation

---

## Quick Start

### **Prerequisites:**
- Python 3.11+
- PostgreSQL (running locally)

## Documentation

## 🗄️ Database Schema

### **Tables (8):**
1. **users** - User accounts (owner, advertiser, admin)
2. **billboards** - Billboard listings with coordinates
3. **saved_billboards** - User saved billboards
4. **conversations** - Chat conversations
5. **messages** - Chat message history
6. **payments** - Payment records (Paystack)
7. **billboard_listing_payments** - Listing fee access tracking
8. **reviews** - Billboard/Owner/Advertiser reviews

### **Migrations:**
```bash
# Check current migration status
alembic current

# Run all migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"
```


## 🔧 Development

### **Run Development Server:**
```bash
# With auto-reload
uvicorn app.main:app --reload --port 8000

# Or
python -m app.main
```

### **Database Management:**
```bash
# Create new migration
alembic revision --autogenerate -m "Add new table"

# Run migrations
alembic upgrade head

# Rollback one version
alembic downgrade -1

# Reset database
alembic downgrade base
alembic upgrade head
python scripts/seed_database.py
```

### **Code Quality:**
```bash
# Format code
black app/

# Lint
flake8 app/

# Type checking
mypy app/
```

---

## Tech Stack

### **Core:**
- **FastAPI** - Modern async web framework
- **SQLAlchemy** - Async ORM
- **Alembic** - Database migrations
- **Pydantic** - Data validation
- **PostgreSQL** - Primary database
- **Redis** - WebSocket pub/sub & caching

### **Authentication:**
- **python-jose** - JWT tokens
- **passlib** - Password hashing (bcrypt)

### **Integrations:**
- **Paystack** - Payment processing (Ghana)
- **Resend** - Email notifications
- **AWS S3** - File storage
- **CloudFront** - CDN

### **Testing & Dev:**
- **httpx** - Async HTTP client
- **uvicorn** - ASGI server
- **gunicorn** - WSGI server (production)

---


## Contributing

This is a private project. For inquiries, contact the development team.

---

## 📄 License

Copyright © 2026 Xposure GH. All rights reserved.

---

**Built with ❤️ for the Ghana billboard advertising market 🇬🇭**