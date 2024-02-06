"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Texas = void 0;
const StateScrapper_1 = require("./StateScrapper");
const crawlee_1 = require("crawlee");
class Texas extends StateScrapper_1.StateScrapper {
    constructor() {
        super(Texas.name);
        this.manageEls = async (page, downloadFile, selector = 'td.treeNode') => {
            let element_to_remove = await page.$('#ctl00_ContentPlaceHolder1_NavTree table:nth-child(1)');
            if (element_to_remove) {
                await page.evaluate(element => {
                    element.remove();
                }, element_to_remove);
            }
            let ids = await page.$$eval(selector, (els) => {
                var _a, _b, _c;
                let ids = [];
                for (let i in els) {
                    let td = els[i];
                    let a = td.querySelector('a:nth-child(1)');
                    if (((_a = a.attributes.getNamedItem('title')) === null || _a === void 0 ? void 0 : _a.value.startsWith('Click to expand'))
                        && td.querySelector('.PDFicon') === null
                        && ((_b = a.attributes.getNamedItem('id')) === null || _b === void 0 ? void 0 : _b.value)) {
                        ids.push((_c = a.attributes.getNamedItem('id')) === null || _c === void 0 ? void 0 : _c.value);
                    }
                }
                return ids;
            });
            let urls_pdfs = await page.$$eval('.PDFicon', async (els) => {
                var _a;
                function tracePath(element) {
                    var path = [
                        $(element).closest('td').find('a:first').text().trim().toLowerCase()
                    ];
                    var $title = $(element);
                    var n = 100;
                    while (($title = $($title).closest('div').prev()).length > 0 && n > 0) {
                        let title = $title.find('a.treeNode:first').text().trim().toLowerCase();
                        if (!title || title == 'texas statutes') {
                            break;
                        }
                        path.push(title);
                        n--;
                    }
                    return path.reverse();
                }
                let urls_pdfs = [];
                for (let i in els) {
                    let url = (_a = els[i].attributes.getNamedItem('href')) === null || _a === void 0 ? void 0 : _a.value;
                    urls_pdfs.push({
                        url: url,
                        path: tracePath(els[i])
                    });
                }
                return urls_pdfs;
            });
            // attempt to re download files in case of error
            for (const pdf of urls_pdfs) {
                await downloadFile(pdf.url, ['statutes', ...pdf.path].join('/') + '.pdf');
            }
            console.log(`Urls: ${urls_pdfs.length}`);
            if (ids.length == 0) {
                return urls_pdfs;
            }
            ids = [ids[0]];
            for (var i in ids) {
                await page.click(`#${ids[i]}`);
            }
            ;
            let loading_items = 0;
            let reps = 0;
            do {
                await (0, crawlee_1.sleep)(100);
                loading_items = await page.$$eval(selector, async (els) => {
                    var _a;
                    let items = 0;
                    for (let i in els) {
                        if ((_a = els[i].textContent) === null || _a === void 0 ? void 0 : _a.trim().includes('Please Wait')) {
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
        };
        this.statutes = async () => {
            let self = this;
            await this.runPlaywright(async ({ page }) => {
                let pdfs = await this.manageEls(page, self.downloadFile);
                // attempt to re download files in case of error
                for (const pdf of pdfs) {
                    pdf.path[pdf.path.length - 1] = `${pdf.path[pdf.path.length - 1]}.pdf`;
                    await self.downloadStatutes(pdf.url, pdf.path);
                }
            }, 'https://statutes.capitol.texas.gov');
        };
        this.rulesOfCourt = async () => {
            let self = this;
            await this.runCheerio(async ({ $ }) => {
                let pdfs = $('a[href$=".pdf"]').toArray().map((a) => {
                    return {
                        url: 'https://www.txcourts.gov' + $(a).attr('href'),
                        path: [$(a).text().trim().toLowerCase()]
                    };
                });
                for (const pdf of pdfs) {
                    pdf.path[pdf.path.length - 1] = `${pdf.path[pdf.path.length - 1]}.pdf`;
                    await self.downloadRulesOfCourt(pdf.url, pdf.path);
                }
            }, 'https://www.txcourts.gov/rules-forms/rules-standards.aspx');
        };
        this.constitution = async () => {
            let self = this;
            await this.runCheerio(async ({ $ }) => {
                let pdfs = $('#DownloadTable tr td:nth-child(5) a').toArray().map((a) => {
                    return {
                        url: 'https://statutes.capitol.texas.gov' + $(a).attr('href'),
                        path: [$(a).closest('tr').find('td:first').text().toLowerCase()]
                    };
                });
                for (const pdf of pdfs) {
                    pdf.path[pdf.path.length - 1] = `${pdf.path[pdf.path.length - 1]}.pdf`;
                    await self.downloadConstitution(pdf.url, pdf.path);
                }
            }, 'https://statutes.capitol.texas.gov/Download.aspx');
        };
        this.administrativeCodes = async () => {
            let self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                if (request.label == 'START') {
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: 'table:nth-child(4) tr td:nth-child(2) a',
                        userData: {
                            label: 'TITLE'
                        }
                    });
                }
                if (request.label == 'TITLE') {
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: 'table:nth-child(5) tr td:nth-child(2) a',
                        userData: {
                            label: 'PART'
                        }
                    });
                }
                if (request.label == 'PART') {
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: 'table:nth-child(5) tr td:nth-child(2) a',
                        userData: {
                            label: 'CHAPTER'
                        }
                    });
                }
                if (request.label == 'CHAPTER') {
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: 'table:nth-child(5) tr td:nth-child(2) a',
                        userData: {
                            label: 'SUBCHAPTER'
                        }
                    });
                }
                if (request.label == 'SUBCHAPTER') {
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: 'table:nth-child(5) tr td:nth-child(1) a',
                        userData: {
                            label: 'RULE'
                        }
                    });
                }
                if (request.label == 'RULE') {
                    let path = $('table:nth-child(2) tr td:nth-child(2)').toArray().map(function (a) {
                        return $(a).text().trim();
                    });
                    path[path.length - 1] += '.html';
                    await self.storeAdministrativeCodes($('table:nth-child(3)').html(), path);
                }
            }, 'https://texreg.sos.state.tx.us/public/readtac$ext.viewtac');
        };
    }
}
exports.Texas = Texas;
