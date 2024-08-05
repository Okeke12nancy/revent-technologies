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
ARG AUCTION_SERVICE_PORT
ENV AUCTION_SERVICE_PORT=${AUCTION_SERVICE_PORT}
EXPOSE ${AUCTION_SERVICE_PORT}

# Build and Run the application
CMD ["npm", "run", "prebuild", "&&", "npm", "run", "build:services:auction", "&&", "npm", "start:services:auction"]
