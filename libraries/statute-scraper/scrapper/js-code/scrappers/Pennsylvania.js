"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pennsylvania = void 0;
const StateScrapper_1 = require("./StateScrapper");
const async_mutex_1 = require("async-mutex");
class Pennsylvania extends StateScrapper_1.StateScrapper {
    constructor() {
        super(Pennsylvania.name);
        this.playwrightMutex = new async_mutex_1.Mutex;
        this.statutes = async () => {
            let self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
                console.log(request.url);
                for (let tr of $('.DataTable tr').toArray().slice(1)) {
                    let url = $(tr).find('td:nth-child(5) a').attr('href');
                    let path = [$(tr).find('td:nth-child(2)').text().trim() + '.pdf'];
                    await self.downloadStatutes(url, path);
                }
            }, 'https://www.legis.state.pa.us/cfdocs/legis/LI/Public/cons_index.cfm');
        };
        this.rulesOfCourt = async () => {
            let self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
            }, 'https://www.pacodeandbulletin.gov/Home/Pacode');
        };
        this.constitution = async () => {
            let self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
            }, 'https://www.legis.state.pa.us/cfdocs/legis/LI/consCheck.cfm?txtType=HTM&ttl=0');
        };
        this.administrativeCodes = async () => {
            let self = this;
            await this.runCheerio(async ({ $, request, enqueueLinks }) => {
            }, 'https://www.pacodeandbulletin.gov/Home/Pacode');
        };
    }
}
exports.Pennsylvania = Pennsylvania;
