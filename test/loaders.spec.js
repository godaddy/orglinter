'use strict';

const assume = require('assume');
const fs = require('fs').promises;
const loaders = require('../src/lib/loaders');
const nock = require('nock');
const path = require('path');
const sinon = require('sinon');


describe('Loaders', function () {

  before(function () {
    sinon.stub(console, 'log');
  });

  after(function () {
    sinon.restore();
  });

  describe('retrieveOrgApplications', function () {
    let scope;

    before(async function () {
      const response = JSON.parse(await fs.readFile(path.resolve(__dirname, 'responses/installations.json')));
      scope = nock('https://api.github.com/').get('/orgs/foo/installations').reply(200, response).persist();
    });

    after(function () {
      nock.cleanAll();
    });

    it('calls the proper REST endpoint', async function () {
      await loaders.retrieveOrgApplications('foo', '12345');
      scope.done();
    });

    it('returns only the relevant information', async function () {
      const apps = await loaders.retrieveOrgApplications('foo', '12345');

      assume(apps).eqls([
        {
          appId: 12,
          appSlug: 'heart-of-gold',
          repositorySelection: 'all',
          permissions: {
            foo: 'read',
            bar: 'write',
            baz: 'read'
          },
          events: ['push', 'release']
        },
        {
          appId: 13,
          appSlug: 'infinite-improbability-drive',
          repositorySelection: 'selected',
          permissions: {
            foo: 'write',
            bar: 'read',
            baz: 'write'
          },
          events: ['issue', 'discussion', 'pull_request']
        }
      ]);
    });
  });
});
