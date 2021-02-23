'use strict';

const assume = require('assume');
const loaders = require('../src/lib/loaders');
const nock = require('nock');
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

    before(function () {
      scope = nock('https://api.github.com/').get('/orgs/foo/installations').reply(200, {
        total_count: 2,
        installations: [
          {
            id: 1,
            account: {},
            repository_selection: 'all',
            access_tokens_url: 'https://foo/bar/tokens',
            repositories_url: 'https://foo/bar/repos/',
            html_url: 'https://foo/bar/html/',
            app_id: 12,
            app_slug: 'heart-of-gold',
            target_id: 42,
            target_type: 'Organization',
            permissions: {
              foo: 'read',
              bar: 'write',
              baz: 'read'
            },
            events: ['push', 'release']
          },
          {
            id: 2,
            account: {},
            repository_selection: 'selected',
            access_tokens_url: 'https://foo/bar/tokens',
            repositories_url: 'https://foo/bar/repos/',
            html_url: 'https://foo/bar/html/',
            app_id: 13,
            app_slug: 'infinite-improbability-drive',
            target_id: 42,
            target_type: 'Organization',
            permissions: {
              foo: 'write',
              bar: 'read',
              baz: 'write'
            },
            events: ['issue', 'discussion', 'pull_request']
          }
        ]
      }).persist();
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
