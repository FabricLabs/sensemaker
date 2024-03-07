import { Federal } from "./scrappers/Federal";

import { array_combine, green, red } from "./utils";
import dotenv from 'dotenv'; 

dotenv.config();

const states_parsers:{ [key: string]: () => Federal } = {
  'Federal': () => new Federal
};
const allowed_pages:string[] = [
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

interface Params {
  states: string[],
  pages: string[],
}

function checkRejectedParams(argv: string[]): void {
  const allowed_pages_i = allowed_pages.map(page => page.toLowerCase());
  const rejected = argv.filter((param) => {
    const param_i = param.toLocaleLowerCase();
    return !allowed_pages_i.includes(param_i)
  });
  if(rejected.length == 0) {
    return;
  }
  const errors = [];

  errors.push(`${red('Error')}: There are invalid params "${rejected.map(e => red(e)).join('", "')}"`)
  errors.push('======================================================')
  errors.push(`${green('Valid Resources')}: ${allowed_pages.join(', ')}`)
  errors.push(``)

  errors.forEach((e) => console.error(e));

  process.exit();
}

function processParams(): Params {
  const argv:string[] = process.argv.slice(2);

  checkRejectedParams(argv);

  const params: Params = {
    states: ['Federal'],
    pages: []
  }
  
  const pages_map = array_combine(allowed_pages.map(state => state.toLowerCase()), allowed_pages);
  params.pages = argv.map(param => {
    const param_i = param.toLowerCase();
    return !!pages_map[param_i] ? pages_map[param_i] : null;
  }).filter(param => {
    return allowed_pages.includes(param)
  });

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
      let scrapper:Federal = states_parsers[state]();
      switch(page) {
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