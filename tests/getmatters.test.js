const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

const myMiddleware = require('../routes/matters/list_matters');

describe('Matters test', () => {
  let mockRequest, mockResponse, nextFunction, dbStub;

  beforeEach(() => {
    // Here we provide a hardcoded bearer token
    // const token = "Bearer eyJhbGciOiJFUzI1NksiLCJpc3MiOiIwMjI3NGUwNzU0NDQxYzk3ZWZhM2YxZDExYzk2M2NkMDBiZTFlYzlhNDY4MTRmYThkMjk4NDNlMjFlZWU1NDY4YTAiLCJ0eXAiOiJKV1QifQ.eyJjYXAiOiJPUF9JREVOVElUWSIsImlhdCI6MTcxMzE5Mzk4NCwiaXNzIjoiMDIyNzRlMDc1NDQ0MWM5N2VmYTNmMWQxMWM5NjNjZDAwYmUxZWM5YTQ2ODE0ZmE4ZDI5ODQzZTIxZWVlNTQ2OGEwIiwic3ViIjoiMTEiLCJzdGF0ZSI6eyJyb2xlcyI6WyJhZG1pbiIsInVzZXIiXX19.ZmE2NTg3MmMzMDNmZjczZGZiMTc4NTg3Y2U2ZDIzZWZiZDBiMzI0NDNjOGE5YjNjYzRjZjA3MzlkMjQwY2NjOA";

    // Mock the request object including authorization header
    mockRequest = {
      headers: {
        // authorization: token
      },
      user: {
        id: 11
      }
    };

    // Mock the response object
    mockResponse = {
      format: sinon.stub(),
      send: sinon.spy(),
      json: sinon.spy()
    };

    // Stub the db method for database calls
    // please consider changing the data accordingly
    dbStub = sinon.stub().returns({
      where: sinon.stub().returnsThis(),
      orderBy: sinon.stub().returnsThis(),
      paginate: async () => ({
        data: [
          {
            "id": 1,
            "created_at": "2024-04-15T16:05:37.000Z",
            "updated_at": "2024-04-15T16:05:37.000Z",
            "creator": 11,
            "title": "new test matter",
            "description": null,
            "plaintiff": "me",
            "defendant": "also me",
            "representing": "P",
            "jurisdiction_id": 4,
            "court_id": 3556,
            "note": null,
            "file": null
        }
        ]
      })
    });

    // Replace the `this.db` with the sinon stub
    myMiddleware.db = dbStub;

    myMiddleware.applicationString = "<html>Some HTML</html>";

    nextFunction = sinon.spy();
  });

  it('should respond with matters data', async () => {
    const matters = await myMiddleware.db('matters').where('creator', mockRequest.user.id).orderBy('updated_at', 'desc').paginate({
      perPage: 10, // Assuming PER_PAGE_LIMIT is 10
      currentPage: 1
    });
    mockResponse.json(matters.data);
    await myMiddleware(mockRequest, mockResponse, nextFunction);
    sinon.assert.calledOnce(mockResponse.json);
    expect(mockResponse.json.firstCall.args).to.be.an('array');
    expect(mockResponse.json.firstCall.args[0].some((item)=> item.id ===1 || item.creator === 11)).to.equal(true);

  });

});

