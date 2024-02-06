"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LexisScrapper = void 0;
const crawlee_1 = require("crawlee");
const utils_1 = require("../../utils");
const StateScrapper_1 = require("../StateScrapper");
const _2captcha_1 = require("2captcha");
const playwright = require('playwright');
class LexisScrapper extends StateScrapper_1.StateScrapper {
    constructor() {
        super(...arguments);
        this.parseStatutes = async (url) => {
            return this.parse('statutes', url);
        };
        this.parseConstitution = async (url) => {
            return this.parse('constitution', url);
        };
        this.parseRulesOfCourt = async (url) => {
            return this.parse('rulesOfCourt', url);
        };
        this.parse = async (type, url) => {
            let self = this;
            return await this.runPlaywright(async ({ request, page }) => {
                // const console_logger = (message) => {
                //   console.log(` -> ${blue(message.text())}`);
                // };
                // page.on('console', console_logger);
                await page.waitForSelector('.tocContainer li[aria-expanded="false"] .toc-tree__expansion-menu:not([disabled]) button');
                await page.$$eval('#btnagreeterms', els => {
                    if (els.length == 0) {
                        return;
                    }
                    $(els[0]).trigger('click');
                });
                const limit = null; // documents to scrap limit
                const limit_clicks_per_loop = 5; // tree ajax expands per loop
                const limit_downloads_per_loop = 20; // document downloads per loop
                const seconds_to_wait = 10; // seconds to wait for the ajaxs to end
                const limit_retries = 3; // limit of document retries
                let n_buttons = 0;
                let has_finished_js = false;
                let scrapped = 0;
                let n_as;
                do {
                    has_finished_js = false;
                    page.evaluate(async (params) => {
                        var n_buttons;
                        var n_as = 0;
                        var clicks_left = params.limit_clicks_per_loop;
                        do {
                            n_buttons = $('.tocContainer li[aria-expanded="false"] .toc-tree__expansion-menu:not([disabled]) button').length;
                            if (n_buttons == 0) {
                                let seconds_to_wait = 10;
                                console.log(`There are no buttons to click, they may came from triggered ajax requests, awaiting ${`${seconds_to_wait}`} sec.`);
                                await (new Promise((resolve, reject) => { setTimeout(resolve, seconds_to_wait * 1000); }));
                                n_buttons = $('.tocContainer li[aria-expanded="false"] .toc-tree__expansion-menu:not([disabled]) button').length;
                            }
                            var $button = $('.tocContainer li[aria-expanded="false"] .toc-tree__expansion-menu:not([disabled]):first button');
                            $button.trigger('click');
                            await (new Promise((resolve, reject) => { setTimeout(resolve, 500); }));
                            $button.remove();
                            n_as = $('a[data-action="toclink"]').length;
                            clicks_left--;
                        } while (clicks_left > 0 && (params.limit == null || n_as < params.limit) || n_as == 0);
                    }, { limit, limit_clicks_per_loop }).then(() => {
                        has_finished_js = true;
                    });
                    do {
                        n_as = (await page.$$('a[data-action="toclink"]')).length;
                        process.stdout.write(`\rCount of a[data-action="toclink"]: ${(0, utils_1.green)(`${n_as}`)}`);
                        await (0, crawlee_1.sleep)(250);
                    } while (!has_finished_js);
                    console.log('');
                    console.log(`Awaiting ${(0, utils_1.red)(`${seconds_to_wait}`)} sec. for ajaxs to complete`);
                    await (0, crawlee_1.sleep)(seconds_to_wait * 1000); //awaits for ajaxs to return
                    // page.off('console', console_logger);
                    console.log('Awaiting for a[data-action="toclink"]');
                    await page.waitForSelector('a[data-action="toclink"]');
                    let $as = await page.$$('a[data-action="toclink"]');
                    console.log(`There are ${(0, utils_1.green)(`${$as.length}`)} documents to download in the page`);
                    let downloads_this_loop = 0;
                    let n_retries = 0;
                    for (let i = scrapped; i < $as.length; i++) {
                        $as = await page.$$('a[data-action="toclink"]');
                        try {
                            await self.clickA(type, page, $as[i]);
                        }
                        catch (e) {
                            if (e instanceof playwright.errors.TimeoutError) {
                                if (n_retries >= limit_retries) {
                                    n_retries = 0;
                                    console.log((0, utils_1.cyan)(`${limit_retries} retries reached, continuing...`));
                                    continue;
                                }
                                n_retries++;
                                console.log((0, utils_1.red)(`Retry ${n_retries}/${limit_retries}`));
                                await self.backToIndex(page);
                                i--;
                                continue;
                            }
                        }
                        await self.backToIndex(page);
                        scrapped++;
                        console.log(`${(0, utils_1.red)('####')} ${(0, utils_1.green)(`${scrapped}`)}/${(0, utils_1.cyan)(`${$as.length}`)} documents scrapped`);
                        if (limit !== null && scrapped == limit) {
                            break;
                        }
                        downloads_this_loop++;
                        if (downloads_this_loop == limit_downloads_per_loop) {
                            break;
                        }
                        n_retries = 0;
                    }
                    n_buttons = (await page.$$('.tocContainer li[aria-expanded="false"] .toc-tree__expansion-menu:not([disabled]) button')).length;
                } while (n_buttons > 0 && (limit === null || scrapped < limit));
            }, url);
        };
    }
    async waitForCaptchaOrSkip(page) {
        return new Promise(async (resolve, reject) => {
            let ini_time = (new Date).getTime();
            do {
                await (0, crawlee_1.sleep)(100);
                await page.waitForSelector("body");
                if (await page.$("iframe[src*='recaptcha/api2']")) {
                    return resolve(true);
                }
                else if (await page.$("#TOCTrail li a")) {
                    return resolve(false);
                }
                process.stdout.write((0, utils_1.blue)(`${(new Date).getTime() - ini_time}\r`));
            } while ((new Date).getTime() - ini_time < 30000);
            reject();
        });
    }
    async backToIndex(page) {
        if (await page.$(".tocContainer")) {
            return true;
        }
        await page.goBack();
        return new Promise(async (resolve, reject) => {
            let ini_time = (new Date).getTime();
            do {
                await (0, crawlee_1.sleep)(100);
                await page.waitForSelector("body");
                if (await page.$("iframe[src*='recaptcha/api2']")) {
                    await page.goBack();
                }
                else if (await page.$(".tocContainer")) {
                    return resolve(true);
                }
                process.stdout.write((0, utils_1.green)(`${(new Date).getTime() - ini_time}\r`));
            } while ((new Date).getTime() - ini_time < 30000);
            reject();
        });
    }
    async solveCaptcha(page) {
        if (!process.env['2CAPTCHA_KEY']) {
            // Switch to the CAPTCHA iframe
            const captchaFrameContent = await (await page.waitForSelector("iframe[src*='recaptcha/api2']")).contentFrame();
            // Wait for the CAPTCHA checkbox to appear
            await (await captchaFrameContent.waitForSelector("#recaptcha-anchor")).click();
            await captchaFrameContent.waitForSelector(".recaptcha-checkbox-checked");
            console.log('page.waitForSelector("input[type="submit"]")');
            return await page.waitForSelector('input[type="submit"]').then(async (button) => {
                await button.click({ force: true });
            });
        }
        console.log('Awaiting captcha to be solved');
        const solver = new _2captcha_1.Solver(process.env['2CAPTCHA_KEY']);
        const currentURL = page.url();
        const dataSitekey = (await (await page.$('[data-sitekey]')).getAttribute('data-sitekey')).toString();
        const captchaResponse = await solver.recaptcha(dataSitekey, currentURL);
        // const captchaResponse = {data: 'testtesttesttesttest'}
        console.log(captchaResponse);
        await page.evaluate((captchaResponse) => {
            var textarea = document.getElementById("g-recaptcha-response");
            textarea.style.display = 'block';
            textarea.value = captchaResponse.data;
            var submit = document.getElementsByTagName('input')[2];
            submit.click();
        }, captchaResponse);
    }
    async clickA(type, page, $a) {
        await $a.click();
        if (await this.waitForCaptchaOrSkip(page)) {
            await this.solveCaptcha(page);
        }
        // Wait for the page to navigate to the next page
        await page.waitForSelector('#TOCTrail li a');
        const path = await page.$$eval('#TOCTrail li a', async (els) => {
            var path = [];
            for (var a of els) {
                path.push(a.innerHTML);
            }
            return path;
        });
        let title = await page.$('h2.SS_Banner');
        let title_name = title ? (await title.textContent()).trim() : `no_title_${Math.ceil(Math.random() * 9999999999)}`;
        path.push(title_name + (title_name.endsWith('.') ? '' : '.') + 'html');
        const content = await page.$$eval('.SS_LeftAlign', async (els) => {
            const path = [];
            for (var section of els) {
                path.push(section.innerHTML);
            }
            return path.join('');
        });
        return this.storeFile(content, [type, ...path]);
    }
}
exports.LexisScrapper = LexisScrapper;
