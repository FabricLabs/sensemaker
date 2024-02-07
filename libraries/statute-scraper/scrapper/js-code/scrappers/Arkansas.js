"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Arkansas = void 0;
const LexisScrapper_1 = require("./lexis/LexisScrapper");
class Arkansas extends LexisScrapper_1.LexisScrapper {
    constructor() {
        super(Arkansas.name);
        this.statutes = async () => {
            return this.parseStatutes('https://advance.lexis.com/container?config=00JAA3ZTU0NTIzYy0zZDEyLTRhYmQtYmRmMS1iMWIxNDgxYWMxZTQKAFBvZENhdGFsb2cubRW4ifTiwi5vLw6cI1uX&crid=ecf8dfa4-9113-4c75-9a1f-4983f2a7878e');
        };
        this.rulesOfCourt = async () => {
            let self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                const $as = $('a[title="Download the PDF version"]');
                for (let a of $as) {
                    await self.downloadRulesOfCourt('https://opinions.arcourts.gov' + $(a).attr('href'), [`${$(a).closest('.info').find('.subinfo h3 span a').text().trim()}.pdf`]);
                }
            }, 'https://opinions.arcourts.gov/ark/cr/en/nav_date.do?iframe=true');
        };
        this.constitution = async () => {
            return this.parseConstitution('https://advance.lexis.com/container?config=0145JAA3MTdkMDQ2Mi01Yjg3LTQ5YjUtOTM2NS05MzE5ZjhjNGY5N2MKAFBvZENhdGFsb2cWtateMur7cOlHYN8TgmNk&crid=91b31b41-ea38-44f3-a9af-f6bc411dd799&prid=0b08b3c4-8896-4ee1-af3e-2b79bbe3e048');
        };
        this.administrativeCodes = async () => {
            let self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                //#TODO
            }, 'https://www.ark.org/rules_and_regs/index.php/rules/search');
        };
    }
}
exports.Arkansas = Arkansas;
