FROM node:18-alpine
WORKDIR /app
COPY . .
RUN yarn install --legacy-peer-deps
RUN yarn run build
EXPOSE 3000
CMD [ "yarn", "start" ]