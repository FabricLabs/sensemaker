import { StateScrapper, StateScrapperInterface } from "./StateScrapper";
import { completeUrl } from "../utils";

export class Pennsylvania extends StateScrapper implements StateScrapperInterface {

  constructor() {
    super(Pennsylvania.name)
  }

  public statutes = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      console.log(request.url);
      for(let tr of $('.DataTable tr').toArray().slice(1)) {
        let url = $(tr).find('td:nth-child(5) a').attr('href');
        let path = [$(tr).find('td:nth-child(2)').text().trim() + '.pdf'];
        await self.downloadStatutes(url, path);
      }
    }, 'https://www.legis.state.pa.us/cfdocs/legis/LI/Public/cons_index.cfm');
  }

  protected rulesOfCourtAnAdministrativeCode = async (downloadFunction) => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      if(request.label == 'START') {
        const urls = $('#codeTitleSelected option').toArray().slice(1).map(opt => 'https://www.pacodeandbulletin.gov/secure/pacode/data' + $(opt).attr('value'));
        await enqueueLinks({
          strategy: 'same-domain',
          userData: {
            label: 'PDFS'
          },
          urls
        });
      }
      
      if(request.label == 'PDFS') {
        const base_url = request.url.split('/').slice(0, -1).join('/') + '/';
        let current_part = null;
        for(let a of $('a[href$=".html"]')) {
          const title = $(a).closest('font').text().trim();
          if(title.startsWith('PART')) {
            current_part = title;
          } else {
            const url = completeUrl($(a).closest('font').next().attr('href'), base_url);
            const path = [
              $('center').toArray().slice(0, 2).map(center => $(center).text().trim()).join(' '),
              current_part,
              title + '.pdf'
            ];
            await downloadFunction(url, path);
          }
        }
      }
    }, 'https://www.pacodeandbulletin.gov/Home/Pacode');
  }

  public rulesOfCourt = async () => {
    this.rulesOfCourtAnAdministrativeCode(this.downloadRulesOfCourt)
  }

  public constitution = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      console.log(request.url);

      const path:string[] = ['Pennsylvania-Constitution' + '.html'];
      await self.storeConstitution($('.BodyContainer').html(), path);
    }, 'https://www.legis.state.pa.us//WU01/LI/LI/CT/HTM/00/00.HTM?49'); //iframe URL
  }
  
  public administrativeCodes = async () => {
    this.rulesOfCourtAnAdministrativeCode(this.downloadAdministrativeCodes)
  }
}