# --------------------------------------------------
# 1. BASE IMAGE (Builder)
# --------------------------------------------------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Build NestJS into dist/
RUN npm run build



# --------------------------------------------------
# 2. RUNTIME IMAGE (Production)
# --------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Copy only necessary files for running the app
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose NestJS port
EXPOSE 3001

# Start backend
CMD ["node", "dist/main.js"]
