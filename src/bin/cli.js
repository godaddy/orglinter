#!/usr/bin/env node
/* eslint-disable no-console, no-process-env, max-statements */

require('dotenv').config();
const path = require('path');
const checkers = require('../lib/checkers');
const fixers = require('../lib/fixers');
const loaders = require('../lib/loaders');

(async () => {
  const DRY_RUN = !!process.env.DRY_RUN || false;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const fileName = path.normalize(process.argv[2] || './membership.toml');
  const pendingActions = [];

  if (DRY_RUN) console.log('NOTE: This is a dry run. Actions will not actually be performed.');
  const config = await loaders.loadMembershipConfig(fileName), orgName = config.org.login;
  const organization = await loaders.retrieveOrgInfo(orgName, GITHUB_TOKEN);
  checkers.validateOrgSettings(organization, config.org);

  // If 2FA is enabled, kick out anybody who somehow doesn't have it
  if (organization.requiresTwoFactorAuthentication) {
    pendingActions.push(
      ...checkers.validateTwoFactor(
        organization.members
      ).map((username) => fixers.removeMember(username, orgName, GITHUB_TOKEN, DRY_RUN))
    );
  }

  // Remove members who do not belong
  pendingActions.push(
    ...checkers.findUndocumentedMembers(
      Object.keys(config['github-members']),
      Object.keys(organization.members)
    ).map((username) => fixers.removeMember(username, orgName, GITHUB_TOKEN, DRY_RUN))
  );
  // Invite members who are not present
  pendingActions.push(
    ...checkers.findNewMembers(
      Object.keys(config['github-members']),
      Object.keys(organization.members)
    ).map((username) =>
      fixers.inviteUser(username, orgName, GITHUB_TOKEN, config['github-members'][username].toLowerCase(), DRY_RUN)
    )
  );
  // Remove admin status from those who should not have it
  pendingActions.push(
    ...checkers.findDemotions(
      config['github-members'],
      organization.members
    ).map((username) => fixers.demoteMember(username, orgName, GITHUB_TOKEN, DRY_RUN))
  );
  // Grant admin status to those who should have it
  pendingActions.push(
    ...checkers.findPromotions(
      config['github-members'],
      organization.members
    ).map((username) => fixers.promoteMember(username, orgName, GITHUB_TOKEN, DRY_RUN))
  );
  await Promise.all(pendingActions);
  console.log(`${pendingActions.length} actions completed successfully!`);
})();
