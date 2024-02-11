"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Arkansas_1 = require("./scrappers/Arkansas");
const California_1 = require("./scrappers/California");
const Colorado_1 = require("./scrappers/Colorado");
const Florida_1 = require("./scrappers/Florida");
const Georgia_1 = require("./scrappers/Georgia");
const NewJersey_1 = require("./scrappers/NewJersey");
const NewYork_1 = require("./scrappers/NewYork");
const Ohio_1 = require("./scrappers/Ohio");
const Pennsylvania_1 = require("./scrappers/Pennsylvania");
const Tennessee_1 = require("./scrappers/Tennessee");
const Texas_1 = require("./scrappers/Texas");
const utils_1 = require("./utils");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const states_parsers = {
    'Arkansas': () => new Arkansas_1.Arkansas,
    'California': () => new California_1.California,
    'Colorado': () => new Colorado_1.Colorado,
    'Florida': () => new Florida_1.Florida,
    'Georgia': () => new Georgia_1.Georgia,
    'NewJersey': () => new NewJersey_1.NewJersey,
    'NewYork': () => new NewYork_1.NewYork,
    'Ohio': () => new Ohio_1.Ohio,
    'Pennsylvania': () => new Pennsylvania_1.Pennsylvania,
    'Tennessee': () => new Tennessee_1.Tennessee,
    'Texas': () => new Texas_1.Texas,
};
const allowed_states = Object.keys(states_parsers);
const allowed_pages = [
    'statutes',
    'constitution',
    'rulesOfCourt',
    'court',
    'rules',
    'administrativeCodes',
    'administrative',
    'codes',
];
function checkRejectedParams(argv) {
    const allowed_states_i = allowed_states.map(state => state.toLowerCase());
    const allowed_pages_i = allowed_pages.map(page => page.toLowerCase());
    const rejected = argv.filter((param) => {
        const param_i = param.toLocaleLowerCase();
        return !allowed_states_i.includes(param_i) && !allowed_pages_i.includes(param_i);
    });
    if (rejected.length == 0) {
        return;
    }
    const errors = [];
    errors.push(`${(0, utils_1.red)('Error')}: There are invalid params "${rejected.map(e => (0, utils_1.red)(e)).join('", "')}"`);
    errors.push('======================================================');
    errors.push(`${(0, utils_1.green)('Valid States')}: ${allowed_states.join(', ')}`);
    errors.push(`${(0, utils_1.green)('Valid Resources')}: ${allowed_pages.join(', ')}`);
    errors.push(``);
    errors.forEach((e) => console.error(e));
    process.exit();
}
function processParams() {
    const argv = process.argv.slice(2);
    checkRejectedParams(argv);
    const params = {
        states: [],
        pages: []
    };
    const states_map = (0, utils_1.array_combine)(allowed_states.map(state => state.toLowerCase()), allowed_states);
    params.states = argv.map(param => {
        const param_i = param.toLowerCase();
        return !!states_map[param_i] ? states_map[param_i] : null;
    }).filter(param => {
        return allowed_states.includes(param);
    });
    const pages_map = (0, utils_1.array_combine)(allowed_pages.map(state => state.toLowerCase()), allowed_pages);
    params.pages = argv.map(param => {
        const param_i = param.toLowerCase();
        return !!pages_map[param_i] ? pages_map[param_i] : null;
    }).filter(param => {
        return allowed_pages.includes(param);
    });
    params.states = params.states.length == 0 ? allowed_states : params.states;
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
                case 'statutes':
                    await scrapper.statutes();
                    break;
                case 'rulesOfCourt':
                    await scrapper.rulesOfCourt();
                    break;
                case 'constitution':
                    await scrapper.constitution();
                    break;
                case 'administrativeCodes':
                    await scrapper.administrativeCodes();
                    break;
            }
        }
    }
})();
