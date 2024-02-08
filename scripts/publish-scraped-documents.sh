#!/bin/bash
rsync -av --include ".*" ./libraries/statute-scraper/scrapper/data/* /media/storage/incoming
