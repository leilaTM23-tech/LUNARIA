# Imagen oficial de desarrollo de Microsoft para Node.js 22 (LTS actual) y TypeScript en Debian Bookworm
FROM mcr.microsoft.com/devcontainers/typescript-node:22-bookworm

# Variables de entorno para entorno de desarrollo
ENV NODE_ENV=development

# Asegurar paquetes esenciales y herramientas útiles en el contenedor
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        curl \
        git \
        ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

