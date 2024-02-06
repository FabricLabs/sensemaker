import { DownloadableFile, StateScrapperInterface } from "./StateScrapper";
import { LexisScrapper } from "./lexis/LexisScrapper";
import { magenta } from "../utils";

export class Colorado extends LexisScrapper implements StateScrapperInterface {

  constructor() {
    super(Colorado.name)
  }

  public statutes = async () => {
    return this.parseStatutes('https://advance.lexis.com/container?config=0345494EJAA5ZjE0MDIyYy1kNzZkLTRkNzktYTkxMS04YmJhNjBlNWUwYzYKAFBvZENhdGFsb2e4CaPI4cak6laXLCWyLBO9&crid=ceb0105a-8d1e-422a-9700-02f9463ee294');
  }

  public rulesOfCourt = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      if (request.label == 'START') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: '.center-content table tr:nth-child(3) td a',
          userData: {
            label: 'MORE YEARS',
          }
        });
        enqueueLinks({
          strategy: 'same-domain',
          selector: '.center-content table tr:nth-child(2) td a',
          userData: {
            label: 'YEAR'
          }
        });
      }

      if (request.label == 'MORE YEARS') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: '.center-content table tr td a',
          userData: {
            label: 'YEAR'
          }
        });
      }

      if (request.label == 'YEAR') {
        let title = $('span.Title').text().trim();
        const pdfs: DownloadableFile[] = $('.center-content a[href$=".pdf"]').toArray().map(a => {
          const $a = $(a);
          return {
            url: 'https://www.courts.state.co.us' + $a.attr('href'),
            path: [title, $a.text().trim() + '.pdf']
          };
        });
        for (const pdf of pdfs) {
          await self.downloadRulesOfCourt(pdf.url, pdf.path);
        }
      }

    }, 'https://www.courts.state.co.us/Courts/Supreme_Court/Rule_Changes.cfm');
  }

  public constitution = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      if (request.label == 'START') {
        let pdfs: DownloadableFile[] = $('a[href$=".pdf"]').toArray().map((a): DownloadableFile => {
          return {
            url: 'https://www.sos.state.co.us/pubs/info_center/laws/' + $(a).attr('href'),
            path: [$(a).closest('ul.w3-ul').prev().text().trim(), $(a).text().trim()]
          }
        });
        for (const pdf of pdfs) {
          pdf.path[pdf.path.length - 1] = `${pdf.path[pdf.path.length - 1]}.pdf`;
          await self.downloadConstitution(pdf.url, pdf.path);
        }

        $('ul.w3-ul a[href$=".html"]').toArray().map(a => {
          const $a = $(a);
          const path = [$a.text().trim() + '.html'];
          if ($a.parent().parent().parent().parent().hasClass('w3-ul')) {
            path.push($a.closest('ul').closest('li').contents().filter(function () {
              return this.nodeType === 3;
            }).text().trim());
          }
          path.push($(a).closest('ul.w3-ul').prev().text().trim());
          enqueueLinks({
            strategy: 'same-domain',
            urls: ['https://www.sos.state.co.us/pubs/info_center/laws/' + $a.attr('href')],
            userData: {
              label: 'LINK',
              path: path.reverse()
            }
          })
        });
      }
      if (request.label == 'LINK') {
        const $content = $('.mainContent');
        $content.find('a[href*="ColoradoConstitution.pdf"], a[href*="http://www.lexisnexis.com"]').closest('p').remove();

        await self.storeConstitution($content.html(), request.userData.path)
      }
    }, 'https://www.sos.state.co.us/pubs/info_center/laws/index.html');
  }

  public administrativeCodes = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      console.log(request.url)
      if(request.label == 'START') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: 'table table tr:nth-child(6) table a[href]',
          userData: {
            label: 'TITLE'
          }
        });
      }
      if(request.label == 'TITLE') {
        for(let a of $('table table tr:nth-child(2) table:nth-child(3) a[href]')) {
          const url = `https://www.sos.state.co.us${$(a).attr('href')}`;
          await self.runPlaywright(async ({ page, request, $, injectJQuery }) => {
            await injectJQuery();
            console.log(' - ' + magenta(request.url));
            const ids = await page.$$eval('table table table:nth-child(9) tr td:nth-child(1) a', (els: (SVGElement | HTMLElement)[]) => {
              var path = jQuery('table table p[align="left"] a').toArray().filter(function(a, i) {
                return i > 1;
              }).map(function(a) {
                return jQuery(a).text().trim();
              });
              var ids = [];
              var id;
              for(const n in els) {
                id = `this-is-an-id-${n}`;
                els[n].id = id;
                ids.push({
                  id: id,
                  path: [...path, `${els[n].textContent.replace(/[\/]+/g, '.')}.pdf`]
                });
              }
              return ids;
            });
            if(ids.length == 0) {
              return;
            }
            for(const id of ids) {
              const newPage = page.waitForEvent('popup');
              await page.click(`#${id.id}`);
              
              await self.downloadAdministrativeCodes((await newPage).url(), id.path);
            }
          }, url, {random_queue: true});
        }
      }
    }, 'https://www.sos.state.co.us/CCR/NumericalDeptList.do#100');
  }

}



