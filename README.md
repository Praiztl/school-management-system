# School Management System API

A RESTful API built on the **Axion** template using Node.js, Express, MongoDB, JWT authentication, and role-based access control (RBAC).

---

## Table of Contents

- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Authentication Flow](#authentication-flow)
- [API Endpoints](#api-endpoints)
- [RBAC Matrix](#rbac-matrix)
- [Error Codes](#error-codes)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Assumptions](#assumptions)

---

## Architecture

```
school-management/
├── app.js                     # Express app setup (security, rate limiting, middleware)
├── index.js                   # Entry point
├── seed.js                    # Database seeder
├── loaders/
│   └── index.js               # Auto-loads all managers and mounts routers
├── connect/
│   └── db.js                  # MongoDB connection
├── managers/
│   ├── entity/                # Business logic layer
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── School.js
│   │   │   ├── Classroom.js
│   │   │   └── Student.js
│   │   ├── UserManager.js
│   │   ├── SchoolManager.js
│   │   ├── ClassroomManager.js
│   │   └── StudentManager.js
│   └── http/                  # Express routers (HTTP layer)
│       ├── AuthRouter.js
│       ├── SchoolRouter.js
│       ├── ClassroomRouter.js
│       └── StudentRouter.js
├── mws/                       # Middleware
│   ├── auth.mw.js             # JWT authentication + RBAC
│   └── validate.mw.js         # Joi request validation
├── libs/
│   ├── respond.js             # Standardized response helpers
│   └── token.js               # JWT sign/verify helpers
└── tests/                     # Jest + Supertest tests
```

---

## Database Schema

### User
| Field      | Type     | Description                                   |
|------------|----------|-----------------------------------------------|
| username   | String   | Unique username                               |
| email      | String   | Unique email (login)                          |
| password   | String   | bcrypt-hashed                                 |
| role       | Enum     | `superadmin` or `school_admin`                |
| school     | ObjectId | Reference to School (only for school_admin)   |
| isActive   | Boolean  | Soft-disable users                            |

### School
| Field    | Type    | Description                |
|----------|---------|----------------------------|
| name     | String  | School name (unique)       |
| address  | String  | Physical address           |
| phone    | String  | Contact phone              |
| email    | String  | School email               |
| website  | String  | School website URL         |
| isActive | Boolean | Soft-disable               |

### Classroom
| Field     | Type      | Description                        |
|-----------|-----------|------------------------------------|
| name      | String    | Classroom name (unique per school) |
| school    | ObjectId  | Parent school reference            |
| capacity  | Number    | Max number of students             |
| resources | Array     | `[{ name, quantity }]`             |
| isActive  | Boolean   | Soft-disable                       |

### Student
| Field            | Type      | Description                            |
|------------------|-----------|----------------------------------------|
| firstName        | String    | First name                             |
| lastName         | String    | Last name                              |
| email            | String    | Unique email                           |
| dateOfBirth      | Date      | Date of birth                          |
| gender           | Enum      | `male`, `female`, `other`              |
| phone            | String    | Contact phone                          |
| address          | String    | Home address                           |
| school           | ObjectId  | Enrolled school                        |
| classroom        | ObjectId  | Enrolled classroom (nullable)          |
| transferHistory  | Array     | History of school/classroom transfers  |

---

## Setup & Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd school-management

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Seed the database (creates superadmin user)
npm run seed

# 5. Start the server
npm start
```

---

## Environment Variables

| Variable   | Default                                     | Description          |
|------------|---------------------------------------------|----------------------|
| PORT       | 3000                                        | Server port          |
| NODE_ENV   | development                                 | Environment          |
| MONGO_URI  | mongodb://localhost:27017/school_management | MongoDB connection   |
| JWT_SECRET | change-me-in-production                     | JWT signing secret   |
| JWT_EXPIRES| 7d                                          | JWT expiry duration  |

---

## Running the App

```bash
npm start        # Production
npm run dev      # Development (nodemon)
npm test         # Run tests
node seed.js     # Seed initial superadmin
```

Add to `package.json` scripts:
```json
"seed": "node seed.js"
```

---

## Authentication Flow

```
1. POST /api/auth/register  →  Returns JWT token
2. POST /api/auth/login     →  Returns JWT token
3. Include token in all subsequent requests:
   Authorization: Bearer <token>
```

Tokens are signed with HS256 and expire in 7 days (configurable).

---

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Health Check
```
GET /health
```

---

### Authentication

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "securepassword",
  "role": "superadmin"           // "superadmin" or "school_admin"
  "school": "<school_id>"        // Required if role is school_admin
}
```
**Response 201:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": { "user": {...}, "token": "eyJ..." }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "securepassword"
}
```
**Response 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": { "user": {...}, "token": "eyJ..." }
}
```

#### Get Profile
```
GET /api/auth/me
Authorization: Bearer <token>
```

---

### Schools

#### Create School *(Superadmin only)*
```
POST /api/schools
Authorization: Bearer <token>

{
  "name": "Elm High School",
  "address": "123 Elm Street, Lagos",
  "phone": "+234800000000",
  "email": "info@elm.edu",
  "website": "https://elm.edu"
}
```

#### List Schools
```
GET /api/schools?page=1&limit=20&search=elm
Authorization: Bearer <token>
```

#### Get School
```
GET /api/schools/:id
Authorization: Bearer <token>
```

#### Update School *(Superadmin only)*
```
PUT /api/schools/:id
Authorization: Bearer <token>

{ "name": "Updated Name" }
```

#### Delete School *(Superadmin only)*
```
DELETE /api/schools/:id
Authorization: Bearer <token>
```

---

### Classrooms

#### Create Classroom
```
POST /api/classrooms
Authorization: Bearer <token>

{
  "name": "Room 101",
  "school": "<school_id>",
  "capacity": 30,
  "resources": [
    { "name": "Projector", "quantity": 1 },
    { "name": "Desks", "quantity": 30 }
  ]
}
```

#### List Classrooms
```
GET /api/classrooms?school=<school_id>&page=1&limit=20
Authorization: Bearer <token>
```
> School admins automatically see only their school's classrooms.

#### Get Classroom
```
GET /api/classrooms/:id
Authorization: Bearer <token>
```

#### Update Classroom
```
PUT /api/classrooms/:id
Authorization: Bearer <token>

{ "capacity": 35 }
```

#### Delete Classroom
```
DELETE /api/classrooms/:id
Authorization: Bearer <token>
```

---

### Students

#### Enroll Student
```
POST /api/students
Authorization: Bearer <token>

{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@students.com",
  "dateOfBirth": "2010-05-15",
  "gender": "female",
  "school": "<school_id>",
  "classroom": "<classroom_id>"
}
```

#### List Students
```
GET /api/students?school=<id>&classroom=<id>&search=jane&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Student
```
GET /api/students/:id
Authorization: Bearer <token>
```

#### Update Student
```
PUT /api/students/:id
Authorization: Bearer <token>

{ "classroom": "<new_classroom_id>" }
```

#### Transfer Student
```
POST /api/students/:id/transfer
Authorization: Bearer <token>

{
  "toSchool": "<new_school_id>",      // optional
  "toClassroom": "<new_classroom_id>", // optional (at least one required)
  "note": "Family relocated"
}
```

#### Delete Student
```
DELETE /api/students/:id
Authorization: Bearer <token>
```

---

## RBAC Matrix

| Action                  | Superadmin | School Admin        |
|-------------------------|:----------:|:-------------------:|
| Create school           | ✅         | ❌                  |
| Read all schools        | ✅         | ✅ (own only)       |
| Update/Delete school    | ✅         | ❌                  |
| Create classroom        | ✅         | ✅ (own school)     |
| Read classrooms         | ✅         | ✅ (own school)     |
| Update/Delete classroom | ✅         | ✅ (own school)     |
| Enroll student          | ✅         | ✅ (own school)     |
| Read students           | ✅         | ✅ (own school)     |
| Update student          | ✅         | ✅ (own school)     |
| Transfer student        | ✅         | ✅ (origin school)  |
| Delete student          | ✅         | ✅ (own school)     |

---

## Error Codes

| Status | Meaning                                   |
|--------|-------------------------------------------|
| 200    | Success                                   |
| 201    | Resource created                          |
| 400    | Validation error / Bad request            |
| 401    | Not authenticated                         |
| 403    | Forbidden (insufficient permissions)      |
| 404    | Resource not found                        |
| 409    | Conflict (duplicate)                      |
| 429    | Rate limit exceeded                       |
| 500    | Internal server error                     |

**Error response format:**
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

**Success response format:**
```json
{
  "success": true,
  "message": "Action description",
  "data": { ... }
}
```

---

## Running Tests

Tests use Jest + Supertest with an in-memory MongoDB instance (no external DB needed).

```bash
npm test
```

Test files:
- `tests/auth.test.js`          — Registration, login, profile
- `tests/school.test.js`        — School CRUD + RBAC
- `tests/classroom-student.test.js` — Classroom CRUD, student enrollment, transfer, capacity enforcement

---

## Deployment

### Using Railway / Render / Fly.io

1. Set environment variables in the platform dashboard
2. Set `MONGO_URI` to your MongoDB Atlas connection string
3. Deploy using the platform's Git integration

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

```bash
docker build -t school-management .
docker run -p 3000:3000 --env-file .env school-management
```

### MongoDB Atlas (Cloud)
```
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/school_management?retryWrites=true&w=majority
```

---

## Assumptions

1. **First user registration is open** — Any role can be registered via the API. In a production system, you would lock `role: superadmin` creation behind a secret or admin panel. The seeder script creates the initial superadmin.

2. **Soft delete is not implemented** — DELETE endpoints permanently remove records. The `isActive` field allows logical soft-disabling without deletion.

3. **Student email is globally unique** — A student cannot be enrolled in two schools simultaneously.

4. **Classroom capacity is enforced on enrollment** — Students cannot be added to a classroom that has reached its capacity limit.

5. **Transfer history is append-only** — Transfer records are never deleted, providing a full audit trail.

6. **School admin is assigned to exactly one school** — A user with role `school_admin` is linked to a single school at creation time.
