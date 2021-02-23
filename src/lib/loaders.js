/* eslint-disable no-console */
'use strict';

const fs = require('fs').promises;
const { graphql } = require('@octokit/graphql');
const { request } = require('@octokit/request');
const TOML = require('@iarna/toml');
const typedefs = require('./typedefs');


/**
 * Retrieve information from the GitHub GraphQL API about the requested org
 *
 * @param {string} orgName - The login name of the org to be retrieved
 * @param {string} token - A personal access token for interacting with the API
 * @returns {typedefs.OrgRecord} - The full details of the retrieved org
 */
async function retrieveOrgInfo(orgName, token) {
  let totalCount = 1, retrieved = 0, after = null, allMembers = [], pendingMembers, organization;
  const perPage = 100;
  while (retrieved < totalCount) {
    console.log(`Retrieving ${perPage} GitHub members...`);
    ({ organization } = await graphql(
      `
      query getAllMembers($organization: String!, $first: Int = 100, $after: String = null)
      {
        organization(login: $organization) {
          email
          isVerified
          login
          name
          requiresTwoFactorAuthentication
          twitterUsername
          websiteUrl
          membersWithRole(first: $first, after: $after) {
            edges {
              role
              hasTwoFactorEnabled
              node {
                login
              }
              cursor
            }
            totalCount
          }
          pendingMembers(first: 50) {
            totalCount
            edges {
              node {
                login
              }
            }
          }
        }
      }
      `,
      {
        organization: orgName,
        first: perPage,
        after: after,
        headers: {
          authorization: `token ${token}`
        }
      }
    ));
    const currMembers = organization.membersWithRole;
    // TODO: Loop through these in case there are more than 50?
    pendingMembers = organization.pendingMembers;
    allMembers = allMembers.concat(currMembers.edges);
    totalCount = currMembers.totalCount;
    retrieved += perPage;
    after = currMembers.edges[currMembers.edges.length - 1].cursor;
  }
  const result = {
    members: {
      ...allMembers.reduce((members, member) => {
        members[member.node.login] = {
          role: member.role,
          twoFactorAuth: member.hasTwoFactorEnabled
        };
        return members;
      }, {}),
      ...pendingMembers.edges.reduce((members, member) => {
        members[member.node.login] = {
          role: 'PENDING',
          twoFactorAuth: null
        };
        return members;
      }, {})
    },
    email: organization.email,
    isVerified: organization.isVerified,
    login: organization.login,
    name: organization.name,
    // eslint-disable-next-line id-length
    requiresTwoFactorAuthentication: organization.requiresTwoFactorAuthentication,
    twitterUsername: organization.twitterUsername,
    websiteUrl: organization.websiteUrl,
    applications: await retrieveOrgApplications(orgName, token)
  };
  console.log(`${Object.keys(result.members).length} total members retrieved.`);
  return result;
}

/**
 * Retrieve a list of all applications installed to the requested org
 *
 * @param {string} orgName - The login name of the org to retrieve applications for
 * @param {string} token - A personal access token for interacting with the API
 * @returns {typedefs.AppSet} - A list of all applications installed on the organization
 */
async function retrieveOrgApplications(orgName, token) {
  const response = await request('GET /orgs/{org}/installations', {
    headers: { authorization: `token ${token}` },
    org: orgName
  });
  const result = response.data.installations.reduce((apps, app) => {
    apps.push({
      appId: app.app_id,
      appSlug: app.app_slug,
      repositorySelection: app.repository_selection,
      permissions: app.permissions,
      events: app.events
    });
    return apps;
  }, []);
  console.log(`Loaded ${result.length} application installations for ${orgName}.`);
  return result;
}

/**
 * Load an org's expected configuration from a TOML config file
 *
 * @param {string} fileName - The full path to the config file
 * @returns {typedefs.ExpectedOrgConfig} - The full expected configuration of the org
 */
async function loadMembershipConfig(fileName) {
  const config = await TOML.parse.async(await fs.readFile(fileName));
  const allAdmins = new Set(
    config.teams.filter(
      team => team.default_org_role === 'ADMIN'
    ).reduce(
      (members, team) => { return members.concat(team.members); },
      []
    )
  );

  // Construct a new object consisting of github usernames and membership roles
  config['github-members'] = Object.keys(config.members).reduce((members, key) => {
    const isAdmin = allAdmins.has(key);
    if (Array.isArray(config.members[key])) {
      config.members[key].forEach((member) => { members[member] = isAdmin ? 'ADMIN' : 'MEMBER'; });
    } else {
      members[config.members[key]] = isAdmin ? 'ADMIN' : 'MEMBER';
    }
    return members;
  }, {});
  // TODO: Validate usernames against LDAP
  console.log(`Loaded config for ${config.org.login}. ${Object.keys(config['github-members']).length} memberships expected.`);
  return config;
}

module.exports = { retrieveOrgInfo, retrieveOrgApplications, loadMembershipConfig };
