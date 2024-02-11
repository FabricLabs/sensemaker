import { StateScrapper, StateScrapperInterface } from "./StateScrapper";
import { completeUrl } from "../utils";

export class NewYork extends StateScrapper implements StateScrapperInterface {

  constructor() {
    super(NewYork.name)
  }

  public statutes = async () => {
    let self = this;
    await this.runCheerio(async ({ request, $, enqueueLinks }) => {
      console.log(request.url);
      if(request.label == 'START') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: '.nys-openleg-result-container a',
          userData: {
            label: 'LAW'
          }
        });
      }
      if(request.label == 'LAW') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: '.nys-openleg-result-container a',
          userData: {
            label: 'ARTICLE'
          }
        });
      }
      if(request.label == 'ARTICLE') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: '.nys-openleg-result-container a',
          userData: {
            label: 'SECTION'
          }
        });
      }
      if(request.label == 'SECTION') {
        const path = $('.nys-openleg-result-breadcrumbs-container a').toArray().slice(2, 4).map(bc => $(bc).text().trim().replace(/[\n\t\s]+/g, ' '));
        path.push(
          $('.nys-openleg-result-container .nys-openleg-head-container:first .nys-openleg-result-title-headline').text().trim() +
          ' - ' +
          $('.nys-openleg-result-container .nys-openleg-head-container:first .nys-openleg-result-title-short').text().trim() +
          '.html'
        );
        self.storeStatutes($('.nys-openleg-result-container').html(), path);
      }
    }, 'https://www.nysenate.gov/legislation/laws/CONSOLIDATED');
  }

  /**
   * 0-2  2 level .html           HTML
   * 5    2 level .html
   * 
   * 3    urls .pdf               pdf-1
   * 6-7  urls .pdf
   * 
   * 4 index html y 2 level pdfs  pdf-2
   */
  public rulesOfCourt = async () => {
    let self = this;
    await this.runCheerio(async ({ request, $, enqueueLinks }) => {
      console.log(request.url);
      if(request.label == 'START') {
        const map_type = [
          'HTML',
          'HTML',
          'HTML',
          'PDF-1',
          'PDF-2',
          'HTML',
          'PDF-1',
          'PDF-1'
        ]
        const as = $('.region.region-sidebar-first ul.menu li a')
        for(let i in as) {
          const a = as[i];
          enqueueLinks({
            strategy: 'same-domain',
            urls: [completeUrl($(a).attr('href'), 'https://ww2.nycourts.gov')],
            userData: {
              label: map_type[i],
              path: [$(a).text().trim()]
            }
          });
        }
      }
      if(request.label == 'HTML') {
        for(let a of $('.region.region-sidebar-first ul.menu li a').toArray().slice(1)) {
          enqueueLinks({
            strategy: 'same-domain',
            urls: [completeUrl($(a).attr('href'), 'https://ww2.nycourts.gov')],
            userData: {
              label: 'HTML:2',
              path: request.userData.path
            }
          });
        }
        self.storeRulesOfCourt($('.region.region-content').html(), [...request.userData.path, $('h2.section-theme-09').text().trim() + '.html']);
      }
      if(request.label == 'HTML:2') {
        self.storeRulesOfCourt($('.region.region-content').html(), [...request.userData.path, $('h1.page-title').text().trim() + '.html']);
      }
      if(request.label == 'PDF-1') {
        for(let a of $('.content.layout-content a[href$=".pdf"]').toArray()) {
          await self.downloadRulesOfCourt(completeUrl($(a).attr('href'), 'https://ww2.nycourts.gov'), [...request.userData.path, $(a).text().trim().replace(/[\/]+/g, '.') + '.pdf']);
        }
      }
      if(request.label == 'PDF-2') {
        self.storeRulesOfCourt($('.region.region-content').html(), [...request.userData.path, $('h1.page-title').text().trim() + '.html']);
        for(let a of $('.content.layout-content a[href$=".pdf"]').toArray()) {
          await self.downloadRulesOfCourt($(a).attr('href'), [...request.userData.path, $(a).text().trim().replace(/[\/]+/g, '.') + '.pdf']);
        }
        const map = [
          'PDF-2:2-YELLOW',
          'PDF-2:2-TITLE',
          'PDF-2:2-YELLOW',
          'PDF-2:2-YELLOW',
          'DOWNLOAD',
          'PDF-2:2-YELLOW',
        ];
        const as = $('.region.region-sidebar-first ul.menu li a').toArray().slice(1);
        for(let i in as) {
          const a = as[i];
          const label = map[i];
          if(label == 'DOWNLOAD') {
            await self.downloadRulesOfCourt($(a).attr('href'), [...request.userData.path, $(a).text().trim()]);
            return;
          }
          enqueueLinks({
            strategy: 'same-domain',
            urls: [`https://ww2.nycourts.gov${$(a).attr('href')}`],
            userData: {
              label: label,
              path: [...request.userData.path, $(a).text().trim()]
            }
          });
        }
      }
      if(request.label == 'PDF-2:2-TITLE') {
        for(let a of $('.content.layout-content a[href$=".pdf"]').toArray()) {
          await self.downloadRulesOfCourt(completeUrl($(a).attr('href'), 'https://ww2.nycourts.gov'), [...request.userData.path, $(a).text().trim() + '.pdf']);
        }
      }
      if(request.label == 'PDF-2:2-YELLOW') {
        for(let a of $('.content.layout-content a[href$=".pdf"]').toArray()) {
          await self.downloadRulesOfCourt(completeUrl($(a).attr('href'), 'https://ww2.nycourts.gov'), [...request.userData.path, $(a).closest('tr').find('td:first').text().trim() + '.pdf']);
        }
      }
    }, 'https://ww2.nycourts.gov/rules');
  }

  public constitution = async () => {
    await this.downloadConstitution('https://dos.ny.gov/system/files/documents/2022/01/Constitution-January-1-2022.pdf', ['Constitution-January-1-2022.pdf']);
  }

  public administrativeCodes = async () => {
    let self = this;
    await this.runPlaywright(async ({ request, enqueueLinks, page, injectJQuery }) => {
      console.log(request.url);
      await injectJQuery();
      await enqueueLinks({
        strategy: 'same-domain',
        selector: '.toc-link'
      });

      const path = await page.evaluate(() => {
        var path = $('ol.breadcrumb li.breadcrumb-item').toArray().map(li => $(li).text().trim());
        path = path.slice(2, path.length -1);
        var h1 = $('.codenav__section-body h1');
        if(h1.length) {
          path.push(h1.text().trim());
        }
        var title = $('.rbox.Title');
        if(title.length) {
          path.push(title.text().trim());
        }
        var chapter = $('.rbox.Chapter');
        if(chapter.length) {
          path.push(chapter.text().trim());
        }
        path[path.length - 1] += '.html';

        return path;
      });

      if(path.length == 0) {
        console.log(path)
      }
      await Promise.race([
        page.waitForSelector('.codenav__section-body h1'),
        page.waitForSelector('.codenav__section-body .rbox.Title'),
        page.waitForSelector('.codenav__section-body .rbox.Chapter')
      ]);
      const content = await page.evaluate(() => {
        return $('.codenav__section-body').html();
      });
      await self.storeAdministrativeCodes(content, path);
    }, 'https://codelibrary.amlegal.com/codes/newyorkcity/latest/overview');
  }

}