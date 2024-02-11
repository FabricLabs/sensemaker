FROM node:18.19.0-bullseye

RUN apt-get update
RUN apt-get --no-install-recommends install -y zip
RUN apt-get --no-install-recommends install -y unzip
RUN apt-get --no-install-recommends install -y xvfb
RUN apt-get --no-install-recommends install -y xauth

COPY package.* .

RUN npm install
RUN npx playwright install
RUN npx playwright install-deps