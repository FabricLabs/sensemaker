"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Federal = void 0;
const BaseScrapper_1 = require("./BaseScrapper");
const path_1 = require("path");
const crawlee_1 = require("crawlee");
const utils_1 = require("../utils");
class Federal extends BaseScrapper_1.BaseScrapper {
    constructor() {
        super('federal');
        this.codeOfFederalRegulations = async () => {
            const self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                console.log(request.url);
                if (request.label == 'START') {
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: 'table.table.fr-table.title-list tr td:first a[href*="title"]',
                        userData: {
                            label: 'TREE'
                        }
                    });
                }
                if (request.label == 'TREE') {
                    if ($('.col-xs-9 .content-block h4').toArray().length === 0) {
                        enqueueLinks({
                            strategy: 'same-domain',
                            selector: '.col-xs-9 .content-block a',
                            userData: {
                                label: 'TREE'
                            }
                        });
                    }
                    else {
                        const content = $('.col-xs-9 .content-block').html();
                        const path = $('.breadcrumb-nav a.breadcrumb-link').toArray().map(a => $(a).text().trim());
                        path.push($($('.breadcrumb-nav .breadcrumb-current').toArray()[0]).text().trim() + '.html');
                        await self.storeCodeOfFederalRegulations(content, path);
                    }
                }
            }, 'https://www.ecfr.gov');
        };
        this.federalRulesOfAppellateProcedure = async () => {
            const self = this;
            await this.uscodeHouseGov(this.storeFederalRulesOfAppellateProcedure);
            await this.dowmloadRulesPolicies([
                '.field.field-name-body:first p:nth-child(4)'
            ], this.downloadFederalRulesOfAppellateProcedure);
        };
        this.federalRulesOfCivilProcedure = async () => {
            const self = this;
            await this.runPlaywright(async ({ request, page, injectJQuery }) => {
                console.log(request.url);
                page.on('console', function (a) {
                    console.log((0, utils_1.blue)('- ' + a));
                });
                await injectJQuery();
                if (request.label == 'START') {
                    await page.waitForSelector('.fa.fa-plus-circle');
                    // opens all laws
                    let pulses;
                    while ((pulses = (await page.$$('.fa.fa-plus-circle'))).length > 0) {
                        for (let pulse of pulses) {
                            await pulse.click();
                        }
                        await (0, crawlee_1.sleep)(500);
                    }
                    await page.waitForSelector('.btn-group-horizontal a[href$=".pdf"]');
                    // while there are pdf links to download
                    while (await page.$('.btn-group-horizontal a[href$=".pdf"]')) {
                        let result = {
                            pdfs: [],
                            nextPageId: null
                        };
                        // while there are pages to fetch save the pdfs urls
                        do {
                            result = await page.evaluate(async (result) => {
                                $('.btn-group-horizontal a[href$=".pdf"]:first').each(function () {
                                    var $panel = $(this).closest('.panel-collapse.collapse.in');
                                    var path = [];
                                    $(this).parents('.panel.panel-default').each(function (i) {
                                        path.push($(this).find('div:first .panel-title > span').text().trim());
                                    });
                                    path.reverse();
                                    $panel.find('.btn-group-horizontal a[href$=".pdf"]').each(function () {
                                        var name = $(this).closest('tr').find('td:first p').text().trim();
                                        result.pdfs.push({
                                            url: $(this).attr('href'),
                                            path: [...path, name + '.pdf']
                                        });
                                    });
                                    // ------ next page ---------------
                                    result.nextPageId = null;
                                    if ($panel.find('.pagination .next').length > 0 && !$panel.find('.pagination .next').hasClass('disabled')) {
                                        result.nextPageId = 'id-next-page-' + (Math.round(Math.random() * 10000000000));
                                        $panel.find('.pagination .next a').attr('id', result.nextPageId);
                                    }
                                });
                                // all the pdfs links collected removing the panel
                                if (!result.nextPageId) {
                                    $('.btn-group-horizontal a[href$=".pdf"]:first').closest('.panel-collapse.collapse.in').remove();
                                }
                                return result;
                            }, result);
                            if (result.nextPageId) {
                                await page.click(`#${result.nextPageId}`);
                                await (0, crawlee_1.sleep)(500);
                                await page.waitForSelector('.btn-group-horizontal a[href$=".pdf"]');
                            }
                        } while (result.nextPageId);
                        // -------------------------------
                        for (let pdf of result.pdfs) {
                            const url = (0, utils_1.completeUrl)(pdf.url, 'https://www.govinfo.gov');
                            await self.downloadFederalRulesOfCivilProcedure(url, pdf.path);
                        }
                    }
                }
            }, 'https://www.govinfo.gov/app/collection/plaw');
            await self.dowmloadRulesPolicies([
                '.field.field-name-body:first p:nth-child(12)'
            ], self.downloadFederalRulesOfCivilProcedure);
        };
        this.federalRulesOfCriminalProcedure = async () => {
            const self = this;
            await self.dowmloadRulesPolicies([
                '.field.field-name-body:first p:nth-child(14)'
            ], self.downloadFederalRulesOfCriminalProcedure);
        };
        this.unitedStatesCode = async () => {
            await this.uscodeHouseGov(this.storeUnitedStatesCode);
        };
        this.uscodeHouseGov = (method) => {
            const self = this;
            return this.runCheerio(async ({ $, request, enqueueLinks }) => {
                console.log(request.url);
                if (['START', 'CONTAINS-IFRAME'].includes(request.label)) {
                    enqueueLinks({
                        strategy: 'all',
                        urls: [(0, utils_1.completeUrl)($('#content .page_content_internal > :nth-child(8) iframe').attr('src'), 'https://uscode.house.gov')],
                        userData: {
                            label: 'IFRAME'
                        }
                    });
                }
                if (request.label == 'IFRAME') {
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: 'a[style*="color: black"]',
                        userData: {
                            label: 'STORABLE'
                        },
                        limit: 3
                    });
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: '.item_right a',
                        userData: {
                            label: 'STORABLE'
                        }
                    });
                    enqueueLinks({
                        strategy: 'same-domain',
                        selector: '.item_left a[target="_top"]',
                        userData: {
                            label: 'CONTAINS-IFRAME'
                        },
                        limit: 3
                    });
                }
                if (request.label == 'STORABLE') {
                    const content = $('#content').html();
                    const path = [];
                    for (const a of $('#frmNav div:nth-child(4) a').toArray().slice(1, -1)) {
                        path.push($(a).text().trim());
                    }
                    path.push($('#frmNav div:nth-child(4) span').text().trim() + '.html');
                    await method(content, path);
                }
                await (0, crawlee_1.sleep)(1000);
            }, 'https://uscode.house.gov', {
                max_concurrency: 3
            });
        };
        this.constitution = async () => {
            const self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                console.log(request.url);
                if (request.label == 'START') {
                    await self.storeConstitution($('#secondary_col2').html(), ['constitution.html']);
                }
            }, 'https://www.senate.gov/about/origins-foundations/senate-and-constitution/constitution.htm');
        };
        this.bankruptcyRules = async () => {
            const self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                console.log(request.url);
                if (request.label == 'START') {
                    for (let a of $('.field.field-name-body a').toArray()) {
                        enqueueLinks({
                            strategy: 'all',
                            urls: [$(a).attr('href')],
                            userData: {
                                label: 'PART',
                                name: $(a).text().trim()
                            }
                        });
                    }
                }
                if (request.label == 'PART') {
                    await self.storeBankruptcyRules($('#docViewer').html(), [`${request.userData.name}.html`]);
                }
            }, 'https://www.uscourts.gov/rules-policies/current-rules-practice-procedure/federal-rules-bankruptcy-procedure');
            await self.dowmloadRulesPolicies([
                '.field.field-name-body:first p:nth-child(6)',
                '.field.field-name-body:first p:nth-child(8)',
                '.field.field-name-body:first ul:nth-child(9)'
            ], self.downloadBankruptcyRules);
        };
        this.federalRulesOfEvidence = async () => {
            const self = this;
            await this.runCheerio(async ({ $, request }) => {
                console.log(request.url);
                const content = $('h1').html() + $('#block-doi-uswds-content').html();
                await self.storeFederalRulesOfEvidence(content, [$('h1').text().trim() + '.html']);
            }, 'https://www.doi.gov/library/collections/law/statutes');
            await self.dowmloadRulesPolicies([
                '.field.field-name-body:first p:nth-child(16)'
            ], self.downloadBankruptcyRules);
        };
        this.rulesOfGoverning = async () => {
            await this.dowmloadRulesPolicies([
                '.field.field-name-body:first p:nth-child(18)'
            ], this.downloadRulesOfGoverning);
        };
        this.rulesOfTheForeignIntelligenceSurveillanceCourt = async () => {
            const self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                console.log(request.url);
                if (request.label == 'START') {
                    enqueueLinks({
                        strategy: 'all',
                        selector: '.field.field-name-body:first p:nth-child(21) a',
                        userData: {
                            label: 'PDF-PAGE'
                        }
                    });
                }
                if (request.label == 'PDF-PAGE') {
                    const url_root = request.url.split('/').slice(0, 3).join('/');
                    for (let a of $('.l-content a[href$=".pdf"]').toArray()) {
                        const $a = $(a);
                        const url = (0, utils_1.completeUrl)($a.attr('href'), url_root);
                        await self.downloadRulesOfTheForeignIntelligenceSurveillanceCourt(url, [$a.text().trim() + '.pdf']);
                    }
                }
            }, 'https://www.uscourts.gov/rules-policies/current-rules-practice-procedure');
        };
        this.formsAccompanyingTheFederalRulesOfProcedure = async () => {
            const self = this;
            // Appellate Rules Forms
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                console.log(request.url);
                const url_root = request.url.split('/').slice(0, 3).join('/');
                for (let a of $('a[href$="download"]').toArray()) {
                    const $a = $(a);
                    const url = (0, utils_1.completeUrl)($a.attr('href'), url_root);
                    await self.downloadFormsAccompanyingTheFederalRulesOfProcedure(url, ['Appellate Rules Forms', $a.closest('li').text().replace('(word)', '').trim() + '.doc']);
                }
            }, 'https://www.uscourts.gov/rules-policies/current-rules-practice-procedure/appellate-rules-forms');
            // Bankruptcy Forms, National Court Forms
            const pages = [
                {
                    name: 'Bankruptcy Forms',
                    url: 'https://www.uscourts.gov/forms/bankruptcy-forms'
                }, {
                    name: 'National Court Forms',
                    url: 'https://www.uscourts.gov/services-forms/forms'
                }
            ];
            for (const page of pages) {
                await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                    console.log(request.url);
                    if (request.label == 'START') {
                        for (let a of $('.views-table tr td:nth-child(2) a').toArray()) {
                            enqueueLinks({
                                strategy: 'same-domain',
                                urls: [(0, utils_1.completeUrl)($(a).attr('href'), 'https://www.uscourts.gov')],
                                userData: {
                                    label: 'PDF-PAGE',
                                    path: $(a).text().trim()
                                }
                            });
                        }
                    }
                    if (request.label == 'PDF-PAGE') {
                        for (let a of $('a[href$="download"]').toArray()) {
                            const $a = $(a);
                            const url = (0, utils_1.completeUrl)($a.attr('href'), 'https://www.uscourts.gov');
                            await self.downloadFormsAccompanyingTheFederalRulesOfProcedure(url, [
                                page.name,
                                request.userData.path,
                                $a.text().replace(/\(.+\)/, '').replace(/download/i, '').trim() + '.pdf'
                            ]);
                        }
                    }
                }, page.url, {
                    max_concurrency: 3
                });
            }
        };
        // -----------------------------
        this.dowmloadRulesPolicies = async (selectors, method) => {
            await this.runCheerio(async ({ $, request }) => {
                console.log(request.url);
                for (const selector of selectors) {
                    const $as = $(`${selector} a`);
                    for (const a of $as) {
                        const $a = $(a);
                        const url = (0, utils_1.completeUrl)($a.attr('href'), 'https://www.uscourts.gov');
                        await method(url, [`${$a.text().trim()}.pdf`]);
                    }
                }
            }, 'https://www.uscourts.gov/rules-policies/current-rules-practice-procedure');
        };
        // -----------------------------
        this.downloadCodeOfFederalRegulations = async (url, path) => {
            return this.downloadFile(url, ['codeOfFederalRegulations', ...path]);
        };
        this.downloadFederalRulesOfAppellateProcedure = async (url, path) => {
            return this.downloadFile(url, ['federalRulesOfAppellateProcedure', ...path]);
        };
        this.downloadFederalRulesOfCivilProcedure = async (url, path) => {
            return this.downloadFile(url, ['federalRulesOfCivilProcedure', ...path]);
        };
        this.downloadFederalRulesOfCriminalProcedure = async (url, path) => {
            return this.downloadFile(url, ['federalRulesOfCriminalProcedure', ...path]);
        };
        this.downloadUnitedStatesCode = async (url, path) => {
            return this.downloadFile(url, ['unitedStatesCode', ...path]);
        };
        this.downloadConstitution = async (url, path) => {
            return this.downloadFile(url, ['constitution', ...path]);
        };
        this.downloadBankruptcyRules = async (url, path) => {
            return this.downloadFile(url, ['bankruptcyRules', ...path]);
        };
        this.downloadFederalRulesOfEvidence = async (url, path) => {
            return this.downloadFile(url, ['federalRulesOfEvidence', ...path]);
        };
        this.downloadRulesOfGoverning = async (url, path) => {
            return this.downloadFile(url, ['rulesOfGoverning', ...path]);
        };
        this.downloadRulesOfTheForeignIntelligenceSurveillanceCourt = async (url, path) => {
            return this.downloadFile(url, ['rulesOfTheForeignIntelligenceSurveillanceCourt', ...path]);
        };
        this.downloadFormsAccompanyingTheFederalRulesOfProcedure = async (url, path) => {
            return this.downloadFile(url, ['formsAccompanyingTheFederalRulesOfProcedure', ...path]);
        };
        // -----------------------------
        this.storeCodeOfFederalRegulations = async (content, path) => {
            return this.storeFile(content, ['codeOfFederalRegulations', ...path]);
        };
        this.storeFederalRulesOfAppellateProcedure = async (content, path) => {
            return this.storeFile(content, ['federalRulesOfAppellateProcedure', ...path]);
        };
        this.storeFederalRulesOfCivilProcedure = async (content, path) => {
            return this.storeFile(content, ['federalRulesOfCivilProcedure', ...path]);
        };
        this.storeUnitedStatesCode = async (content, path) => {
            return this.storeFile(content, ['unitedStatesCode', ...path]);
        };
        this.storeConstitution = async (content, path) => {
            return this.storeFile(content, ['constitution', ...path]);
        };
        this.storeBankruptcyRules = async (content, path) => {
            return this.storeFile(content, ['bankruptcyRules', ...path]);
        };
        this.storeFederalRulesOfEvidence = async (content, path) => {
            return this.storeFile(content, ['federalRulesOfEvidence', ...path]);
        };
        // -----------------------------
        this.moveDownloadedCodeOfFederalRegulations = async (download, path) => {
            return this.moveDownloadedFile(download, ['codeOfFederalRegulations', ...path]);
        };
        this.moveDownloadedFederalRulesOfAppellateProcedure = async (download, path) => {
            return this.moveDownloadedFile(download, ['federalRulesOfAppellateProcedure', ...path]);
        };
        this.moveDownloadedFederalRulesOfCivilProcedure = async (download, path) => {
            return this.moveDownloadedFile(download, ['federalRulesOfCivilProcedure', ...path]);
        };
        this.moveDownloadedUnitedStatesCode = async (download, path) => {
            return this.moveDownloadedFile(download, ['unitedStatesCode', ...path]);
        };
        this.moveDownloadedConstitution = async (download, path) => {
            return this.moveDownloadedFile(download, ['constitution', ...path]);
        };
        this.moveDownloadedBankruptcyRules = async (download, path) => {
            return this.moveDownloadedFile(download, ['bankruptcyRules', ...path]);
        };
        this.moveDownloadedFederalRulesOfEvidence = async (download, path) => {
            return this.moveDownloadedFile(download, ['federalRulesOfEvidence', ...path]);
        };
        this.baseDir = (0, path_1.dirname)((0, path_1.dirname)((0, path_1.dirname)(__filename)));
        this.baseDir = this.baseDir == '/' ? '' : this.baseDir;
        this.isFederal = true;
    }
}
exports.Federal = Federal;
