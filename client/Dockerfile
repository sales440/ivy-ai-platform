# Etapa 1: Build
FROM node:18-alpine as build
WORKDIR /app
COPY package.json .
COPY package-lock.json* ./
# Install dependencies
RUN npm install
# Copy the rest of the code
COPY . .
# Build the project (Vite)
RUN npm run build

# Etapa 2: Serve con Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
