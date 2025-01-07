FROM node:20-slim

WORKDIR /app

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