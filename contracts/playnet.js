export default function PlayNetFederation (state) {
  return Object.assign({}, state, {
    name: 'sensemaker',
    interval: 60000,
    state: {
      chains: {
        BTC: {
          genesis: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206'
        }
      }
    },
    validators: [
      
    ],
    constraints: {
      supply: function (blocks) {
        return blocks * 5;
      }
    }
  });
}