"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseScrapper = void 0;
const crawlee_1 = require("crawlee");
const utils_1 = require("../utils");
const path_1 = require("path");
const fs_1 = require("fs");
const playwright_extra_1 = require("playwright-extra");
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
// First, we tell playwright-extra to use the plugin (or plugins) we want.
// Certain plugins might have options you can pass in - read up on their documentation!
playwright_extra_1.chromium.use((0, puppeteer_extra_plugin_stealth_1.default)());
playwright_extra_1.firefox.use((0, puppeteer_extra_plugin_stealth_1.default)());
class BaseScrapper {
    constructor(state = '') {
        this.state = state;
        this.isFederal = false;
        this.runCheerio = async (requestHandler, url, crawlerOptions = {}) => {
            if (crawlerOptions.random_queue) {
                const config = crawlee_1.Configuration.getGlobalConfig();
                config.set('defaultRequestQueueId', `cheerioStack.${Math.random()}`);
            }
            const options = {};
            options.requestHandlerTimeoutSecs = 3600;
            options.requestHandler = requestHandler;
            if (crawlerOptions.max_requests_per_minute) {
                options.maxRequestsPerMinute = crawlerOptions.max_requests_per_minute;
            }
            if (crawlerOptions.max_concurrency) {
                options.maxConcurrency = crawlerOptions.max_concurrency;
            }
            return await (new crawlee_1.CheerioCrawler(options)).run([{
                    url: url,
                    userData: {
                        label: 'START'
                    }
                }]);
        };
        this.runPlaywright = async (requestHandler, url, crawlerOptions = {}) => {
            if (crawlerOptions.random_queue) {
                const config = crawlee_1.Configuration.getGlobalConfig();
                config.set('defaultRequestQueueId', `playwrightStack.${Math.random()}`);
            }
            const options = {};
            options.requestHandlerTimeoutSecs = 999999;
            options.headless = false;
            options.launchContext = {
                launcher: playwright_extra_1.chromium,
                launchOptions: {
                    headless: options.headless,
                    timeout: 999999000
                },
            };
            options.requestHandler = requestHandler;
            return await (new crawlee_1.PlaywrightCrawler(options)).run([{
                    url: url,
                    userData: {
                        label: 'START'
                    }
                }]);
        };
        this.downloadFile = async (url, path) => {
            path = (0, utils_1.fixPath)(path);
            const baseDir = !this.isFederal ? 'states/' : '';
            let filepath = (0, utils_1.clearForFilesystem)(`${this.baseDir}/data/${baseDir}${this.state}/${path.join('/')}`);
            let filedir = (0, path_1.dirname)(filepath);
            let exists = await (new Promise((resolve, reject) => {
                (0, fs_1.access)(filepath, fs_1.constants.F_OK, (err) => {
                    resolve(!err);
                });
            }));
            if (exists) {
                // console.log(`File "${filepath}" already exists`)
                return;
            }
            return await (new Promise((resolve, reject) => {
                (0, fs_1.mkdir)(filedir, { recursive: true }, async (err) => {
                    if (err) {
                        console.error(`Error creating directory: ${err.message}`);
                        return;
                    }
                    console.log(`Downloading ${url} to ${filepath}`);
                    await (0, utils_1.downloadFile)(url, filepath);
                    resolve(!err);
                });
            }));
        };
        this.storeFile = async (content, path) => {
            path = (0, utils_1.fixPath)(path);
            const baseDir = !this.isFederal ? 'states/' : '';
            let filepath = (0, utils_1.clearForFilesystem)(`${this.baseDir}/data/${baseDir}${this.state}/${path.join('/')}`);
            let filedir = (0, path_1.dirname)(filepath);
            return await (new Promise((resolve, reject) => {
                (0, fs_1.mkdir)(filedir, { recursive: true }, async (err) => {
                    if (err) {
                        console.error(`Error creating directory: ${err.message}`);
                        return reject();
                    }
                    console.log(`Storing to ${filepath}`);
                    (0, fs_1.writeFile)(filepath, content, (err) => {
                        return resolve(!err);
                    });
                });
            }));
        };
        this.moveDownloadedFile = async (download, path) => {
            path = (0, utils_1.fixPath)(path);
            const baseDir = !this.isFederal ? 'states/' : '';
            let filepath = (0, utils_1.clearForFilesystem)(`${this.baseDir}/data/${baseDir}${this.state}/${path.join('/')}`);
            let filedir = (0, path_1.dirname)(filepath);
            let exists = await (new Promise((resolve, reject) => {
                (0, fs_1.access)(filepath, fs_1.constants.F_OK, (err) => {
                    resolve(!err);
                });
            }));
            if (exists) {
                // console.log(`File "${filepath}" already exists`)
                return;
            }
            return await (new Promise((resolve, reject) => {
                (0, fs_1.mkdir)(filedir, { recursive: true }, async (err) => {
                    if (err) {
                        console.error(`Error creating directory: ${err.message}`);
                        return reject();
                    }
                    console.log(`Moving download to ${filepath}`);
                    await download.saveAs(filepath);
                    return resolve(true);
                });
            }));
        };
        this.baseDir = (0, path_1.dirname)((0, path_1.dirname)((0, path_1.dirname)(__filename)));
        this.baseDir = this.baseDir == '/' ? '' : this.baseDir;
    }
}
exports.BaseScrapper = BaseScrapper;
