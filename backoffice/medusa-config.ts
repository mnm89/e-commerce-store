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
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
              additional_client_config: {
                forcePathStyle: true,
              },
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              capture: true,
              automatic_payment_methods: true,
              payment_description: "Thank you for your purchase",
              // add webhook config after deployment
              //webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            },
          },
          {
            resolve: `./src/modules/payment-paypal`,
            id: "paypal",
            options: {
              sandbox: process.env.PAYPAL_SANDBOX,
              clientId: process.env.PAYPAL_CLIENT_ID,
              clientSecret: process.env.PAYPAL_CLIENT_SECRET,
              // add webhook config after deployment
              //auth_webhook_id: process.env.PAYPAL_AUTH_WEBHOOK_ID,
            },
          },
        ],
      },
    },
  ],
});
