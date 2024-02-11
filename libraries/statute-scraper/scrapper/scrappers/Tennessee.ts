import { completeUrl, magenta } from "../utils";
import { StateScrapperInterface } from "./StateScrapper";
import { LexisScrapper } from "./lexis/LexisScrapper";

export class Tennessee extends LexisScrapper implements StateScrapperInterface {

  constructor() {
    super(Tennessee.name)
  }

  public statutes = async () => {
    this.parseStatutes('https://advance.lexis.com/container?config=014CJAA5ZGVhZjA3NS02MmMzLTRlZWQtOGJjNC00YzQ1MmZlNzc2YWYKAFBvZENhdGFsb2e9zYpNUjTRaIWVfyrur9ud&crid=3cae538b-e1e7-42c7-8635-d8a3eb17f658');
  }
  
  public rulesOfCourt = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      console.log(request.url);
      if(request.label == 'START') {
        await enqueueLinks({
          strategy: 'same-domain',
          selector: '.paragraph__column:first p:first a',
          userData: {
            label: 'RULES'
          }
        });
      }
      if(request.label == 'RULES') {
        await enqueueLinks({
          strategy: 'same-domain',
          selector: '.table-responsive tr td a',
          userData: {
            label: 'RULE',
            rulesName: $('h1.page-header').text().trim()
          }
        });
      }
      if(request.label == 'RULE') {
        const path = [
          request.userData.rulesName,
          $('.breadcrumb li:last').text().trim() + '.html'
        ];
        self.storeRulesOfCourt($('.layout__region--content').html(), path)
      }
    }, 'https://www.tncourts.gov/courts/rules');
  }
  
  public constitution = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request }) => {
      console.log(request.url);
      if(request.label == 'START') {
        const urls = [...new Set([
            ...$('section.row:first a').toArray().map(a => completeUrl($(a).attr('href'), 'https://sos.tn.gov')),
            ...$('section.row .col-md-8 a').toArray().map(a => completeUrl($(a).attr('href'), 'https://sos.tn.gov'))
          ])
        ];
        for(let url of urls) {
          await self.runPlaywright(async ({ page, request, $, injectJQuery }) => {
            console.log(' - ' + magenta(request.url));
            
            await injectJQuery();
            await page.waitForSelector('.ItemMetadata-metadatarow.field-transa td a');

            const url_pdf = await page.evaluate(() => {
              return jQuery('.ItemMetadata-metadatarow.field-transa td a').attr('href');
            });
            const path = [await page.evaluate(() => {
              return jQuery('.ItemMetadata-metadatarow.field-title .field-value').text();
            }) + '.pdf'];
            
            await self.downloadConstitution(url_pdf, path);
          }, url, {random_queue: true});
        }
      }
    }, 'https://sos.tn.gov/civics/guides/tennessee-state-constitution');
  }
  
  public administrativeCodes = async () => {
    await this.parseAdministrativeCodes('https://advance.lexis.com/container?config=014CJAA5ZGVhZjA3NS02MmMzLTRlZWQtOGJjNC00YzQ1MmZlNzc2YWYKAFBvZENhdGFsb2e9zYpNUjTRaIWVfyrur9ud&crid=8d829bd8-7120-4cc6-8942-265eecd6a2b1&prid=2a406564-aede-4bef-b31f-cc1bdb18b245');
  }

}