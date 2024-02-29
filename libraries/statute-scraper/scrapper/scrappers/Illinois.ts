import { Download } from "playwright";
import { completeUrl } from "../utils";
import { StateScrapper, StateScrapperInterface } from "./StateScrapper";

export class Illinois extends StateScrapper implements StateScrapperInterface {

  constructor() {
    super(Illinois.name)
  }

  public statutes = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      console.log(request.url);
      if (request.label == 'START') {
        let currentPath;
        for (let el of $('ul > *').toArray()) {
          if (el.tagName == 'div') {
            currentPath = $(el).text().trim();
            continue;
          }
          if (el.tagName == 'li') {
            await enqueueLinks({
              strategy: 'same-domain',
              urls: [completeUrl($(el).find('a').attr('href'), 'https://www.ilga.gov/legislation/ilcs/')],
              userData: {
                label: 'CHAPTER',
                path: [currentPath]
              }
            });
          }
        }
      }
      if (request.label == 'CHAPTER') {
        let basePath = $('.heading').text().trim();
        let currentPath = $('.heading').text().trim();
        for (let el of $('ul > *').toArray()) {
          if (el.tagName == 'p') {
            currentPath = (basePath ? `${basePath} - ` : '') + $(el).text().trim();
            continue;
          }
          if (el.tagName == 'li') {
            await enqueueLinks({
              strategy: 'same-domain',
              urls: [completeUrl($(el).find('a').attr('href'), 'https://www.ilga.gov/legislation/ilcs/')],
              userData: {
                label: 'FULLITEM',
                path: [...request.userData.path, currentPath]
              }
            });
          }
        }
      }
      if (request.label == 'FULLITEM') {
        await enqueueLinks({
          strategy: 'same-domain',
          selector: '#toplinks a:last',
          userData: {
            label: 'ITEM',
            path: request.userData.path
          }
        });
      }
      if (request.label == 'ITEM') {
        const content = $('*').html();
        const path = [...request.userData.path, $('.heading').text().trim() + '.html'];
        await self.storeStatutes(content, path);
      }
    }, 'https://www.ilga.gov/legislation/ilcs/ilcs.asp');
  }

  public rulesOfCourt = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      console.log(request.url);
      for (let td of $('#ctl04_gvRules tr td:nth-child(3)').toArray()) {
        const $tr = $(td).closest('tr');
        const path = ['Article ' + $tr.find('td:nth-child(1)').text().trim(), $tr.find('td:nth-child(2)').text().trim()];
        const urls = $(td).find('a').toArray().map((a) => {
          return {
            url: $(a).attr('href'),
            name: $(a).text().trim() + '.pdf'
          }
        });
        for (const url of urls) {
          if (!url.url) {
            continue;
          }
          url.url = completeUrl(url.url, 'https://www.illinoiscourts.gov');

          await self.downloadRulesOfCourt(url.url, [...path, url.name]);
        }
      }
    }, 'https://www.illinoiscourts.gov/rules-law/supreme-court-rules');
  }

  public constitution = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks}) => {
      await self.storeConstitution($('body').html(), ['constitution.html'])
    }, 'https://www.ilga.gov/commission/lrb/conent.htm');
  }

  public administrativeCodes = async () => {
    let self = this;
    await this.runPlaywright(async ({ request, page, injectJQuery, browserController }) => {
      console.log(request.url)
      await injectJQuery();
      const elements = (await page.evaluate(() => {
        var elements = [];
        $('.container.container-main a[href$=".pdf"]').each(function (index) {
          var id = 'current-jeevs-id-' + index + '-' + Math.round(Math.random() * 100000000);
          $(this).attr('id', id);
          $(this).attr('download', 'download'); // THIS WAS IT!!!
          elements.push({
            id: id,
            url: $(this).attr('href'),
            name: $(this).text().trim() + '.pdf'
          })
        });
        return elements;
      }));

      for (let element of elements) {
        const downloadPromise: Promise<Download> = page.waitForEvent('download');
        await page.click(`#${element.id}`);
        const download: Download = await downloadPromise;

        await self.moveDownloadedAdministrativeCodes(download, [element.name]);
      }
    }, 'https://www.ilsos.gov/departments/index/admincodindex.html');
  }

}