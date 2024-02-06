import { DownloadableFile, StateScrapper, StateScrapperInterface, StorableData } from "./StateScrapper";

export class Florida extends StateScrapper implements StateScrapperInterface {

  constructor() {
    super(Florida.name)
  }

  public statutes = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {
      if(request.label == 'START') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: '.statutesTOC ol li a',   //all items
          userData: {
            label: 'TITLE'
          }
        });
      }
      
      if(request.label == 'TITLE') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: '.statutesTOC ol li ol li a',
          userData: {
            label: 'CHAPTER'
          }
        });
      }
      
      if(request.label == 'CHAPTER') {
          enqueueLinks({
            strategy: 'same-domain',
            selector: '.wholeChp',
            userData: {
              label: 'ALL-SECTIONS'
            }
          });
      }

      if(request.label == 'ALL-SECTIONS') {
        const title = $('.miniStatuteTOC > a > .title').text()+" - "+$('.miniStatuteTOC > a > .descript').text();
        const chapter = $('.miniStatuteTOC > .selected > .title').text()+" - "+$('.miniStatuteTOC > .selected > .descript').text();
        let path, section;
        $('.Section').each(function() {
          section = "Section "+$(this).find(".SectionNumber").text()+".html";
          path = [title, chapter, section];
          self.storeStatutes($(this).html(), path);
        });
      }

    }, 'https://www.flsenate.gov/laws/statutes');
  }

  public rulesOfCourt = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {

      let pdfs:DownloadableFile[] = $('.wpb_wrapper h2').siblings().children('.icon-pdf').toArray().map((a): DownloadableFile => {
        return {
          url: $(a).attr('href'),
          path: [$(a).text().trim()+".pdf"]
        }
      });
      for(const pdf of pdfs) {
        await self.downloadRulesOfCourt(pdf.url, pdf.path);
      }

    }, 'https://www.floridabar.org/rules/ctproc/');
  }

  public constitution = async () => {
    let self = this;
    await this.runCheerio(async ({ $ }) => {
      let section_title, article,path,section_content;
      $('.Constitution .Article .Section').each(function() {
          section_title = $(this).find('.SectionNumber a').text() + $(this).find(".Catchline > .CatchlineText").text();
          if (section_title.slice(-1) === '.') {  //remove the last . in the name
            section_title = section_title.substring(0, section_title.length - 1);
          }
          article = $(this).parent().find('.ArticleNumber a').text();
          path = [article, section_title + ".html"];
          section_content = $(this).html();
          self.storeConstitution(section_content, path);
      });

    }, 'http://www.leg.state.fl.us/Statutes/index.cfm?Mode=Constitution&Submenu=3&Tab=statutes');
  }
  
  public administrativeCodes = async () => {
    let self = this;
    await this.runCheerio(async ({ $, request, enqueueLinks }) => {

      if(request.label == 'START') {

        enqueueLinks({
          strategy: 'same-domain',
          selector: '.RuleNumber',
          userData: {
            label: 'RULE'
          }
        });

        enqueueLinks({
          strategy: 'same-domain',
          selector: '.mainbody table:nth-child(4) a',
          userData: {
            label: 'PAGES'
          }
        });
      }

      if(request.label == 'PAGES') {
        enqueueLinks({
          strategy: 'same-domain',
          selector: '.RuleNumber',
          userData: {
            label: 'RULE'
          }
        });
      }

      if(request.label == 'RULE') {
        let name_rule = $('.mainbody > h2 > span:nth-child(1)').text();
        name_rule = name_rule.replace("Rule: ", "") + ".doc";
        const department = $('.mainbody .tabHide tr:nth-child(2) .FX_Link_header').text().trimStart().trimEnd();
        const division = $('.mainbody .tabHide tr:nth-child(3) .FX_Link_header').text().trimStart().trimEnd();
        const chapter = $('.mainbody .tabHide tr:nth-child(4) .FX_Link_header').text().trimStart().trimEnd();
        const path = [department, division, chapter, name_rule];
        
        let file_url = $(".tabHide:eq(1) tr:eq(0) td:eq(0) > a").attr("href");
        file_url = "https://www.flrules.org" + file_url;
        await self.downloadAdministrativeCodes(file_url, path);
      }

    }, 'https://www.flrules.org/notice/resultAdvance.asp?string=a&ChkFAC=on&keyword=&orgid=&orid=&sid=&iid=&date3=01%2F01%2F2006&date4=03%2F18%2F2024&date1=01%2F18%2F2023&date2=01%2F18%2F2024&submit=++Search++');
  }

}



