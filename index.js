/* eslint-disable no-console, no-process-env */
require('dotenv').config();
const fs = require('fs').promises;
const { graphql } = require('@octokit/graphql');
const path = require('path');
const { request } = require('@octokit/request');
const TOML = require('@iarna/toml');

async function retrieveOrgInfo(orgName) {
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
          authorization: `token ${process.env.GITHUB_TOKEN}`
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

function findUndocumentedMembers(configured, retrieved) {
  const undocumented = retrieved.filter(member => !configured.includes(member));
  console.log(`${undocumented.length} undocumented memberships found: `, undocumented);
  return undocumented;
}

function findNewMembers(configured, retrieved) {
  const newMembers = configured.filter(member => !retrieved.includes(member));
  console.log(`${newMembers.length} new memberships requested: `, newMembers);
  return newMembers;
}

function findDemotions(configured, retrieved) {
  const demotions = Object.keys(retrieved).filter(
    (member) => retrieved[member].role === 'ADMIN' && configured[member] === 'MEMBER'
  );
  console.log(`${demotions.length} demotions found: `, demotions);
  return demotions;
}

function findPromotions(configured, retrieved) {
  const promotions = Object.keys(configured).filter(
    (member) => configured[member] === 'ADMIN' && retrieved[member].role === 'MEMBER'
  );
  console.log(`${promotions.length} promotions found: `, promotions);
  return promotions;
}

function validateTwoFactor(members) {
  const violators = Object.keys(members).filter((member) => members[member].twoFactorAuth === false);
  console.log(`${violators.length} two factor auth violators found: `, violators);
  return violators;
}

function validateOrgSettings(organization, config) {
  let failed = false;
  for (const key of Object.keys(config)) {
    if (organization[key] !== config[key]) {
      console.log(`Configured value does not match retrieved value for ${key}. "${config[key]}" vs "${organization[key]}"`);
      failed = true;
    }
  }
  if (failed === true) {
    console.log(`\nERROR! Misconfigured org settings found! See above for more details.\n`);
  }
}

async function inviteUser(username, organization, role = 'member', dryRun) {
  console.log(`Setting ${username} up as a(n) ${role} for ${organization}.`);
  if (dryRun) return;
  // Do the thing!
  const result = await request('PUT /orgs/{org}/memberships/{username}', {
    headers: {
      authorization: `token ${process.env.GITHUB_TOKEN}`
    },
    org: organization,
    username: username,
    role: role
  });
  if (result.status === 200) {
    console.log(`${username} successfully invited to ${organization}!`);
  } else {
    console.log(`ERROR ERROR! ${username} could not be invited to ${organization}!`);
  }
}

async function removeMember(username, organization, dryRun) {
  console.log(`Removing ${username} from ${organization}.`);
  if (dryRun === true) return;
  // Do the thing!
  const result = await request('DELETE /orgs/{org}/members/{username}', {
    headers: {
      authorization: `token ${process.env.GITHUB_TOKEN}`
    },
    org: organization,
    username: username
  });
  if (result.status === 204) {
    console.log(`${username} successfully removed from ${organization}.`);
  } else {
    console.log(`ERROR ERROR! ${username} could not be removed from ${organization}!`);
  }
}

async function promoteMember(username, organization, dryRun) {
  console.log(`Promoting ${username} to admin in ${organization}.`);
  if (dryRun) return;
  // Do the thing!
  await inviteUser(username, organization, 'admin');
}

async function demoteMember(username, organization, dryRun) {
  console.log(`Demoting ${username} to member in ${organization}.`);
  if (dryRun) return;
  // Do the thing!
  await inviteUser(username, organization, 'member');
}

(async () => {
  const DRY_RUN = !!process.env.DRY_RUN || false;
  const fileName = path.normalize(process.argv[2] || './membership.toml');
  const pendingActions = [];

  if (DRY_RUN) console.log('NOTE: This is a dry run. Actions will not actually be performed.');
  const config = await loadMembershipConfig(fileName), orgName = config.org.login;
  const organization = await retrieveOrgInfo(orgName);
  validateOrgSettings(organization, config.org);

  // If 2FA is enabled, kick out anybody who somehow doesn't have it
  if (organization.requiresTwoFactorAuthentication) {
    pendingActions.push(
      ...validateTwoFactor(organization.members).map((username) => removeMember(username, orgName, DRY_RUN))
    );
  }

  // Remove members who do not belong
  pendingActions.push(
    ...findUndocumentedMembers(
      Object.keys(config['github-members']),
      Object.keys(organization.members)
    ).map((username) => removeMember(username, orgName, DRY_RUN))
  );
  // Invite members who are not present
  pendingActions.push(
    ...findNewMembers(
      Object.keys(config['github-members']),
      Object.keys(organization.members)
    ).map((username) =>
      inviteUser(username, orgName, config['github-members'][username].toLowerCase(), DRY_RUN)
    )
  );
  // Remove admin status from those who should not have it
  pendingActions.push(
    ...findDemotions(
      config['github-members'],
      organization.members
    ).map((username) => demoteMember(username, orgName, DRY_RUN))
  );
  // Grant admin status to those who should have it
  pendingActions.push(
    ...findPromotions(
      config['github-members'],
      organization.members
    ).map((username) => promoteMember(username, orgName, DRY_RUN))
  );
  await Promise.all(pendingActions);
  console.log(`${pendingActions.length} actions completed successfully!`);
})();
