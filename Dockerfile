# Etapa 1: build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar dependencias para aprovechar caché
COPY package*.json ./
RUN npm install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Etapa 2: servidor web ligero (Nginx) para entregar los archivos estáticos
FROM nginx:stable-alpine AS production

# Copiar archivos compilados desde la etapa de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Opcional: si usas rutas de cliente (SPA) necesitas esta configuración en nginx.conf:
# location / {
#   try_files $uri /index.html;
# }

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]