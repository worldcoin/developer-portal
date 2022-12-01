FROM --platform=linux/amd64 node:16.18.1-bullseye-slim
WORKDIR /app
ENV key=value
COPY . .
RUN yarn install --legacy-peer-deps
RUN yarn run build
EXPOSE 3000
CMD [ "yarn", "start" ]
