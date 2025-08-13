FROM node:22-alpine AS build
WORKDIR /app

ENV VITE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK CMD sh -c 'if [ "$VITE_ENV" = "development" ]; then wget -qO- http://127.0.0.1/ >/dev/null 2>&1; else wget -qO- http://91.99.134.169/ >/dev/null 2>&1; fi || exit 1'

CMD ["nginx", "-g", "daemon off;"]
