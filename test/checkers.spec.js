/* eslint-disable no-console */
const assume = require('assume');
const checkers = require('../src/lib/checkers');
const sinon = require('sinon');

describe('Checkers', function () {

  before(function () {
    sinon.stub(console, 'log');
  });

  after(function () {
    console.log.restore();
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
});
