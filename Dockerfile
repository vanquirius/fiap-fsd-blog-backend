# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy only production dependencies and app code from builder
COPY --from=builder /usr/src/app ./

# Expose port
EXPOSE 8080

# Start the app
CMD ["npm", "start"]