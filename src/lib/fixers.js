/* eslint-disable no-console */
'use strict';

const { request } = require('@octokit/request');

/**
 * Invite a user to join an org
 *
 * @param {object} invitation - The details of the user invitation to be sent
 * @param {string} invitation.username - The username to be invited
 * @param {string} invitation.organization - The login name of the org where the user will be invited
 * @param {string} invitation.token - A personal access token for interacting with the GitHub API
 * @param {string} [invitation.role=member] - The role to invite the user as; "admin" or "member"
 * @param {boolean} [invitation.dryRun=false] - If true, don't actually execute this operation
 */
async function inviteUser({ username, organization, token, role = 'member', dryRun = false }) {
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

/**
 * Remove a user from an org
 *
 * @param {object} removal - The details of the user removal to be initiated
 * @param {string} removal.username - The username to be removed from the org
 * @param {string} removal.organization - The login name of the org to remove the user from
 * @param {string} removal.token - A personal access token for interacting with the GitHub API
 * @param {boolean} removal.dryRun - If true, don't actally execute this operation
 */
async function removeMember({ username, organization, token, dryRun = false }) {
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

/**
 * Promote a user from member to admin of an org
 *
 * @param {object} promotion - The details of the user promotion to be sent
 * @param {string} promotion.username - The username to be promoted
 * @param {string} promotion.organization - The login name of the org to promote the user in
 * @param {string} promotion.token - A personal access token for interacting with the GitHub API
 * @param {boolean} promotion.dryRun - If true, don't actally execute this operation
 */
async function promoteMember({ username, organization, token, dryRun = false }) {
  console.log(`Promoting ${username} to admin in ${organization}.`);
  if (dryRun) return;
  // Do the thing!
  await inviteUser({ username, organization, token, role: 'admin' });
}

/**
 * Demote a user from admin to member of an org
 *
 * @param {object} demotion - The details of the user demotion to be sent
 * @param {string} demotion.username - The username to be demoted
 * @param {string} demotion.organization - The login name of the org to demote the user in
 * @param {string} demotion.token - A personal access token for interacting with the GitHub API
 * @param {boolean} demotion.dryRun - If true, don't actally execute this operation
 */
async function demoteMember({ username, organization, token, dryRun = false }) {
  console.log(`Demoting ${username} to member in ${organization}.`);
  if (dryRun) return;
  // Do the thing!
  await inviteUser({ username, organization, token, role: 'member' });
}

module.exports = { inviteUser, removeMember, promoteMember, demoteMember };
