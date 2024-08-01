# Crawling
TODO: review instructions from CodingIT team

All instructions assume you are running from the home folder:
```
cd ~
```

## Clone Repository
```
git clone git@github.com:lttinc/statute-scraper.git
cd statute-scraper/scrapper
```

### Install Dependencies
From `~/statute-scraper/scrapper`:
```
npx playwright install-deps
npx playwright install
npm i
```

Run scraper:
```
npm run scrap
```

## Publish to Archive
```
rsync -av --progress ~/statute-scraper/data/* /media/archive/statutes
```

