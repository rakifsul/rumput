# Base image Node.js LTS
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Salin file dependency dulu (biar caching efisien)
COPY package*.json ./

# Install dependency tanpa devDependencies
RUN npm install

# Salin source code
COPY . .

# Expose port (ubah sesuai aplikasi Anda)
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "run", "start"]
