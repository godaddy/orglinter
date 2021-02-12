/* eslint-disable no-console */
'use strict';

const typedefs = require('./typedefs');

/**
 * Find users who currently belong to the organization, but not who are not
 * expected by config.
 *
 * @param {string[]} configured - An array of usernames expected to exist in the org
 * @param {string[]} retrieved - An array of usernames actually belong to the org currently
 * @returns {string[]} An array of usernames which are not expected to belong to the org
 */
function findUndocumentedMembers(configured, retrieved) {
  const undocumented = retrieved.filter(member => !configured.includes(member));
  console.log(`${undocumented.length} undocumented memberships found: `, undocumented);
  return undocumented;
}

/**
 * Find users who are expected by config, but who do not (yet) belong to the
 * organization.
 *
 * @param {string[]} configured - An array of usernames expected to exist in the org
 * @param {string[]} retrieved - An array of usernames actually belong to the org currently
 * @returns {string[]} An array of usernames which are expected to belong to the org
 */
function findNewMembers(configured, retrieved) {
  const newMembers = configured.filter(member => !retrieved.includes(member));
  console.log(`${newMembers.length} new memberships requested: `, newMembers);
  return newMembers;
}

/**
 * Find users who are currently admins of the org, but should not be, according
 * to config.
 *
 * @param {object.<string, string>} configured - Configured usernames and their associated roles
 * @param {typedefs.MemberSet} retrieved - User list retrieved from GitHub
 * @returns {string[]} An array of usernames who are admins, but should not be
 */
function findDemotions(configured, retrieved) {
  const demotions = Object.keys(retrieved).filter(
    (member) => retrieved[member].role === 'ADMIN' && configured[member] === 'MEMBER'
  );
  console.log(`${demotions.length} demotions found: `, demotions);
  return demotions;
}

/**
 * Find users who are currently regular members of the org, but are configured as admins
 *
 * @param {object.<string, string>} configured - Configured usernames and their associated roles
 * @param {typedefs.MemberSet} retrieved - User list retrieved from GitHub
 * @returns {string[]} An array of usernames who are not admins, but should be
 */
function findPromotions(configured, retrieved) {
  const promotions = Object.keys(configured).filter(
    (member) => configured[member] === 'ADMIN' && retrieved[member] && retrieved[member].role === 'MEMBER'
  );
  console.log(`${promotions.length} promotions found: `, promotions);
  return promotions;
}

/**
 * Find org members who do not have two-factor authentication enabled
 *
 * @param {typedefs.MemberSet} members - User list retrieved from GitHub
 * @returns {string[]} An array of usernames who are 2FA violators.
 */
function validateTwoFactor(members) {
  const violators = Object.keys(members).filter((member) => members[member].twoFactorAuth === false);
  console.log(`${violators.length} two factor auth violators found: `, violators);
  return violators;
}

/**
 * Ensure that the org's current settings match those expected by the config
 *
 * @param {object.<string, *>} organization - The full collection of org settings collected from GitHub
 * @param {object.<string, *>} config - The full collection of org settings expected by config
 */
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

module.exports = {
  findUndocumentedMembers,
  findNewMembers,
  findDemotions,
  findPromotions,
  validateTwoFactor,
  validateOrgSettings
};
