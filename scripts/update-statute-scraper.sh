#!/bin/bash
cd libraries
rm -rf statute-scraper
git clone git@github.com:lttinc/statute-scraper.git
cd statute-scraper
git checkout feature/fabric
npm install
rm -rf .git
cd ../..
