import { CheerioCrawler, CheerioCrawlerOptions, CheerioRequestHandler, Configuration, PlaywrightCrawler, PlaywrightCrawlerOptions, PlaywrightRequestHandler } from "crawlee";
import { clearForFilesystem, downloadFile, fixPath } from "../utils";
import { dirname } from "path";
import { access, constants, mkdir, writeFile } from "fs";
import { Download } from "playwright";
import { chromium, firefox } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

// First, we tell playwright-extra to use the plugin (or plugins) we want.
// Certain plugins might have options you can pass in - read up on their documentation!
chromium.use(stealthPlugin());
firefox.use(stealthPlugin());

export interface StateScrapperInterface {
  statutes(): Promise<void>;
  constitution(): Promise<void>;
  rulesOfCourt(): Promise<void>;
  administrativeCodes(): Promise<void>;
}

export interface DownloadableFile {
  url: string,
  path: string[]
}

export interface StorableData {
  content: string,
  path: string[]
}

export interface CrawlerOptions {
  random_queue?: boolean
  max_requests_per_minute?: number
  max_concurrency?: number
}

export class StateScrapper {

  protected baseDir;

  constructor(public state: string = '') {
    this.baseDir = dirname(dirname(dirname(__filename)));
    this.baseDir = this.baseDir == '/' ? '' : this.baseDir;
  }

  protected runCheerio = async (requestHandler: CheerioRequestHandler, url: string, crawlerOptions: CrawlerOptions = {}) => {
    if (crawlerOptions.random_queue) {
      const config = Configuration.getGlobalConfig();
      config.set('defaultRequestQueueId', `cheerioStack.${Math.random()}`)
    }

    const options: CheerioCrawlerOptions = {};
    options.requestHandlerTimeoutSecs = 3600;
    options.requestHandler = requestHandler;

    if (crawlerOptions.max_requests_per_minute) {
      options.maxRequestsPerMinute = crawlerOptions.max_requests_per_minute;
    }
    if (crawlerOptions.max_concurrency) {
      options.maxConcurrency = crawlerOptions.max_concurrency;
    }

    return await (new CheerioCrawler(options)).run([{
      url: url,
      userData: {
        label: 'START'
      }
    }]);
  }

  protected runPlaywright = async (requestHandler: PlaywrightRequestHandler, url: string, crawlerOptions: CrawlerOptions = {}) => {
    if (crawlerOptions.random_queue) {
      const config = Configuration.getGlobalConfig();
      config.set('defaultRequestQueueId', `playwrightStack.${Math.random()}`)
    }
    const options: PlaywrightCrawlerOptions = {};
    options.requestHandlerTimeoutSecs = 999999;
    options.headless = false;
    options.launchContext = {
      launcher: chromium,
      launchOptions: {
        headless: options.headless,
        timeout: 999999000
      },
    };
    options.requestHandler = requestHandler;

    return await (new PlaywrightCrawler(options)).run([{
      url: url,
      userData: {
        label: 'START'
      }
    }]);
  }

  protected downloadConstitution = async (url: string, path: string[]) => {
    return this.downloadFile(url, ['constitution', ...path]);
  }

  protected downloadStatutes = async (url: string, path: string[]) => {
    return this.downloadFile(url, ['statutes', ...path]);
  }

  protected downloadRulesOfCourt = async (url: string, path: string[]) => {
    return this.downloadFile(url, ['rulesOfCourt', ...path]);
  }

  protected downloadAdministrativeCodes = async (url: string, path: string[]) => {
    return this.downloadFile(url, ['administrativeCodes', ...path]);
  }

  protected downloadFile = async (url: string, path: string[]) => {
    path = fixPath(path);
    let filepath = clearForFilesystem(`${this.baseDir}/data/states/${this.state}/${path.join('/')}`);
    let filedir = dirname(filepath);

    let exists = await (new Promise((resolve, reject) => {
      access(filepath, constants.F_OK, (err) => {
        resolve(!err);
      });
    }));

    if (exists) {
      // console.log(`File "${filepath}" already exists`)
      return;
    }

    return await (new Promise((resolve, reject) => {
      mkdir(filedir, { recursive: true }, async (err) => {
        if (err) {
          console.error(`Error creating directory: ${err.message}`);
          return;
        }
        console.log(`Downloading ${url} to ${filepath}`)
        await downloadFile(url, filepath);
        resolve(!err);
      });
    }));
  }

  protected storeConstitution = async (content: string | Buffer, path: string[]) => {
    return this.storeFile(content, ['constitution', ...path]);
  }

  protected storeStatutes = async (content: string | Buffer, path: string[]) => {
    return this.storeFile(content, ['statutes', ...path]);
  }

  protected storeRulesOfCourt = async (content: string | Buffer, path: string[]) => {
    return this.storeFile(content, ['rulesOfCourt', ...path]);
  }

  protected storeAdministrativeCodes = async (content: string, path: string[]) => {
    return this.storeFile(content, ['administrativeCodes', ...path]);
  }

  protected storeFile = async (content: string | Buffer, path: string[]) => {
    path = fixPath(path);
    let filepath = clearForFilesystem(`${this.baseDir}/data/states/${this.state}/${path.join('/')}`);
    let filedir = dirname(filepath);

    return await (new Promise((resolve, reject) => {
      mkdir(filedir, { recursive: true }, async (err) => {
        if (err) {
          console.error(`Error creating directory: ${err.message}`);
          return reject();
        }
        console.log(`Storing to ${filepath}`);
        writeFile(filepath, content, (err) => {
          return resolve(!err);
        });
      });
    }));
  }

  protected moveDownloadedConstitution = (download: Download, path: string[]) => {
    return this.moveDownloadedFile(download, ['constitution', ...path]);
  }

  protected moveDownloadedStatutes = (download: Download, path: string[]) => {
    return this.moveDownloadedFile(download, ['statutes', ...path]);
  }

  protected moveDownloadedRulesOfCourt = (download: Download, path: string[]) => {
    return this.moveDownloadedFile(download, ['rulesOfCourt', ...path]);
  }

  protected moveDownloadedAdministrativeCodes = async (download: Download, path: string[]) => {
    return this.moveDownloadedFile(download, ['administrativeCodes', ...path]);
  }

  protected moveDownloadedFile = async (download: Download, path: string[]) => {
    path = fixPath(path);
    let filepath = clearForFilesystem(`${this.baseDir}/data/states/${this.state}/${path.join('/')}`);
    let filedir = dirname(filepath);

    let exists = await (new Promise((resolve, reject) => {
      access(filepath, constants.F_OK, (err) => {
        resolve(!err);
      });
    }));

    if (exists) {
      // console.log(`File "${filepath}" already exists`)
      return;
    }


    return await (new Promise((resolve, reject) => {
      mkdir(filedir, { recursive: true }, async (err) => {
        if (err) {
          console.error(`Error creating directory: ${err.message}`);
          return reject();
        }
        console.log(`Moving download to ${filepath}`);
        await download.saveAs(filepath);
        return resolve(true);
      });
    }));
  }
}