"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Georgia = void 0;
const utils_1 = require("../utils");
const LexisScrapper_1 = require("./lexis/LexisScrapper");
class Georgia extends LexisScrapper_1.LexisScrapper {
    constructor() {
        super(Georgia.name);
        this.statutes = async () => {
            this.parseStatutes('https://advance.lexis.com/container?config=00JAAzZDgzNzU2ZC05MDA0LTRmMDItYjkzMS0xOGY3MjE3OWNlODIKAFBvZENhdGFsb2fcIFfJnJ2IC8XZi1AYM4Ne&crid=cc0a6041-0a34-4145-b964-7044e01bd1cb');
        };
        this.rulesOfCourt = async () => {
            const self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                console.log(request.url);
                if (request.label == 'START') {
                    const url = (0, utils_1.completeUrl)($('.fusion-text.fusion-text-2 a:first').attr('href'), 'https://www.gasupreme.us');
                    const path = ['rules_of_court.pdf'];
                    await self.downloadRulesOfCourt(url, path);
                    await enqueueLinks({
                        strategy: 'same-domain',
                        selector: '.fusion-text.fusion-text-2 a:last',
                        userData: {
                            label: 'FORMER'
                        }
                    });
                }
                if (request.label == 'FORMER') {
                    await self.storeRulesOfCourt($('#main').html(), ['former_rules_of_court.html']);
                }
            }, 'https://www.gasupreme.us/rules');
        };
        this.constitution = async () => {
            await this.downloadConstitution('https://sos.ga.gov/sites/default/files/2022-02/state_constitution.pdf', ['constitution.pdf']);
        };
        this.administrativeCodes = async () => {
            const self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                console.log(request.url);
                if (request.label == 'START') {
                    await enqueueLinks({
                        strategy: 'same-domain',
                        selector: '#doc-content tr a',
                        userData: {
                            label: 'DEPARTMENT'
                        }
                    });
                }
                if (request.label == 'DEPARTMENT') {
                    await enqueueLinks({
                        strategy: 'same-domain',
                        selector: '#doc-content a',
                        userData: {
                            label: 'CHAPTER',
                            chapterName: $('h1').text().trim()
                        }
                    });
                }
                if (request.label == 'CHAPTER') {
                    const path = [
                        request.userData.chapterName,
                        $('h1').text().trim() + '.html'
                    ];
                    self.storeAdministrativeCodes($('#doc-content').html(), path);
                }
            }, 'https://rules.sos.state.ga.us/gac');
        };
    }
}
exports.Georgia = Georgia;
