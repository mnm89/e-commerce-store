FROM node:20 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
# Install dependencies based on the preferred package manager
COPY package.json yarn.lock ./
RUN yarn


## Builder
FROM base AS builder
ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}
ARG ADMIN_PATH
ENV ADMIN_PATH=${ADMIN_PATH}
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


FROM base as server
ENV NODE_ENV=production
ENV DISABLE_ADMIN=true
WORKDIR /app
COPY --from=builder  /app/.medusa/server/ ./
COPY --from=deps /app/node_modules ./node_modules
RUN rm -rf /app/public
ENTRYPOINT [ "npm"]
CMD ["start"]


FROM base as admin
ENV NODE_ENV=production
ENV DISABLE_ADMIN=false
WORKDIR /app
COPY --from=builder  /app/.medusa/server/public/admin ./
RUN npm install -g serve
# By default will serve static files on port 3000 
CMD ["serve","-s","."]