/**
 * Demo contract.  Do not use.
 */
const Remote = require('@fabric/http/types/remote');
const CMC_PRO_API_KEY = '02b25bbf-9301-4b46-8ae1-eff796f2e942';

async function main () {
  async function getQuoteForSymbol (symbol) {
    const remote = new Remote({
      authority: 'pro-api.coinmarketcap.com'
    });

    return remote._GET('/' + [
      'v1',
      'cryptocurrency',
      'quotes',
      'latest'
    ].join('/') + `?symbol=${symbol}&convert=BTC&CMC_PRO_API_KEY=${CMC_PRO_API_KEY}`);
  }

  const result = await getQuoteForSymbol('BTC');
  console.log('result:', result);

  return 1;
}

main();
