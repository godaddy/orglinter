/* eslint-disable no-console, max-params */
const { request } = require('@octokit/request');

async function inviteUser(username, organization, role = 'member', token, dryRun) {
  console.log(`Setting ${username} up as a(n) ${role} for ${organization}.`);
  if (dryRun) return;
  // Do the thing!
  const result = await request('PUT /orgs/{org}/memberships/{username}', {
    headers: {
      authorization: `token ${token}`
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

async function removeMember(username, organization, token, dryRun) {
  console.log(`Removing ${username} from ${organization}.`);
  if (dryRun === true) return;
  // Do the thing!
  const result = await request('DELETE /orgs/{org}/members/{username}', {
    headers: {
      authorization: `token ${token}`
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

async function promoteMember(username, organization, token, dryRun) {
  console.log(`Promoting ${username} to admin in ${organization}.`);
  if (dryRun) return;
  // Do the thing!
  await inviteUser(username, organization, 'admin', token);
}

async function demoteMember(username, organization, token, dryRun) {
  console.log(`Demoting ${username} to member in ${organization}.`);
  if (dryRun) return;
  // Do the thing!
  await inviteUser(username, organization, 'member', token);
}

module.exports = { inviteUser, removeMember, promoteMember, demoteMember };
