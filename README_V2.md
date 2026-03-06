# Institut Gabriel Rita - School Management System

## Project Overview
This is a microservices-based architecture for managing the Institut Gabriel Rita. It includes services for student management, finance, planning, and bulletins.

## Architecture
- **Frontend**: React (Vite)
- **Backend Services**: NestJS
  - `service-core-scolarite`: Manages students, staff, classes, etc.
  - `service-finance`: Manages payments and invoices.
  - `service-planning`: Manages schedules and courses.
  - `service-bulletins`: Manages grades and report cards.
  - `service-dashboard`: Aggregates data for the frontend.
- **Infrastructure**:
  - PostgreSQL (Database)
  - RabbitMQ (Messaging)
  - Redis (Caching)
  - Traefik (Reverse Proxy)

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (for local development)

### Installation

1. **Clone the repository** (if you haven't already).
2. **Start the infrastructure**:
   ```bash
   docker-compose up -d --build
   ```
   This command will build all images and start the containers.

### Accessing the Application

- **Frontend**: http://localhost:5173
- **Traefik Dashboard**: http://localhost:8080
- **API Gateways**:
  - Core: http://localhost/api/core
  - Finance: http://localhost/api/finance
  - Planning: http://localhost/api/planning
  - Bulletins: http://localhost/api/bulletins

### API Documentation (Swagger)
Each service exposes a Swagger UI at `/api`:
- Core: http://localhost:3000/api (mapped via Traefik)

## Development
To add a new module, use the NestJS CLI inside the respective service folder:
```bash
cd service-core-scolarite
nest g resource modules/new-module
```
