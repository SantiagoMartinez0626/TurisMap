FROM node:18

RUN apt-get update && apt-get install -y \
  watchman \
  git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install --verbose
RUN npm list
RUN npm install -g @expo/cli

COPY . .

EXPOSE 19000 19001 19002

CMD ["npx", "expo", "start"]
