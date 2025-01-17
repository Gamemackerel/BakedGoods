FROM node:20-slim

WORKDIR /app

# Install OpenSSL and other required dependencies
RUN apt-get update && \
    apt-get install -y openssl libssl-dev ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm install

# Prisma setup
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the code
COPY . .

# Expose the port
EXPOSE 3000

# Start in development mode
CMD ["npm", "run", "dev"]