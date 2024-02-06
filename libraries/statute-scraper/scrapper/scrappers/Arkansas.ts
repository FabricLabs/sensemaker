import { Solver } from "2captcha";
import { blue, red } from "../utils";
import { StateScrapperInterface } from "./StateScrapper";
import { LexisScrapper } from "./lexis/LexisScrapper";

export class Arkansas extends LexisScrapper implements StateScrapperInterface {

  constructor() {
    super(Arkansas.name)
  }

  public statutes = async () => {
    return this.parseStatutes('https://advance.lexis.com/container?config=00JAA3ZTU0NTIzYy0zZDEyLTRhYmQtYmRmMS1iMWIxNDgxYWMxZTQKAFBvZENhdGFsb2cubRW4ifTiwi5vLw6cI1uX&crid=ecf8dfa4-9113-4c75-9a1f-4983f2a7878e');
  }
  
  public rulesOfCourt = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      const $as = $('a[title="Download the PDF version"]');
      for(let a of $as) {
        await self.downloadRulesOfCourt(
          'https://opinions.arcourts.gov' + $(a).attr('href'),
          [`${$(a).closest('.info').find('.subinfo h3 span a').text().trim()}.pdf`]
        );
      }
    }, 'https://opinions.arcourts.gov/ark/cr/en/nav_date.do?iframe=true');
  }
  
  public constitution = async () => {
    return this.parseConstitution('https://advance.lexis.com/container?config=0145JAA3MTdkMDQ2Mi01Yjg3LTQ5YjUtOTM2NS05MzE5ZjhjNGY5N2MKAFBvZENhdGFsb2cWtateMur7cOlHYN8TgmNk&crid=91b31b41-ea38-44f3-a9af-f6bc411dd799&prid=0b08b3c4-8896-4ee1-af3e-2b79bbe3e048');
  }
  
  public administrativeCodes = async () => {
    let self = this;

    const solveCaptchaOrPass = async (page, injectJQuery) => {
      await injectJQuery();
      await Promise.race([
        page.waitForSelector('img[src="/captcha.gif"]'),
        page.waitForSelector('.data_table tr'),
      ]);
      if((await page.$$('.data_table tr')).length) {
        return;
      }
      console.log(red('Solving captcha...'));
      
      if(process.env['2CAPTCHA_KEY']) {
        const solver = new Solver(process.env['2CAPTCHA_KEY']);
        
        const captchaScreenshot = await page.screenshot({ clip: await (await page.$('img')).boundingBox() });

        const captchaResponse = await solver.imageCaptcha(captchaScreenshot.toString('base64'));
        console.log(captchaResponse);

        captchaScreenshot.toString('base64');

        await page.evaluate((captchaResponse) => {
          jQuery('[name="captcha_resp_txt"]').val(captchaResponse.data);
          jQuery('form').trigger('submit');
        }, captchaResponse);
      }
    }
    
    await this.runPlaywright(async ({ page, request, injectJQuery, enqueueLinks }) => {
      await solveCaptchaOrPass(page, injectJQuery);
      
      await page.waitForSelector('.data_table tr');
      await injectJQuery();

      // const console_logger = (message) => {
      //   console.log(` -> ${blue(message.text())}`);
      // };
      // page.on('console', console_logger);

      const pdf_urls = await page.evaluate(() => {
        var names = {
          6: 'Emergency_Rule_Summary',
          7: 'Emergency_Rule',
          8: 'Rule_Notice',
          9: 'Proposed_Rule_Summary',
          10: 'Proposed_Rule',
          11: 'Final_Rule',
          12: 'Repealed_Rule'
        }
        var pdf_urls = [];
        jQuery('.data_table tr').each(function() {
          if(jQuery(this).find('th').length > 0) { // is the title tr
            return;
          }
          console.log('uno sin ths!!')
          var rules = [];
          for(var i = 6; i <= 12; i++) {
            var url = jQuery(this).find('td:nth-child(' + i + ') a').attr('href');
            if(url) {
              rules.push({
                name: names[i],
                url: url
              });
            }
          }
          console.log(rules)
          if(rules.length === 0) {
            return;
          }
          pdf_urls.push({
            name: jQuery(this).find('td.main_agency').text() + ' - ' + jQuery(this).find('td.rule_title').text(),
            rules: rules
          });
        });
        return pdf_urls;
      });
      for(let pdf_url of pdf_urls) {
        for(let rule of pdf_url.rules) {
          await self.downloadAdministrativeCodes(rule.url, [pdf_url.name, rule.name + '.pdf']);
        }
      }
    }, 'https://www.ark.org/rules_and_regs/index.php/rules/search');
  }

}