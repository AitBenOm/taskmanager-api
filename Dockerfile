# --------------------------------------------------
# 1. BASE IMAGE (Builder)
# --------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

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
