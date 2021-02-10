/* eslint-disable no-console */
'use strict';

const fs = require('fs').promises;
const { graphql } = require('@octokit/graphql');
const TOML = require('@iarna/toml');

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
    websiteUrl: organization.websiteUrl
  };
  console.log(`${Object.keys(result.members).length} total members retrieved.`);
  return result;
}

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

module.exports = { retrieveOrgInfo, loadMembershipConfig };
