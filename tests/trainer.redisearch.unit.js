'use strict';

const assert = require('assert');
const Trainer = require('../types/trainer');

function redisWithoutSearch () {
  return {
    ft: {
      info: async () => {
        throw new Error("ERR unknown command 'FT.INFO', with args beginning with: 'sensemaker:redisearch:probe'");
      }
    }
  };
}

describe('Trainer without RediSearch', function () {
  it('disables embeddings and still answers search and query', async function () {
    const trainer = new Trainer();
    trainer.redis = redisWithoutSearch();
    const request = { query: 'What are the most urgent items?', user: { id: 3 }, messages: [] };

    const available = await trainer._redisSearchAvailable();
    assert.strictEqual(available, false);

    const ownerStore = await trainer.getStoreForOwner(3);
    assert.strictEqual(ownerStore, null);

    const byOwner = await trainer.searchByOwner(request);
    assert.strictEqual(byOwner.degraded, true);
    assert.deepStrictEqual(byOwner.content, []);

    const found = await trainer.search(request);
    assert.strictEqual(found.type, 'TrainerSearchResponse');
    assert.deepStrictEqual(found.content, []);

    const answer = await trainer.query(request, 1000);
    assert.strictEqual(answer.degraded, true);
    assert.strictEqual(answer.content, '');
  });

  it('treats a missing index as RediSearch being present', async function () {
    const trainer = new Trainer();
    trainer.redis = {
      ft: {
        info: async () => {
          throw new Error('Unknown index name');
        }
      }
    };

    assert.strictEqual(await trainer._redisSearchAvailable(), true);
  });
});
