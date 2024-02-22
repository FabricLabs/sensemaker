FROM node:18.19.0-bookworm
RUN apt-get update
RUN apt-get install -y g++ make python3
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY . .
RUN npm install
CMD ["node", "./scripts/scraper.js"]
