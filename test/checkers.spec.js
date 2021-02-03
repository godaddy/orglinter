/* eslint-disable no-console */
const assume = require('assume');
const checkers = require('../src/lib/checkers');
const sinon = require('sinon');

describe('Checkers', function () {

  before(function () {
    sinon.stub(console, 'log');
  });

  after(function () {
    sinon.restore();
  });

  describe('findUndocumentedMembers', function () {
    it('finds members not listed in config', function () {
      const result = checkers.findUndocumentedMembers(
        ['zaphod', 'trillian', 'marvin'],
        ['zaphod', 'trillian', 'marvin', 'ford']
      );
      assume(result).eqls(['ford']);
    });
  });

  describe('findNewMembers', function () {
    it('finds members not yet in the org', function () {
      const result = checkers.findNewMembers(
        ['zaphod', 'trillian', 'marvin', 'ford'],
        ['zaphod', 'trillian', 'marvin']
      );
      assume(result).eqls(['ford']);
    });
  });

  describe('findDemotions', function () {
    it('finds people who should not be admins', function () {
      const result = checkers.findDemotions(
        { zaphod: 'ADMIN', trillian: 'ADMIN', marvin: 'MEMBER', ford: 'MEMBER' },
        { zaphod: { role: 'ADMIN' }, trillian: { role: 'ADMIN' }, marvin: { role: 'MEMBER' }, ford: { role: 'ADMIN' } }
      );
      assume(result).eqls(['ford']);
    });
  });

  describe('findPromotions', function () {
    it('finds people who should be admins', function () {
      const result = checkers.findPromotions(
        { zaphod: 'ADMIN', trillian: 'ADMIN', marvin: 'MEMBER', ford: 'MEMBER' },
        { zaphod: { role: 'MEMBER' }, trillian: { role: 'ADMIN' }, marvin: { role: 'MEMBER' }, ford: { role: 'MEMBER' } }
      );
      assume(result).eqls(['zaphod']);
    });

    it('ignores users not in retrieved list', function () {
      const result = checkers.findPromotions(
        { zaphod: 'ADMIN', trillian: 'ADMIN', marvin: 'MEMBER', ford: 'MEMBER' },
        { zaphod: { role: 'MEMBER' }, marvin: { role: 'MEMBER' }, ford: { role: 'MEMBER' } }
      );
      assume(result).eqls(['zaphod']);
    });
  });

  describe('validateTwoFactor', function () {
    it('finds people somehow not using 2fa', function () {
      const result = checkers.validateTwoFactor(
        {
          zaphod: { twoFactorAuth: true },
          trillian: { twoFactorAuth: true },
          marvin: { twoFactorAuth: true },
          ford: { twoFactorAuth: false }
        }
      );
      assume(result).eqls(['ford']);
    });
  });

});
