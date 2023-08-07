'use strict';

/**
 * A normalized member record retrieved from the GitHub GraphQL API
 * @typedef {object} MemberRecord
 * @property {string} role - The user's role in the org; "ADMIN" or "MEMBER"
 * @property {boolean} hasTwoFactorEnabled - Whether the user has Two Factor Authentication enabled
 */

/**
 * A set of member records retrieved from the GitHub GraphQL API
 * @typedef {object.<string, MemberRecord>} MemberSet
 */

/**
 * A normalized org record retrieved from the GitHub GraphQL API
 * @typedef {object} OrgRecord
 * @property {string} email - The org's primary email address
 * @property {boolean} isVerified - Whether the org has been verified by GitHub
 * @property {string} login - The org's login name
 * @property {MemberSet} members - The org's current membership
 * @property {string} name - The org's display name
 * @property {boolean} requiresTwoFactorAuthentication - Whether the org requires 2FA for membership
 * @property {string} twitterUsername - The org's twitter username
 * @property {string} websiteURL - The org's primary external website URL
 */

/**
 * The expected configuration of a single GitHub team
 * @typedef {object} ConfigTeam
 * @property {string} name - The display name of the team
 * @property {string} default_org_role - The org role assigned to members of this team; "ADMIN" or "MEMBER"
 * @property {string} privacy - The public visibility of this team; "SECRET" or "VISIBLE"
 * @property {Array.<string>} members - The users who are expected to be members of this team
 */

/**
 * The expected configuration for the org entity itself
 * @typedef {object} ConfigOrg
 * @property {string} email - The org's expected email address
 * @property {boolean} isVerified - Whether the org is expected to be verified by GitHub
 * @property {string} login - The login name for the org; this is used for the API lookup
 * @property {string} name - The org's expected display name
 * @property {boolean} requiresTwoFactorAuthentication - Whether the org is expected to require 2FA for membership
 * @property {string} twitterUsername - The org's expected twitter username
 * @property {string} websiteUrl - The org's expected primary external website URL
 */

/**
 * Structured data representing the expected configuration of a GitHub org
 * @typedef {object} ExpectedOrgConfig
 * @property {ConfigOrg} org - The expected configuration for the org entity itself
 * @property {object.<string, string | Array.<string>>} members - A set of "internal" usernames paired up with GitHub usernames
 * @property {object.<string, string>} github-members - GitHub usernames and their expected roles
 * @property {Array.<ConfigTeam>} teams - The teams expected to exist in the org
 */

module.exports = {};
