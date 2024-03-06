"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Federal_1 = require("./scrappers/Federal");
const utils_1 = require("./utils");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const states_parsers = {
    'Federal': () => new Federal_1.Federal
};
const allowed_pages = [
    'codeOfFederalRegulations',
    'federalRulesOfAppellateProcedure',
    'federalRulesOfCivilProcedure',
    'federalRulesOfCriminalProcedure',
    'unitedStatesCode',
    'constitution',
    'bankruptcyRules',
    'federalRulesOfEvidence',
    'rulesOfGoverning',
    'rulesOfTheForeignIntelligenceSurveillanceCourt',
    'formsAccompanyingTheFederalRulesOfProcedure',
];
function checkRejectedParams(argv) {
    const allowed_pages_i = allowed_pages.map(page => page.toLowerCase());
    const rejected = argv.filter((param) => {
        const param_i = param.toLocaleLowerCase();
        return !allowed_pages_i.includes(param_i);
    });
    if (rejected.length == 0) {
        return;
    }
    const errors = [];
    errors.push(`${(0, utils_1.red)('Error')}: There are invalid params "${rejected.map(e => (0, utils_1.red)(e)).join('", "')}"`);
    errors.push('======================================================');
    errors.push(`${(0, utils_1.green)('Valid Resources')}: ${allowed_pages.join(', ')}`);
    errors.push(``);
    errors.forEach((e) => console.error(e));
    process.exit();
}
function processParams() {
    const argv = process.argv.slice(2);
    checkRejectedParams(argv);
    const params = {
        states: ['Federal'],
        pages: []
    };
    const pages_map = (0, utils_1.array_combine)(allowed_pages.map(state => state.toLowerCase()), allowed_pages);
    params.pages = argv.map(param => {
        const param_i = param.toLowerCase();
        return !!pages_map[param_i] ? pages_map[param_i] : null;
    }).filter(param => {
        return allowed_pages.includes(param);
    });
    params.pages = params.pages.length == 0 ? allowed_pages : params.pages;
    params.states = params.states.reduce((acumulador, param) => {
        if (!acumulador.includes(param)) {
            acumulador.push(param);
        }
        return acumulador;
    }, []);
    params.pages = params.pages.map((param) => {
        if (['court', 'rules'].includes(param)) {
            return 'rulesOfCourt';
        }
        else if (['administrative', 'codes'].includes(param)) {
            return 'administrativeCodes';
        }
        return param;
    }).reduce((acumulador, param) => {
        if (!acumulador.includes(param)) {
            acumulador.push(param);
        }
        return acumulador;
    }, []);
    return params;
}
(async () => {
    let params = processParams();
    console.log(`================================`);
    params.states.forEach((state) => {
        params.pages.forEach((page) => {
            console.log(`${state}.${page}`);
        });
    });
    console.log(`================================`);
    console.log(``);
    for (const state of params.states) {
        for (const page of params.pages) {
            console.log(`================================`);
            console.log(`Running ${state}.${page}`);
            console.log(`================================`);
            let scrapper = states_parsers[state]();
            switch (page) {
                case 'codeOfFederalRegulations':
                    await scrapper.codeOfFederalRegulations();
                    break;
                case 'federalRulesOfAppellateProcedure':
                    await scrapper.federalRulesOfAppellateProcedure();
                    break;
                case 'federalRulesOfCivilProcedure':
                    await scrapper.federalRulesOfCivilProcedure();
                    break;
                case 'federalRulesOfCriminalProcedure':
                    await scrapper.federalRulesOfCriminalProcedure();
                    break;
                case 'unitedStatesCode':
                    await scrapper.unitedStatesCode();
                    break;
                case 'constitution':
                    await scrapper.constitution();
                    break;
                case 'bankruptcyRules':
                    await scrapper.bankruptcyRules();
                    break;
                case 'federalRulesOfEvidence':
                    await scrapper.federalRulesOfEvidence();
                    break;
                case 'rulesOfGoverning':
                    await scrapper.rulesOfGoverning();
                    break;
                case 'rulesOfTheForeignIntelligenceSurveillanceCourt':
                    await scrapper.rulesOfTheForeignIntelligenceSurveillanceCourt();
                    break;
                case 'formsAccompanyingTheFederalRulesOfProcedure':
                    await scrapper.formsAccompanyingTheFederalRulesOfProcedure();
                    break;
            }
        }
    }
})();
