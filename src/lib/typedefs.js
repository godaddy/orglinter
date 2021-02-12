'use strict';

/**
 * A normalized member record retrieved from the GitHub GraphQL API
 *
 * @typedef {object} MemberRecord
 * @property {string} role - The user's role in the org; "ADMIN" or "MEMBER"
 * @property {boolean} hasTwoFactorEnabled - Whether the user has Two Factor Authentication enabled
 */

/**
 * A set of member records retrieved from the GitHub GraphQL API
 *
 * @typedef {object.<string, MemberRecord>} MemberSet
 */

/**
 * A normalized org record retrieved from the GitHub GraphQL API
 *
 * @typedef {object} OrgRecord
 * @global
 * @property {string} email - The org's primary email address
 * @property {boolean} isVerified - Whether the org has been verified by GitHub
 * @property {string} login - The org's login name
 * @property {MemberSet} members - The org's current membership
 * @property {string} name - The org's display name
 * @property {boolean} requiresTwoFactorAuthentication - Whether the org requires 2FA for membership
 * @property {string} twitterUsername - The org's twitter username
 * @property {string} websiteURL - The org's primary external website URL
 */

module.exports = {};
