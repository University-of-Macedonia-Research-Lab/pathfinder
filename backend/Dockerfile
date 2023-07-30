# Use an official Node.js runtime as the base image
FROM node:16

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application to the working directory
COPY . .

# Expose port 8080
EXPOSE 8080

# Start the application
CMD [ "npm", "start" ]
