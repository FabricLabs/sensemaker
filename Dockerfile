FROM node:18.19.0-bookworm

# Environment
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Dependencies
RUN apt-get update
RUN apt-get install -y g++ make python3

# Storage
# TODO: mount SSHFS / similar here
RUN mkdir -p /media/storage
RUN mkdir -p /opt/app

# Application
WORKDIR /opt/app
COPY . .

## Build
RUN npm install
RUN npm run build

## Test
RUN npm test

## Run
EXPOSE 7777
EXPOSE 3040
CMD ["npm", "start"]
