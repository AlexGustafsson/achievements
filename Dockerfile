FROM node:13-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

RUN mkdir -p /app/data && chown node:node /app/data

# Use a non-root user for the application
USER node

ENV PORT 3000
# Default to show all logs
ENV DEBUG achievements:*

VOLUME "/app/data"

CMD ["node", "./src/index.js"]
