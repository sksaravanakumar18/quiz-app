# Use an official Node.js image to build the app
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy all other files
COPY . .

# Build the app
RUN npm run build

# Use Nginx to serve the built app
FROM nginx:stable-alpine AS production

# Copy built files to nginx default directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config if needed
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
