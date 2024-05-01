const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const middleware = require('../routes/documents/list_documents');

describe('Middleware Unit Test', function() {
  it('should respond with JSON data', function() {
    const req = {
      query: { page: 1 }
    };
    const res = {
      format: sinon.stub(),
      setHeader: sinon.stub(),
      send: sinon.stub(),
      json: sinon.spy(),

    };
    const next = sinon.stub();
    const documents = {
      data: [
        {
          "id": "87dc5c994a234628d02ab3308bd6e28788e1cf2e53a3d7695fdf016a861b71e4",
          "created_at": "2024-04-26T19:10:12.000Z",
          "description": null,
          "sha1": null,
          "sha256": "d62d1ee99c72b88a6005eed3985f3f95254d7db3ba7a0bf5e0d00a5b3b8bd057",
          "size": null,
          "title": "(P2) PrÃ¡ctica 2.Aplicaciones del CÃ¡lculo diferencial.Aplicaciones del CÃ¡lculo diferencial.pdf",
          "file_id": 2
        },
        {
          "id": "6d924a5f110e61470168f1baf01f323750a4c386c1e1cf2913df27dc10d5c6e4",
          "created_at": "2024-04-26T19:09:58.000Z",
          "description": null,
          "sha1": null,
          "sha256": "309121f0fc0f1fa0b667cb5575b3fabc4cfcd90f36c350556f1a8cc04beb075e",
          "size": null,
          "title": "(P1) PrÃ¡ctica 1.IntroducciÃ³n al CÃ¡lculo diferencial.IntroducciÃ³n al CÃ¡lculo diferencial.pdf",
          "file_id": 1
        }
      ],
      pagination: {
        from: 1,
        to: 10,
        perPage: 10,
        total: 100
      }
    };

    const dbMock = {
      select: sinon.stub().returnsThis(),
      whereNotNull: sinon.stub().returnsThis(),
      andWhere: sinon.stub().returnsThis(),
      orderBy: sinon.stub().returnsThis(),
      paginate: sinon.stub().resolves(documents)
    };

    const middlewareFn = middleware.bind({ db: dbMock });

    middleware.applicationString = "<html>Some HTML</html>";

    res.json(middlewareFn(req, res));

    console.log('1: ');
    expect(res.format.calledOnce).to.be.true;
    console.log('2: ');
    console.log('THIS IS RES: ',res);
    expect(res.json.firstCall.args).to.be.an('array');
    sinon.assert.calledOnce(res.json);

    //expect(res.send.calledOnce).to.be.true;
    //  expect(res.json.firstCall.args[0]).to.deep.equal([{
    //    id: '1',
    //    created_at: documents.data[0].created_at,
    //    description: documents.data[0].description,
    //    sha1: documents.data[0].sha1,
    //    sha256: documents.data[0].sha256,
    //    size: documents.data[0].file_size,
    //    title: documents.data[0].title,
    //    file_id: documents.data[0].file_id,
    //  }]);
  });
});
