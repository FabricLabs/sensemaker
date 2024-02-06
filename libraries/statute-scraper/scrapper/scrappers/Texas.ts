import { Page } from "playwright";
import { DownloadableFile, StateScrapper, StateScrapperInterface } from "./StateScrapper";
import { sleep } from "crawlee";

export class Texas extends StateScrapper implements StateScrapperInterface {

  constructor() {
    super(Texas.name)
  }

  protected manageEls = async (page: Page, downloadFile, selector = 'td.treeNode'): Promise<DownloadableFile[]> => {
    let element_to_remove = await page.$('#ctl00_ContentPlaceHolder1_NavTree table:nth-child(1)');
    if (element_to_remove) {
      await page.evaluate(element => {
        element.remove();
      }, element_to_remove);
    }
    let ids = await page.$$eval(selector, (els: any[]) => {
      let ids = [];
      for (let i in els) {
        let td = els[i];
        let a = td.querySelector('a:nth-child(1)');
        if (a.attributes.getNamedItem('title')?.value.startsWith('Click to expand')
          && td.querySelector('.PDFicon') === null
          && a.attributes.getNamedItem('id')?.value
        ) {
          ids.push(a.attributes.getNamedItem('id')?.value);
        }
      }
      return ids;
    });
  
    let urls_pdfs:DownloadableFile[] = await page.$$eval('.PDFicon', async (els: any[]):Promise<DownloadableFile[]> => {
      function tracePath(element) {
        var path = [
          $(element).closest('td').find('a:first').text().trim().toLowerCase()
        ];
        var $title = $(element);
        var n = 100;
        while(($title = $($title).closest('div').prev()).length > 0 && n > 0) {
          let title = $title.find('a.treeNode:first').text().trim().toLowerCase();
          if(!title || title == 'texas statutes') {
            break;
          }
          path.push(title);
          n--;
        }
        return path.reverse();
      }
      let urls_pdfs:DownloadableFile[] = [];
      for (let i in els) {
        let url: string = els[i].attributes.getNamedItem('href')?.value;
        urls_pdfs.push({
          url: url,
          path: tracePath(els[i])
        });
      }
      return urls_pdfs;
    });

    // attempt to re download files in case of error
    for(const pdf of urls_pdfs) {
      await downloadFile(pdf.url, ['statutes', ...pdf.path].join('/') + '.pdf');
    }

    console.log(`Urls: ${urls_pdfs.length}`)
  
    if (ids.length == 0) {
      return urls_pdfs;
    }
    ids = [ids[0]]
    for(var i in ids) {
      await page.click(`#${ids[i]}`);
    };
  
    let loading_items: number = 0;
    let reps = 0;
    do {
      await sleep(100);
      loading_items = await page.$$eval(selector, async (els: any[]) => {
        let items = 0;
        for (let i in els) {
          if (els[i].textContent?.trim().includes('Please Wait')) {
            items++;
          }
        }
        return items;
      });
      if (reps % 10 == 0 || loading_items == 0) {
        console.log(`Loading items ${loading_items}. Reps ${reps}`);
      }
      reps++;
    } while (loading_items > 0 && reps < 500);
  
    return this.manageEls(page, downloadFile);
  }

  public statutes = async () => {
    let self = this;
    await this.runPlaywright(async ({ page }) => {
      let pdfs:DownloadableFile[] = await this.manageEls(page, self.downloadFile);
      // attempt to re download files in case of error
      for(const pdf of pdfs) {
        pdf.path[pdf.path.length - 1] = `${pdf.path[pdf.path.length - 1]}.pdf`;
        await self.downloadStatutes(pdf.url, pdf.path);
      }
    }, 'https://statutes.capitol.texas.gov');
  }

  public rulesOfCourt = async () => {
    let self = this;
    await this.runCheerio(async ({ $ }) => {
      let pdfs:DownloadableFile[] = $('a[href$=".pdf"]').toArray().map((a): DownloadableFile => {
        return {
          url: 'https://www.txcourts.gov' + $(a).attr('href'),
          path: [$(a).text().trim().toLowerCase()]
        }
      });
      for(const pdf of pdfs) {
        pdf.path[pdf.path.length - 1] = `${pdf.path[pdf.path.length - 1]}.pdf`;
        await self.downloadRulesOfCourt(pdf.url, pdf.path);
      }
    }, 'https://www.txcourts.gov/rules-forms/rules-standards.aspx');
  }

  public constitution = async () => {
    let self = this;
    await this.runCheerio(async ({ $ }) => {
      let pdfs:DownloadableFile[] = $('#DownloadTable tr td:nth-child(5) a').toArray().map((a): DownloadableFile => {
        return {
          url: 'https://statutes.capitol.texas.gov' + $(a).attr('href'),
          path: [$(a).closest('tr').find('td:first').text().toLowerCase()]
        }
      });
      for(const pdf of pdfs) {
        pdf.path[pdf.path.length - 1] = `${pdf.path[pdf.path.length - 1]}.pdf`;
        await self.downloadConstitution(pdf.url, pdf.path);
      }
    }, 'https://statutes.capitol.texas.gov/Download.aspx');
  }
  
  public administrativeCodes = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      if(request.label == 'START') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: 'table:nth-child(4) tr td:nth-child(2) a',
          userData: {
            label: 'TITLE'
          }
        });
      }
      if(request.label == 'TITLE') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: 'table:nth-child(5) tr td:nth-child(2) a',
          userData: {
            label: 'PART'
          }
        });
      }
      if(request.label == 'PART') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: 'table:nth-child(5) tr td:nth-child(2) a',
          userData: {
            label: 'CHAPTER'
          }
        });
      }
      if(request.label == 'CHAPTER') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: 'table:nth-child(5) tr td:nth-child(2) a',
          userData: {
            label: 'SUBCHAPTER'
          }
        });
      }
      if(request.label == 'SUBCHAPTER') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: 'table:nth-child(5) tr td:nth-child(1) a',
          userData: {
            label: 'RULE'
          }
        });
      }
      if(request.label == 'RULE') {
        let path:string[] = $('table:nth-child(2) tr td:nth-child(2)').toArray().map(function(a) {
          return $(a).text().trim();
        });
        path[path.length - 1] += '.html';
        await self.storeAdministrativeCodes($('table:nth-child(3)').html(), path);
      }
    }, 'https://texreg.sos.state.tx.us/public/readtac$ext.viewtac');
  }
  
}



