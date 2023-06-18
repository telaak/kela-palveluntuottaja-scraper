FROM node:20 as base

WORKDIR /app
COPY . .
RUN npm i
RUN npx prisma generate
RUN npx tsc

FROM node:20 as runner
WORKDIR /app
COPY --from=base ./app/dist ./dist
COPY package*.json ./
COPY prisma ./prisma/
ENV NODE_ENV production
RUN npm i

EXPOSE 4000

CMD [ "node", "./dist/index.js" ]