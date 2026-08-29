FROM node:18-alpine as build

WORKDIR /app/frontend

COPY package.json .

RUN npm install

COPY . .

# CRA bakes REACT_APP_* vars into the bundle at build time, so it must be
# passed as a build ARG (docker-compose `environment:` on the built image has no effect).
ARG REACT_APP_API_URL=http://localhost:5000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/frontend/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
