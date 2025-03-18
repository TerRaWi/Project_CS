# Dockerfile for Express.js

# Use Node.js as the base image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your Express.js app uses
EXPOSE 4000

# Start the application
CMD ["node", "server.js"]
