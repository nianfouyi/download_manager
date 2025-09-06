# Dockerfile for pre-built dist files deployment on ARM64
FROM --platform=linux/arm64 node:18-alpine

# Set working directory
WORKDIR /app

# Install serve globally for serving static files
RUN npm install -g serve

# Copy pre-built dist files (should be built locally before deployment)
COPY dist/ ./dist/

# Expose port 3000 (serve default port)
EXPOSE 3000

# Start serve to serve static files
CMD ["serve", "-s", "dist", "-l", "3000"]