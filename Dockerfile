FROM node:18-bullseye

WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia todo el contenido del proyecto
COPY . .

ARG RAILWAY_STATIC_URL
ARG PUBLIC_URL
ARG PORT

CMD ["npm", "start"]



