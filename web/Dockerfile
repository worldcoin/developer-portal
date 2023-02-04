FROM --platform=linux/amd64 node:gallium-bullseye-slim
WORKDIR /app
COPY . .
RUN yarn install --legacy-peer-deps
RUN yarn run build
EXPOSE 3000
CMD [ "yarn", "start" ]
