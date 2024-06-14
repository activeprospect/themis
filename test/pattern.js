Themis = require('../src/themis');

describe('Issue #3: Crashing when pattern is incorrect in ref(erenced) schema', function() {

  it('should be able to dereference fragments of external schemas', function() {
    var schemas = [
      {
        "id": "types",
        "$schema": "http://json-schema.org/draft-04/schema#",
        "definitions": {
          "uuid": {
            "type": "string",
            "pattern": "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$"
          }
        }
      },
      {
        "id": "kitchensink",
        "$schema": "http://json-schema.org/draft-04/schema#",
        "type": "object",
        "properties": {
          "id": { "$ref": "types#/definitions/uuid" }
        }
      }
    ];

    var validator = Themis.validator(schemas);

    var invalid_item = {
      "id": "incorrect value"
    };
    var valid_item = {
      "id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    };
    validator(invalid_item, 'kitchensink').valid.should.be.false;
    validator(valid_item, 'kitchensink').valid.should.be.true;
  });

  it('should validate emails correctly', function() {
    var schemas = [
      {
        "id": "types",
        "$schema": "http://json-schema.org/draft-04/schema#",
        "definitions": {
          "email": {
            "type": "string",
            "format": "email"
          }
        }
      },
      {
        "id": "kitchensink",
        "$schema": "http://json-schema.org/draft-04/schema#",
        "type": "object",
        "properties": {
          "email": { "$ref": "types#/definitions/email" }
        }
      }
    ];

    var validator = Themis.validator(schemas);

    var valid_emails = [
      "simple@example.com",
      "very.common@example.com",
      "disposable.style.email.with+symbol@example.com",
      "other.email-with-dash@example.com",
      "x@example.com",
      "example-indeed@strange-example.com",
      "user@domain.aero",
      "user@domain.arpa",
      "user@domain.biz",
      "user@domain.com",
      "user@domain.coop",
      "user@domain.edu",
      "user@domain.gov",
      "user@domain.info",
      "user@domain.int",
      "user@domain.life",
      "user@domain.mil",
      "user@domain.museum",
      "user@domain.name",
      "user@domain.net",
      "user@domain.org",
      "user@domain.pro",
      "user@domain.travel",
      "user@domain.mobi",
      "user@domain.xx"
    ];

    var invalid_emails = [
      "plainaddress",
      "@missingusername.com",
      "username@.com",
      "username@.com.",
      "username@com",
      "username@.com.com",
      ".username@yahoo.com",
      "username@yahoo.com.",
      "username@yahoo..com",
      "username@-yahoo.com",
      "user@domain.toolongtld" // Invalid TLD
    ];

    valid_emails.forEach(email => {
      var valid_item = { "email": email };
      expect(validator(valid_item, 'kitchensink').valid).to.be.true;
    });

    invalid_emails.forEach(email => {
      var invalid_item = { "email": email };
      expect(validator(invalid_item, 'kitchensink').valid).to.be.false;
    });
  });

});
