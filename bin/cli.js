#!/usr/bin/env node
/* eslint-disable no-console, no-process-env, max-statements */
'use strict';

require('dotenv').config();
const path = require('path');
const checkers = require('../src/lib/checkers');
const fixers = require('../src/lib/fixers');
const loaders = require('../src/lib/loaders');

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
      ).map((username) => fixers.removeMember({ username, organization: orgName, token: GITHUB_TOKEN, dryRun: DRY_RUN }))
    );
  }

  // Remove members who do not belong
  pendingActions.push(
    ...checkers.findUndocumentedMembers(
      Object.keys(config['github-members']),
      Object.keys(organization.members)
    ).map((username) => fixers.removeMember({ username, organization: orgName, token: GITHUB_TOKEN, dryRun: DRY_RUN }))
  );
  // Invite members who are not present
  pendingActions.push(
    ...checkers.findNewMembers(
      Object.keys(config['github-members']),
      Object.keys(organization.members)
    ).map((username) =>
      fixers.inviteUser({
        username,
        organization: orgName,
        token: GITHUB_TOKEN,
        role: config['github-members'][username].toLowerCase(),
        dryRun: DRY_RUN
      })
    )
  );
  // Remove admin status from those who should not have it
  pendingActions.push(
    ...checkers.findDemotions(
      config['github-members'],
      organization.members
    ).map((username) => fixers.demoteMember({ username, organization: orgName, token: GITHUB_TOKEN, dryRun: DRY_RUN }))
  );
  // Grant admin status to those who should have it
  pendingActions.push(
    ...checkers.findPromotions(
      config['github-members'],
      organization.members
    ).map((username) => fixers.promoteMember({ username, organization: orgName, token: GITHUB_TOKEN, dryRun: DRY_RUN }))
  );
  await Promise.all(pendingActions);
  console.log(`${pendingActions.length} actions completed successfully!`);
})();
