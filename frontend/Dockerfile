FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV VITE_ENV=production

EXPOSE 5173

CMD ["npm", "run", "dev"]
