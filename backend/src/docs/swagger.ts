export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ForgeOps API',
    version: '1.0.0',
    description:
      'ForgeOps backend API documentation for organizations, projects, repositories, environments, deployments, secrets, clusters, namespaces, and runtime visibility.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'System' },
    { name: 'Auth' },
    { name: 'Organizations' },
    { name: 'Projects' },
    { name: 'Repositories' },
    { name: 'Environments' },
    { name: 'Deployments' },
    { name: 'Secrets' },
    { name: 'Clusters' },
    { name: 'Namespaces' },
    { name: 'Runtime' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Use Clerk bearer token in production. For local dev, your auth bypass may allow requests without a token.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'organizationId is required' },
        },
      },

      MeResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'cmqs-user-123' },
              clerkId: { type: 'string', example: 'user_123' },
              email: { type: 'string', example: 'dev@forgeops.local' },
              name: { type: 'string', example: 'Dev User' },
              imageUrl: { type: 'string', nullable: true },
            },
          },
        },
      },

      Organization: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      CreateOrganizationInput: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string', example: 'Acme Org' },
          slug: { type: 'string', example: 'acme-org' },
        },
      },

      Project: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          organizationId: { type: 'string' },
          createdById: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      CreateProjectInput: {
        type: 'object',
        required: ['name', 'organizationId'],
        properties: {
          name: { type: 'string', example: 'ForgeOps API' },
          description: { type: 'string', example: 'Backend service' },
          organizationId: { type: 'string', example: 'cmqs-org-123' },
        },
      },

      Repository: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          provider: {
            type: 'string',
            enum: ['GITHUB', 'GITLAB', 'BITBUCKET'],
          },
          repoUrl: { type: 'string' },
          repoName: { type: 'string' },
          defaultBranch: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      CreateRepositoryInput: {
        type: 'object',
        required: ['projectId', 'provider', 'repoUrl', 'repoName'],
        properties: {
          projectId: { type: 'string' },
          provider: {
            type: 'string',
            enum: ['GITHUB', 'GITLAB', 'BITBUCKET'],
            example: 'GITHUB',
          },
          repoUrl: {
            type: 'string',
            example: 'https://github.com/your-org/forgeops',
          },
          repoName: { type: 'string', example: 'forgeops' },
          defaultBranch: { type: 'string', example: 'main' },
        },
      },

      Environment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          name: { type: 'string' },
          type: {
            type: 'string',
            enum: ['DEVELOPMENT', 'STAGING', 'PRODUCTION'],
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      CreateEnvironmentInput: {
        type: 'object',
        required: ['projectId', 'name', 'type'],
        properties: {
          projectId: { type: 'string' },
          name: { type: 'string', example: 'staging' },
          type: {
            type: 'string',
            enum: ['DEVELOPMENT', 'STAGING', 'PRODUCTION'],
            example: 'STAGING',
          },
        },
      },

      UpdateEnvironmentInput: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'production' },
          type: {
            type: 'string',
            enum: ['DEVELOPMENT', 'STAGING', 'PRODUCTION'],
            example: 'PRODUCTION',
          },
        },
      },

      Deployment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          environmentId: { type: 'string' },
          clusterId: { type: 'string', nullable: true },
          namespaceId: { type: 'string', nullable: true },
          imageTag: { type: 'string' },
          commitSha: { type: 'string' },
          status: {
            type: 'string',
            enum: ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'ROLLBACK'],
          },
          deployedById: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      CreateDeploymentInput: {
        type: 'object',
        required: ['projectId', 'environmentId', 'imageTag', 'commitSha'],
        properties: {
          projectId: { type: 'string' },
          environmentId: { type: 'string' },
          clusterId: { type: 'string', nullable: true },
          namespaceId: { type: 'string', nullable: true },
          imageTag: { type: 'string', example: 'v1.0.0' },
          commitSha: { type: 'string', example: 'abc123def456' },
        },
      },

      RollbackDeploymentInput: {
        type: 'object',
        properties: {
          toRevision: { type: 'integer', example: 1 },
        },
      },

      SecretMeta: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          environmentId: { type: 'string' },
          key: { type: 'string', example: 'DATABASE_URL' },
          createdById: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      CreateSecretInput: {
        type: 'object',
        required: ['projectId', 'environmentId', 'key', 'value'],
        properties: {
          projectId: { type: 'string' },
          environmentId: { type: 'string' },
          key: { type: 'string', example: 'DATABASE_URL' },
          value: { type: 'string', example: 'postgresql://user:pass@db:5432/app' },
        },
      },

      Cluster: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          provider: {
            type: 'string',
            enum: ['EKS', 'GKE', 'AKS', 'KIND', 'MINIKUBE'],
          },
          region: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      CreateClusterInput: {
        type: 'object',
        required: ['name', 'provider', 'region', 'kubeConfig'],
        properties: {
          name: { type: 'string', example: 'local-kind' },
          provider: {
            type: 'string',
            enum: ['EKS', 'GKE', 'AKS', 'KIND', 'MINIKUBE'],
            example: 'KIND',
          },
          region: { type: 'string', example: 'local' },
          kubeConfig: {
            type: 'string',
            description: 'Full kubeconfig YAML content as a string',
          },
        },
      },

      Namespace: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          clusterId: { type: 'string' },
          projectId: { type: 'string' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      CreateNamespaceInput: {
        type: 'object',
        required: ['clusterId', 'projectId', 'name'],
        properties: {
          clusterId: { type: 'string' },
          projectId: { type: 'string' },
          name: { type: 'string', example: 'forgeops-staging' },
        },
      },

      PodSummary: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          namespace: { type: 'string' },
          phase: { type: 'string' },
          podIP: { type: 'string', nullable: true },
          hostIP: { type: 'string', nullable: true },
          nodeName: { type: 'string', nullable: true },
          startTime: { type: 'string', nullable: true },
          labels: { type: 'object', additionalProperties: true },
          containers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                ready: { type: 'boolean' },
                restartCount: { type: 'integer' },
                image: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'API is healthy',
          },
        },
      },
    },

    '/api/v1/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MeResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },

    '/api/v1/organizations': {
      get: {
        tags: ['Organizations'],
        summary: 'List organizations for current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Organizations list',
          },
        },
      },
      post: {
        tags: ['Organizations'],
        summary: 'Create organization',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrganizationInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Organization created',
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },

    '/api/v1/organizations/{id}': {
      get: {
        tags: ['Organizations'],
        summary: 'Get organization by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Organization details' },
        },
      },
    },

    '/api/v1/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List projects by organization',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'organizationId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Projects list' },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create project',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProjectInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Project created' },
          '403': { description: 'RBAC failure' },
        },
      },
    },

    '/api/v1/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Project details' },
        },
      },
    },

    '/api/v1/repositories': {
      get: {
        tags: ['Repositories'],
        summary: 'Get repository by project',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'projectId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Repository details' },
        },
      },
      post: {
        tags: ['Repositories'],
        summary: 'Connect repository to project',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateRepositoryInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Repository connected' },
        },
      },
    },

    '/api/v1/repositories/{id}': {
      get: {
        tags: ['Repositories'],
        summary: 'Get repository by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Repository details' },
        },
      },
    },

    '/api/v1/environments': {
      get: {
        tags: ['Environments'],
        summary: 'List environments by project',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'projectId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Environments list' },
        },
      },
      post: {
        tags: ['Environments'],
        summary: 'Create environment',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateEnvironmentInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Environment created' },
        },
      },
    },

    '/api/v1/environments/{id}': {
      get: {
        tags: ['Environments'],
        summary: 'Get environment by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Environment details' },
        },
      },
      patch: {
        tags: ['Environments'],
        summary: 'Update environment',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateEnvironmentInput' },
            },
          },
        },
        responses: {
          '200': { description: 'Environment updated' },
        },
      },
    },

    '/api/v1/deployments': {
      get: {
        tags: ['Deployments'],
        summary: 'List deployments by project',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'projectId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Deployments list' },
        },
      },
      post: {
        tags: ['Deployments'],
        summary: 'Trigger deployment',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateDeploymentInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Deployment created' },
        },
      },
    },

    '/api/v1/deployments/{id}': {
      get: {
        tags: ['Deployments'],
        summary: 'Get deployment by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Deployment details' },
        },
      },
    },

    '/api/v1/deployments/{id}/restart': {
      post: {
        tags: ['Deployments'],
        summary: 'Restart a Kubernetes deployment rollout',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Deployment restarted' },
        },
      },
    },

    '/api/v1/deployments/{id}/rollback': {
      post: {
        tags: ['Deployments'],
        summary: 'Rollback a Kubernetes deployment rollout',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RollbackDeploymentInput' },
            },
          },
        },
        responses: {
          '200': { description: 'Deployment rolled back' },
        },
      },
    },

    '/api/v1/secrets': {
      get: {
        tags: ['Secrets'],
        summary: 'List secrets metadata by project and environment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'projectId', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'environmentId', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Secret metadata list' },
        },
      },
      post: {
        tags: ['Secrets'],
        summary: 'Create encrypted secret',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateSecretInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Secret created' },
        },
      },
    },

    '/api/v1/clusters': {
      get: {
        tags: ['Clusters'],
        summary: 'List clusters',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Clusters list' },
        },
      },
      post: {
        tags: ['Clusters'],
        summary: 'Create cluster',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateClusterInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Cluster created' },
        },
      },
    },

    '/api/v1/clusters/{id}': {
      get: {
        tags: ['Clusters'],
        summary: 'Get cluster by id',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Cluster details' },
        },
      },
    },

    '/api/v1/namespaces': {
      get: {
        tags: ['Namespaces'],
        summary: 'List namespaces by project',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'projectId', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Namespaces list' },
        },
      },
      post: {
        tags: ['Namespaces'],
        summary: 'Create namespace',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateNamespaceInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Namespace created' },
        },
      },
    },

    '/api/v1/clusters/{id}/pods': {
      get: {
        tags: ['Runtime'],
        summary: 'List pods in a namespace',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'projectId', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'namespace', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'app', required: false, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Pods list' },
        },
      },
    },

    '/api/v1/clusters/{id}/logs': {
      get: {
        tags: ['Runtime'],
        summary: 'Get pod logs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'projectId', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'namespace', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'pod', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'containerName', required: false, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Pod logs' },
        },
      },
    },
  },
} as const;