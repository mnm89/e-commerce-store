import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:9000",
      authCors: process.env.AUTH_CORS || "http://localhost:9000",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    workerMode: (process.env.WORKER_MODE as any) || "shared",
    redisUrl: process.env.REDIS_URL,
    sessionOptions: {
      resave: false,
      saveUninitialized: false,
      ttl: 1000 * 60 * 60 * 24,
    },
  },
  admin: {
    disable: process.env.DISABLE_ADMIN === "true",
    backendUrl: process.env.BACKEND_URL || "http://localhost:9000",
    path: (process.env.ADMIN_PATH as any) || "/app",
  },
  modules: [
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: {
        redis: {
          url: process.env.REDIS_URL,
        },
      },
    },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          {
            id: "locking-redis",
            is_default: true,
            resolve: "@medusajs/medusa/locking-redis",
            options: {
              redisUrl: process.env.REDIS_URL,
            },
          },
        ],
      },
    },
  ],
});
