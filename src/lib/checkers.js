/* eslint-disable no-console */

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
    (member) => configured[member] === 'ADMIN' && retrieved[member] && retrieved[member].role === 'MEMBER'
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

module.exports = {
  findUndocumentedMembers,
  findNewMembers,
  findDemotions,
  findPromotions,
  validateTwoFactor,
  validateOrgSettings
};
