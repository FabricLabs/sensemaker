import { Arkansas } from "./scrappers/Arkansas";
import { California } from "./scrappers/California";
import { Colorado } from "./scrappers/Colorado";
import { Florida } from "./scrappers/Florida";
import { Georgia } from "./scrappers/Georgia";
import { NewJersey } from "./scrappers/NewJersey";
import { NewYork } from "./scrappers/NewYork";
import { Ohio } from "./scrappers/Ohio";
import { Pennsylvania } from "./scrappers/Pennsylvania";
import { Tennessee } from "./scrappers/Tennessee";
import { Texas } from "./scrappers/Texas";

import { StateScrapperInterface } from "./scrappers/StateScrapper";
import { array_combine, green, red } from "./utils";
import dotenv from 'dotenv'; 
import { Illinois } from "./scrappers/Illinois";

dotenv.config();

const states_parsers:{ [key: string]: () => StateScrapperInterface } = {
  'Arkansas': () => new Arkansas,
  'California': () => new California,
  'Colorado': () => new Colorado,
  'Florida': () => new Florida,
  'Georgia': () => new Georgia,
  'Illinois': () => new Illinois,
  'NewJersey': () => new NewJersey,
  'NewYork': () => new NewYork,
  'Ohio': () => new Ohio,
  'Pennsylvania': () => new Pennsylvania,
  'Tennessee': () => new Tennessee,
  'Texas': () => new Texas,
};
const allowed_states:string[] = Object.keys(states_parsers);
const allowed_pages:string[] = [
  'statutes',
  'constitution',
  'rulesOfCourt',
  'court',
  'rules',
  'administrativeCodes',
  'administrative',
  'codes',
];

interface Params {
  states: string[],
  pages: string[],
}

function checkRejectedParams(argv: string[]): void {
  const allowed_states_i = allowed_states.map(state => state.toLowerCase());
  const allowed_pages_i = allowed_pages.map(page => page.toLowerCase());
  const rejected = argv.filter((param) => {
    const param_i = param.toLocaleLowerCase();
    return !allowed_states_i.includes(param_i) && !allowed_pages_i.includes(param_i)
  });
  if(rejected.length == 0) {
    return;
  }
  const errors = [];

  errors.push(`${red('Error')}: There are invalid params "${rejected.map(e => red(e)).join('", "')}"`)
  errors.push('======================================================')
  errors.push(`${green('Valid States')}: ${allowed_states.join(', ')}`)
  errors.push(`${green('Valid Resources')}: ${allowed_pages.join(', ')}`)
  errors.push(``)

  errors.forEach((e) => console.error(e));

  process.exit();
}

function processParams(): Params {
  const argv:string[] = process.argv.slice(2);

  checkRejectedParams(argv);

  const params: Params = {
    states: [],
    pages: []
  }
  const states_map = array_combine(allowed_states.map(state => state.toLowerCase()), allowed_states);
  params.states = argv.map(param => {
    const param_i = param.toLowerCase();
    return !!states_map[param_i] ? states_map[param_i] : null;
  }).filter(param => {
    return allowed_states.includes(param)
  });
  
  const pages_map = array_combine(allowed_pages.map(state => state.toLowerCase()), allowed_pages);
  params.pages = argv.map(param => {
    const param_i = param.toLowerCase();
    return !!pages_map[param_i] ? pages_map[param_i] : null;
  }).filter(param => {
    return allowed_pages.includes(param)
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
    if(['court', 'rules'].includes(param)) {
      return 'rulesOfCourt';
    } else if(['administrative', 'codes'].includes(param)) {
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
  let params: Params = processParams();
  console.log(`================================`)
  params.states.forEach((state) => {
    params.pages.forEach((page) => {
      console.log(`${state}.${page}`)
    });
  });
  console.log(`================================`)
  console.log(``)
  for(const state of params.states) {
    for(const page of params.pages) {
      console.log(`================================`)
      console.log(`Running ${state}.${page}`)
      console.log(`================================`)
      let scrapper:StateScrapperInterface = states_parsers[state]();
      switch(page) {
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