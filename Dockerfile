FROM node:18.19.1-bookworm

# Environment
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Dependencies
RUN apt-get update
RUN apt-get install -y g++ make python3
RUN apt-get update && apt-get install gnupg wget -y && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install google-chrome-stable -y --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

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
