# Use the official Node.js image
FROM node:20

# Create and change to the app directory
WORKDIR /usr/src/app/

# Copy package.json and package-lock.json
COPY ../../package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY ../../ .

# Expose the port that the application runs on
ARG USER_SERVICE_PORT
ENV USER_SERVICE_PORT=${USER_SERVICE_PORT}
EXPOSE ${USER_SERVICE_PORT}

# Build and Run the application
CMD ["npm", "run", "prebuild", "&&", "npm", "run", "build:services:user", "&&", "npm", "start:services:user"]
