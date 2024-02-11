"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewJersey = void 0;
const utils_1 = require("../utils");
const StateScrapper_1 = require("./StateScrapper");
class NewJersey extends StateScrapper_1.StateScrapper {
    constructor() {
        super(NewJersey.name);
        this.statutes = async () => {
            let self = this;
            await this.runPlaywright(async ({ page, $ }) => {
                await page.waitForSelector('.legislative-downloads_listItem__18eLv');
                let files = await page.$$eval('.legislative-downloads_listItem__18eLv a[href]', (els) => {
                    var _a;
                    const zips = [];
                    for (const element of els) {
                        const url = (_a = element.attributes.getNamedItem('href')) === null || _a === void 0 ? void 0 : _a.value.trim();
                        if (url) {
                            zips.push({
                                url: url,
                                path: [element.textContent]
                            });
                        }
                    }
                    return zips;
                });
                await page.$$eval('.legislative-downloads_listItem__18eLv:nth-child(1) a', (els) => {
                    if (els.length > 0) {
                        els[0].id = 'this-is-an-id';
                    }
                });
                await page.click('#this-is-an-id');
                await page.waitForSelector('.legislative-downloads_statutesList__GZfBc.legislative-downloads_list__eUhRE');
                files = [...files, ...await page.$$eval('.legislative-downloads_listItem__18eLv a[href]', (els) => {
                        var _a;
                        const zips = [];
                        for (const element of els) {
                            const url = (_a = element.attributes.getNamedItem('href')) === null || _a === void 0 ? void 0 : _a.value.trim();
                            if (url) {
                                zips.push({
                                    url: url,
                                    path: ['gis', element.textContent]
                                });
                            }
                        }
                        return zips;
                    })];
                // attempt to re download files in case of error
                for (const file of files) {
                    await self.downloadStatutes(file.url, file.path);
                }
            }, 'https://www.njleg.state.nj.us/legislative-downloads?downloadType=Statutes');
        };
        this.rulesOfCourt = async () => {
            let self = this;
            await this.runPlaywright(async ({ page }) => {
                page.on('console', (message) => {
                    console.log(` -> ${(0, utils_1.blue)(message.text())}`);
                });
                let n = 0;
                let initial_time = Date.now();
                let elapsed_time;
                do {
                    await (0, utils_1.sleep)(100);
                    n = await page.$$eval('#block-njcourts-content .mt-3 ul li', (els) => {
                        return els.length;
                    });
                    elapsed_time = Date.now() - initial_time;
                    process.stdout.write(`${(0, utils_1.yellow)('Awaiting initial ajax:')} ${(0, utils_1.green)((elapsed_time / 1000).toFixed(2))}sec - ${n}      \r`);
                } while (n == 0 && elapsed_time < 30000);
                process.stdout.write(`\n`);
                if (n == 0) {
                    console.log(`${(0, utils_1.red)('Initial ajax failed.')} Exiting...`);
                    process.exit();
                }
                console.log(`${(0, utils_1.yellow)('Clicking all not expanded')} ${(0, utils_1.green)('li')}`);
                n = await page.$$eval('#block-njcourts-content .mt-3 ul li span:nth-child(1)', async (els) => {
                    for (var el of els) {
                        await (new Promise((resolve, reject) => { setTimeout(resolve, Math.ceil(50 + Math.random() * 50)); }));
                        jQuery(el).trigger('click');
                    }
                    return els.length;
                });
                let expanded = 0;
                initial_time = Date.now();
                do {
                    await (0, utils_1.sleep)(100);
                    expanded = await page.$$eval('#block-njcourts-content .mt-3 ul li.expanded', (els) => {
                        return els.length;
                    });
                    expanded += await page.$$eval('#block-njcourts-content .mt-3 ul li.expanded-content', (els) => {
                        return els.length;
                    });
                    elapsed_time = Date.now() - initial_time;
                    process.stdout.write(`${(0, utils_1.yellow)('Awaiting all')} ${(0, utils_1.green)('li to load')}${(0, utils_1.yellow)(':')} ${(0, utils_1.green)((elapsed_time / 1000).toFixed(2))}sec - ${n} - ${expanded}     \r`);
                } while (n - expanded > 5 && elapsed_time < 300000);
                process.stdout.write(`\n`);
                console.log(`${(0, utils_1.yellow)('Clicking all not expanded')} ${(0, utils_1.green)('li > ul > li')}`);
                n = await page.$$eval('#block-njcourts-content .mt-3 > ul > li.expanded ul li span:nth-child(1)', async (els) => {
                    for (var el of els) {
                        await (new Promise((resolve, reject) => { setTimeout(resolve, Math.ceil(50 + Math.random() * 50)); }));
                        jQuery(el).trigger('click');
                    }
                    return els.length;
                });
                console.log(`${(0, utils_1.yellow)('Awaiting all')} ${(0, utils_1.green)('li > ul > li')} to load`);
                do {
                    await (0, utils_1.sleep)(100);
                    expanded = await page.$$eval('#block-njcourts-content .mt-3 ul li.expanded ul li.expanded-content', (els) => {
                        return els.length;
                    });
                    elapsed_time = Date.now() - initial_time;
                    process.stdout.write(`\r${(0, utils_1.green)((elapsed_time / 1000).toFixed(2))}sec - ${n} - ${expanded}   `);
                } while (n - expanded > 5 && elapsed_time < 300000);
                process.stdout.write(`\n`);
                let pdf_files = await page.$$eval('#block-njcourts-content .mt-3 ul a[data-entity-substitution]', (els) => {
                    var items = [];
                    for (var el of els) {
                        var $a = jQuery(el);
                        items.push({
                            url: `https://www.njcourts.gov${$a.attr('href')}`,
                            path: [$a.closest('li.expanded-content').find('span:first').text(), $a.text()]
                        });
                    }
                    return items;
                });
                let storables = await page.$$eval('#block-njcourts-content .mt-3 ul li .content', (els) => {
                    var items = [];
                    for (var el of els) {
                        var $content = jQuery(el);
                        if ($content.find('a[data-entity-substitution]').length > 0) {
                            continue;
                        }
                        items.push({
                            content: $content.html(),
                            path: [
                                $content.closest('li.expanded').find('span:first').text(),
                                $content.closest('li.expanded-content').find('span:first').text() + '.html'
                            ]
                        });
                    }
                    return items;
                });
                for (const pdf of pdf_files) {
                    pdf.path[pdf.path.length - 1] = `${pdf.path[pdf.path.length - 1]}.pdf`;
                    await self.downloadRulesOfCourt(pdf.url, pdf.path);
                }
                for (const storable of storables) {
                    await self.storeRulesOfCourt(storable.content, storable.path);
                }
            }, 'https://www.njcourts.gov/attorneys/rules-of-court');
        };
        this.constitution = async () => {
            await this.downloadConstitution('https://pub.njleg.state.nj.us/statutes/NJCONST-TEXT.zip', ['NJCONST-TEXT.zip']);
        };
        this.administrativeCodes = async () => {
            let self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                for (let a of $('.table-striped a')) {
                    let url = $(a).attr('href');
                    url = (url.startsWith('title') ? '/education/code/current/' : '') + url;
                    await self.downloadAdministrativeCodes(`https://www.nj.gov${url}`, [$(a).text().trim() + '.pdf']);
                }
            }, 'https://www.nj.gov/education/code/current/index.shtml');
        };
    }
}
exports.NewJersey = NewJersey;
