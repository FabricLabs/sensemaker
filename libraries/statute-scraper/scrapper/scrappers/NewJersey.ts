import { blue, green, red, sleep, yellow } from "../utils";
import { DownloadableFile, StorableData } from "./BaseScrapper";
import { StateScrapper, StateScrapperInterface } from "./StateScrapper";

export class NewJersey extends StateScrapper implements StateScrapperInterface {

  constructor() {
    super(NewJersey.name)
  }

  public statutes = async () => {
    let self = this;
    await this.runPlaywright(async ({ page, $ }) => {
      await page.waitForSelector('.legislative-downloads_listItem__18eLv');

      let files:DownloadableFile[] = await page.$$eval('.legislative-downloads_listItem__18eLv a[href]', (els: (SVGElement | HTMLElement)[]) => {
        const zips:DownloadableFile[] = [];
        for(const element of els) {
          const url:string = element.attributes.getNamedItem('href')?.value.trim();
          if(url) {
            zips.push({
              url: url,
              path: [element.textContent]
            });
          }
        }
        return zips;
      });

      await page.$$eval('.legislative-downloads_listItem__18eLv:nth-child(1) a', (els: (SVGElement | HTMLElement)[]) => {
        if (els.length > 0) {
          els[0].id = 'this-is-an-id'
        }
      });

      await page.click('#this-is-an-id');
      await page.waitForSelector('.legislative-downloads_statutesList__GZfBc.legislative-downloads_list__eUhRE');

      files = [...files, ...await page.$$eval('.legislative-downloads_listItem__18eLv a[href]', (els: (SVGElement | HTMLElement)[]) => {
        const zips:DownloadableFile[] = [];
        for(const element of els) {
          const url:string = element.attributes.getNamedItem('href')?.value.trim();
          if(url) {
            zips.push({
              url: url,
              path: ['gis', element.textContent]
            });
          }
        }
        return zips;
      })];
      
      // attempt to re download files in case of error
      for(const file of files) {
        await self.downloadStatutes(file.url, file.path);
      }

    }, 'https://www.njleg.state.nj.us/legislative-downloads?downloadType=Statutes');
  }

  public rulesOfCourt = async () => {
    let self = this;
    await this.runPlaywright(async ({ page }) => {

      page.on('console', (message) => {
        console.log(` -> ${blue(message.text())}`);
      });

      let n = 0;
      let initial_time:number = Date.now();
      let elapsed_time:number;
      do {
        await sleep(100);
        n = await page.$$eval('#block-njcourts-content .mt-3 ul li', (els: any[]) => {
          return els.length;
        });
        elapsed_time = Date.now() - initial_time;
        process.stdout.write(`${yellow('Awaiting initial ajax:')} ${green((elapsed_time / 1000).toFixed(2))}sec - ${n}      \r`);
      } while(n == 0 && elapsed_time < 30000);
      process.stdout.write(`\n`);
      
      if(n == 0) {
        console.log(`${red('Initial ajax failed.')} Exiting...`);
        process.exit();
      }
      
      console.log(`${yellow('Clicking all not expanded')} ${green('li')}`);
      n = await page.$$eval('#block-njcourts-content .mt-3 ul li span:nth-child(1)', async (els: any[]) => {
        for(var el of els) {
          await (new Promise((resolve, reject) => {setTimeout(resolve, Math.ceil(50 + Math.random() * 50));}));
          jQuery(el).trigger('click');
        }
        return els.length;
      });

      let expanded = 0;
      initial_time = Date.now();
      do {
        await sleep(100);
        expanded = await page.$$eval('#block-njcourts-content .mt-3 ul li.expanded', (els: any[]) => {
          return els.length;
        });
        expanded += await page.$$eval('#block-njcourts-content .mt-3 ul li.expanded-content', (els: any[]) => {
          return els.length;
        });
        elapsed_time = Date.now() - initial_time;
        process.stdout.write(`${yellow('Awaiting all')} ${green('li to load')}${yellow(':')} ${green((elapsed_time / 1000).toFixed(2))}sec - ${n} - ${expanded}     \r`);
      } while(n - expanded > 5 && elapsed_time < 300000);
      process.stdout.write(`\n`);
      
      console.log(`${yellow('Clicking all not expanded')} ${green('li > ul > li')}`);
      n = await page.$$eval('#block-njcourts-content .mt-3 > ul > li.expanded ul li span:nth-child(1)', async (els: any[]) => {
        for(var el of els) {
          await (new Promise((resolve, reject) => {setTimeout(resolve, Math.ceil(50 + Math.random() * 50));}));
          jQuery(el).trigger('click');
        }
        return els.length;
      });

      console.log(`${yellow('Awaiting all')} ${green('li > ul > li')} to load`);
      do {
        await sleep(100);
        expanded = await page.$$eval('#block-njcourts-content .mt-3 ul li.expanded ul li.expanded-content', (els: any[]) => {
          return els.length;
        });
        elapsed_time = Date.now() - initial_time;
        process.stdout.write(`\r${green((elapsed_time / 1000).toFixed(2))}sec - ${n} - ${expanded}   `);
      } while(n - expanded > 5 && elapsed_time < 300000);
      process.stdout.write(`\n`);

      let pdf_files: DownloadableFile[] = await page.$$eval('#block-njcourts-content .mt-3 ul a[data-entity-substitution]', (els: any[]) => {
        var items = [];
        for(var el of els) {
          var $a = jQuery(el);
          items.push({
            url: `https://www.njcourts.gov${$a.attr('href')}`,
            path: [$a.closest('li.expanded-content').find('span:first').text(), $a.text()]
          });
        }
        return items;
      });

      let storables: StorableData[] = await page.$$eval('#block-njcourts-content .mt-3 ul li .content', (els: any[]) => {
        var items = [];
        for(var el of els) {
          var $content = jQuery(el);
          if($content.find('a[data-entity-substitution]').length > 0) {
            continue;
          }
          items.push({
            content: $content.html(),
            path: [
              $content.closest('li.expanded').find('span:first').text(),
              $content.closest('li.expanded-content').find('span:first').text() + '.html'
            ]
          });
        }
        return items;
      });

      for(const pdf of pdf_files) {
        pdf.path[pdf.path.length - 1] = `${pdf.path[pdf.path.length - 1]}.pdf`;
        await self.downloadRulesOfCourt(pdf.url, pdf.path);
      }

      for(const storable of storables) {
        await self.storeRulesOfCourt(storable.content, storable.path);
      }
    }, 'https://www.njcourts.gov/attorneys/rules-of-court');
  }

  public constitution = async () => {
    await this.downloadConstitution('https://pub.njleg.state.nj.us/statutes/NJCONST-TEXT.zip', ['NJCONST-TEXT.zip']);
  }
  
  public administrativeCodes = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      for(let a of $('.table-striped a')) {
        let url = $(a).attr('href');
        url = (url.startsWith('title') ? '/education/code/current/' : '') + url;
        await self.downloadAdministrativeCodes(`https://www.nj.gov${url}`, [$(a).text().trim() + '.pdf']);
      }
    }, 'https://www.nj.gov/education/code/current/index.shtml');
  }

}