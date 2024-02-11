"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.California = void 0;
const StateScrapper_1 = require("./StateScrapper");
const utils_1 = require("../utils");
const async_mutex_1 = require("async-mutex");
class California extends StateScrapper_1.StateScrapper {
    constructor() {
        super(California.name);
        this.playwrightMutex = new async_mutex_1.Mutex;
        this.statutes = async () => {
            let self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                console.log((0, utils_1.cyan)(request.url));
                if (request.label == 'START') {
                    for (let option of $('select#session_year option').toArray()) {
                        await enqueueLinks({
                            strategy: 'same-domain',
                            urls: [`https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml?session_year=${$(option).attr('value')}&house=Both&author=All&lawCode=All`],
                            userData: {
                                label: 'PAGE'
                            }
                        });
                    }
                }
                if (request.label == 'PAGE') {
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: '#bill_results tbody tr a',
                        userData: {
                            label: 'STATUTE'
                        }
                    });
                }
                const processable_tabs = [
                    "Votes",
                    "History",
                    "Bill Analysis",
                    "Today's Law As Amended",
                    "Status"
                ];
                if (request.label == 'STATUTE') {
                    console.log('statute');
                    let bill_analysis_url = undefined;
                    const type = typeof request.userData.type == 'undefined' ? 'Text' : request.userData.type;
                    const bill_name = $('h1:nth-child(1)').remove('span').text().trim();
                    const path = [bill_name, `${type}.html`];
                    if (type == 'Text') { //add extra tabs
                        await $('#tab_panel span.tab_not_selected a.tab_link').toArray().forEach(async (a) => {
                            const $a = $(a);
                            const type = $a.find('span').text().trim();
                            if (!processable_tabs.includes(type)) {
                                return;
                            }
                            const url = `https://leginfo.legislature.ca.gov${$a.attr('href')}`;
                            if (type == 'Bill Analysis') {
                                bill_analysis_url = {
                                    url: url,
                                    path: [bill_name, type]
                                };
                                return;
                            }
                            enqueueLinks({
                                strategy: 'same-domain',
                                urls: [url],
                                userData: {
                                    label: 'STATUTE',
                                    type: type
                                }
                            });
                        });
                    }
                    await self.storeStatutes($('.tab_content').html(), path);
                    if (!bill_analysis_url) {
                        return;
                    }
                    console.log(bill_analysis_url);
                    const releaseMutex = await self.playwrightMutex.acquire(); //prevents multiple browsers running concurrently
                    await self.runPlaywright(async ({ page, request, $ }) => {
                        console.log((0, utils_1.magenta)(request.url));
                        // page.on('console', (message) => {
                        //   console.log(` -> ${blue(message.text())}`);
                        // });
                        // console.log('Awaiting #billanalysis...');
                        // await page.waitForSelector('#billanalysis');
                        const ids = await page.$$eval('a.portletNav', (els) => {
                            var ids = [];
                            var id;
                            for (const n in els) {
                                id = `this-is-an-id-${n}`;
                                els[n].id = id;
                                ids.push({
                                    id: id,
                                    name: `${els[n].textContent.replace(/[\/]+/g, '.')}.pdf`
                                });
                            }
                            return ids;
                        });
                        if (ids.length == 0) {
                            return;
                        }
                        // console.log(ids)
                        for (const id of ids) {
                            const downloadPromise = page.waitForEvent('download');
                            await page.click(`#${id.id}`);
                            const download = await downloadPromise;
                            await self.moveDownloadedStatutes(download, [...bill_analysis_url.path, id.name]);
                        }
                    }, bill_analysis_url.url, { random_queue: true });
                    releaseMutex(); //allows new playwrigth to run
                }
            }, 'https://leginfo.legislature.ca.gov/faces/billSearchClient.xhtml');
        };
        this.rulesOfCourt = async () => {
            let self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                for (let a of $('.container-inlinesearch a[href$=".pdf"]').toArray()) {
                    const $a = $(a);
                    await self.downloadRulesOfCourt(`https://www.courts.ca.gov${$a.attr('href')}`, [$a.closest('li').find('a:first').text().trim() + '.pdf']);
                }
            }, 'https://www.courts.ca.gov/rules.htm');
        };
        this.constitution = async () => {
            let self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                if (request.label == 'START') {
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: '.tab_content .portletNav',
                        userData: {
                            label: 'ARTICLE'
                        }
                    });
                }
                if (request.label == 'ARTICLE') {
                    self.storeConstitution($('.tab_content').html(), [$('h5').text().trim() + '.html']);
                }
            }, 'https://leginfo.legislature.ca.gov/faces/codesTOCSelected.xhtml?tocCode=CONS&tocTitle=+California+Constitution+-+CONS');
        };
        this.administrativeCodes = async () => {
            let self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                console.log(request.url);
                if (request.label == 'START') {
                    if ($('.co_genericWhiteBox li a').length == 0) {
                        console.log(await $('body').html());
                        throw new Error('Fake error to force reprocess url');
                    }
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: '.co_genericWhiteBox li a',
                        userData: {
                            label: 'TITLE'
                        }
                    });
                }
                if (request.label == 'TITLE') {
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: '.co_genericWhiteBox li a',
                        userData: {
                            label: 'DIVISION'
                        }
                    });
                }
                if (request.label == 'DIVISION') {
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: '.co_genericWhiteBox li a',
                        userData: {
                            label: 'CHAPTER'
                        }
                    });
                }
                if (request.label == 'CHAPTER') {
                    await (0, utils_1.sleep)(300 + Math.round(Math.random() * 700));
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: '.co_genericWhiteBox li a',
                        userData: {
                            label: 'ARTICLE'
                        }
                    });
                }
                if (request.label == 'ARTICLE') {
                    await (0, utils_1.sleep)(600 + Math.round(Math.random() * 800));
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: '.co_genericWhiteBox li a',
                        userData: {
                            label: 'ITEM'
                        }
                    });
                }
                if (request.label == 'ITEM') {
                    await (0, utils_1.sleep)(500 + Math.round(Math.random() * 800));
                    const data = $('.co_genericWhiteBox:first').html();
                    if (!data) {
                        enqueueLinks({
                            urls: [request.url]
                        });
                        return;
                    }
                    const path = [];
                    for (let el of $('.co_genericBoxContent:first .co_headtext')) {
                        for (let content of $(el).contents()) {
                            if (content.nodeType == 3) {
                                path.push($(content).text().trim());
                            }
                        }
                    }
                    const title = $('h2:first').text().trim();
                    path.push(title + (title.endsWith('.') ? '' : '.') + 'html');
                    try {
                        await self.storeAdministrativeCodes(data, path);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            }, 'https://govt.westlaw.com/calregs/Browse/Home/California/CaliforniaCodeofRegulations', {
                max_requests_per_minute: 120
            });
        };
    }
}
exports.California = California;
