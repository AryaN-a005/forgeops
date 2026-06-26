# ForgeOps API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All endpoints (except `/health`) require Clerk JWT in Authorization header:
```
Authorization: Bearer <clerk-jwt-token>
```

---

## Health Check

### GET /health
Check if API is running.

**Response:**
```json
{
  "success": true,
  "message": "ForgeOps Backend Running"
}
```

---

## Organizations

### POST /organizations
Create a new organization.

**Body:**
```json
{
  "name": "Aryan Workspace",
  "slug": "aryan-workspace"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "name": "Aryan Workspace",
    "slug": "aryan-workspace",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### GET /organizations
Get all organizations for current user.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "name": "Aryan Workspace",
      "slug": "aryan-workspace",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /organizations/:id
Get organization by ID with members.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "name": "Aryan Workspace",
    "slug": "aryan-workspace",
    "memberships": [
      {
        "id": "cuid",
        "userId": "user-cuid",
        "role": "OWNER",
        "user": {
          "id": "user-cuid",
          "email": "aryan@example.com",
          "name": "Aryan"
        }
      }
    ]
  }
}
```

---

### PATCH /organizations/:id
Update organization.

**Body:**
```json
{
  "name": "New Name",
  "slug": "new-slug"
}
```

---

## Projects

### POST /projects
Create a new project.

**Body:**
```json
{
  "name": "ForgeOps",
  "description": "DevOps platform",
  "organizationId": "org-cuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "name": "ForgeOps",
    "description": "DevOps platform",
    "organizationId": "org-cuid",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### GET /projects?organizationId=:orgId
Get all projects for an organization.

**Query Parameters:**
- `organizationId` (required) - Organization ID

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "name": "ForgeOps",
      "organizationId": "org-cuid"
    }
  ]
}
```

---

### GET /projects/:id
Get project details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "name": "ForgeOps",
    "description": "DevOps platform",
    "organizationId": "org-cuid",
    "environments": [],
    "deployments": []
  }
}
```

---

### PATCH /projects/:id
Update project.

**Body:**
```json
{
  "name": "ForgeOps V2",
  "description": "Updated description"
}
```

---

### DELETE /projects/:id
Delete project.

**Response (200):**
```json
{
  "success": true,
  "message": "Project deleted"
}
```

---

## Environments

### POST /environments
Create environment for a project.

**Body:**
```json
{
  "projectId": "project-cuid",
  "name": "Production",
  "type": "PRODUCTION"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "projectId": "project-cuid",
    "name": "Production",
    "type": "PRODUCTION",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### GET /environments?projectId=:projId
Get all environments for a project.

**Query Parameters:**
- `projectId` (required) - Project ID

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "name": "Development",
      "type": "DEVELOPMENT"
    },
    {
      "id": "cuid",
      "name": "Production",
      "type": "PRODUCTION"
    }
  ]
}
```

---

### GET /environments/:id
Get environment details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "projectId": "project-cuid",
    "name": "Production",
    "type": "PRODUCTION",
    "secrets": [],
    "variables": []
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "AUTH_REQUIRED",
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "DUPLICATE_ENTRY",
  "message": "Resource already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "Internal server error"
}
```
