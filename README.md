# Full-Stack E-commerce Project

This repository is a full-stack e-commerce solution built using **Medusa v2** for the backend and the **Medusa Next.js Starter** for the frontend. The setup includes **MinIO** for file storage and integrates **Stripe** and **PayPal** as payment providers. The project is containerized using **Docker Compose** to simplify running the entire stack locally or in production environments.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Medusa v2 Backend**: A robust e-commerce backend supporting custom integrations and extensibility.
- **Next.js Frontend**: A responsive, modern front end based on the Medusa Next.js Starter.
- **File Storage with MinIO**: Store media assets and files in a self-hosted or cloud-compatible storage.
- **Payment Integrations**: Supports Stripe and PayPal for secure and flexible payment options.
- **Dockerized Setup**: Deploy all services (PostgreSQL, Redis, MinIO, and the application) with Docker Compose.

## Getting Started

### Prerequisites

- **Docker & Docker Compose**: Make sure Docker is installed. [Get Docker](https://docs.docker.com/get-docker/)
- **Yarn**: The package manager used in this project. [Install Yarn](https://yarnpkg.com/getting-started/install)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/mnm89/e-commerce-store.git
   cd e-commerce-store
   ```

2. Install dependencies for the frontend and backend:

   ```bash
   # Backend
   cd backoffice
   yarn install

   # Frontend
   cd ../storefront
   yarn install
   ```

### Environment Variables

Copy the `.env.template` files in the `backoffice` and `storefront` folders and create `.env` files based on them. Customize the values as needed, including keys for Stripe, PayPal, and MinIO configurations.

## Running the Application

### First Run

to run the application first time we need to seed the database and create a bucket manually. to do so we need to run:

```bash
docker-compose up db redis minio -d
```

- seeding database :

```bash
cd backoffice
npm run seed
npm run start
```

- creating admin account :

```bash
npx medusa user --email <email> [--password <password>]
```

- getting the publishable api key for the storefront:

    navigate to <http://localhost:9000/app> and login with the credentials created previously. click on the settings tab on the left menu bottom then Publishable API keys (or navigate to <http://localhost:9000/app/settings/publishable-api-keys> directly). copy the api key and past it on the .env file under storefront

    ```javascript
    EXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_....
    ```

- create a minio public bucket and get the ACCESS_KEY_ID  and SECRET_ACCESS_KEY
  
    navigate to <http://localhost:9001> use the minioadmin for both username and password. on the left menu click 'Access Keys' and then click create access key.
    the click 'Bucket' and create a bucket with the name 'public'.
    on the created bucket click on the pencil next to the 'Access Policy' and past the code bellow after selecting custom on the select box

     ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "AWS": [
                        "*"
                    ]
                },
                "Action": [
                    "s3:GetObject"
                ],
                "Resource": [
                    "arn:aws:s3:::public/*"
                ]
            }
        ]
    }
    ```

    finally don't forget to update the .env under the backoffice

    ```javascript
        S3_FILE_URL=http://localhost:9999/public
        S3_ACCESS_KEY_ID=....
        S3_SECRET_ACCESS_KEY=....
        S3_REGION=us-east-1
        S3_BUCKET=public
        S3_ENDPOINT=http://localhost:9999
    ```

- create stripe account and update env in both backoffice and storefront.
    got <http://localhost:9000/app/settings/regions> and select your default region click edit and add stripe to payment providers

- create paypal account and update env in both backoffice and storefront.
    got <http://localhost:9000/app/settings/regions> and select your default region click edit and add paypal to payment providers

### Dev

```bash
docker-compose up db redis minio -d
cd backoffice
yarn dev
cd ../storefront
yarn dev
```

### Accessing the Application

- **Backend API**: <http://localhost:9000>
- **Frontend**: <http://localhost:8000>

## Project Structure

```bash
e-commerce-store
├── backoffice            # Medusa backend
├── storefront           # Next.js frontend
├── docker-compose.yml # Docker Compose file for the entire stack
└── README.md          # Project documentation
```

## Tech Stack

- **Backend**: Medusa v2, Node.js, Express
- **Frontend**: Next.js, React
- **Storage**: MinIO
- **Payments**: Stripe, PayPal
- **Database**: PostgreSQL
- **Caching**: Redis
- **Containerization**: Docker, Docker Compose

## Contributing

Contributions are welcome! Please fork this repository and submit a pull request.

## License

This project is licensed under the MIT License.

---

This README provides an overview and setup guide. Feel free to adjust sections to better reflect your project's specifics.
