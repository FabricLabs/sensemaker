import { StateScrapper, StateScrapperInterface } from "./StateScrapper";
import Bottleneck from "bottleneck";
import { completeUrl } from "../utils";

export class Ohio extends StateScrapper implements StateScrapperInterface {

  constructor() {
    super(Ohio.name)
  }

  protected getLimiter = (): Bottleneck => {
    return new Bottleneck({ // to prevent site throttling after a while site blocks if requests are not limited
      maxConcurrent: 1,
      minTime: 500
    });
  }

  public statutes = async () => {
    const limiter = this.getLimiter();

    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      console.log(`${new Date} ${request.url}`);
      await limiter.schedule(() => {
        if (request.label == 'START') {
          enqueueLinks({
            strategy: 'same-domain',
            selector: '.laws-table a',
            userData: {
              label: 'TITLE'
            }
          });
        }
        if (request.label == 'TITLE') {
          enqueueLinks({
            strategy: 'same-domain',
            selector: '.laws-table a',
            userData: {
              label: 'CHAPTER'
            }
          });
        }
        if (request.label == 'CHAPTER') {
          enqueueLinks({
            strategy: 'same-domain',
            selector: '.laws-table a',
            userData: {
              label: 'SECTION'
            }
          });
        }
        if (request.label == 'SECTION') {
          const content = $('.content-frame-medium').html();
          const $h1 = $('h1').text().trim();
          const [section, title] = $h1.split(' | ');
          const path = section.split(', ');
          if (title) {
            path.push(title);
          }
          path[path.length - 1] += (path[path.length - 1].endsWith('.') ? '' : '.') + 'html';
          return this.storeStatutes(content, path);
        }
      });
    }, 'https://codes.ohio.gov/ohio-revised-code', {
      max_concurrency: 2
    });
  }

  public rulesOfCourt = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request }) => {
      console.log(request.url);
      for(let a of $('.content_box_content table a[href*=".pdf"]').toArray()) {
        const url = completeUrl($(a).attr('href'), 'https://www.supremecourt.ohio.gov')
        const path = [$(a).text().trim() + '.pdf'];
        await self.downloadRulesOfCourt(url, path);
      }
    }, 'https://www.supremecourt.ohio.gov/laws-rules/ohio-rules-of-court');
  }

  public constitution = async () => { // # OK
    const limiter = this.getLimiter();

    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      console.log((new Date) + request.url);
      await limiter.schedule(() => {
        if (request.label == 'START') {
          enqueueLinks({
            strategy: 'same-domain',
            selector: '.laws-table a',
            userData: {
              label: 'ARTICLE'
            }
          });
        }
        if (request.label == 'ARTICLE') {
          enqueueLinks({
            strategy: 'same-domain',
            selector: '.laws-table a',
            userData: {
              label: 'SECTION'
            }
          });
        }
        if (request.label == 'SECTION') {
          const content = $('.content-frame-medium').html();
          const $h1 = $('h1').text().trim();
          const [section, title] = $h1.split(' | ');
          const path = section.split(', ');
          if (title) {
            path.push(title);
          }
          path[path.length - 1] += (path[path.length - 1].endsWith('.') ? '' : '.') + 'html';
          return this.storeConstitution(content, path);
        }
      });
    }, 'https://codes.ohio.gov/ohio-constitution', {
      max_concurrency: 2
    });
  }

  public administrativeCodes = async () => {
    const limiter = this.getLimiter();

    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      console.log((new Date) + request.url);
      await limiter.schedule(() => {
        if (request.label == 'START') {
          enqueueLinks({
            strategy: 'same-domain',
            selector: '.laws-table a',
            userData: {
              label: 'N'
            }
          });
        }
        if (request.label == 'N') {
          enqueueLinks({
            strategy: 'same-domain',
            selector: '.laws-table a',
            userData: {
              label: 'CHAPTER'
            }
          });
        }
        if (request.label == 'CHAPTER') {
          enqueueLinks({
            strategy: 'same-domain',
            selector: '.laws-table a',
            userData: {
              label: 'RULE'
            }
          });
        }
        if (request.label == 'RULE') {
          const content = $('.content-frame-medium').html();
          const $h1 = $('h1').text().trim();
          const [section, title] = $h1.split(' | ');
          const path = section.split(', ');
          if (title) {
            path.push(title);
          }
          path[path.length - 1] += (path[path.length - 1].endsWith('.') ? '' : '.') + 'html';
          return this.storeAdministrativeCodes(content, path);
        }
      });
    }, 'https://codes.ohio.gov/ohio-administrative-code', {
      max_concurrency: 2
    });
  }

}