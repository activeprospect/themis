
# ActiveProspect

This fork is maintained by ActiveProspect so that we can continue using Themis as a JSON Schema draft-04 validation module, but with a more secure version of the uglify-js dependency.

# Themis

Themis is a blazing fast, compiled JSON Schema v4 validator. Themis was created for use in environments where there is a large amount of data that has to be validated against the same schema multiple times. Eg: *REST API Servers*.

Themis (Greek: Θέμις) is an ancient Greek Titaness, the goddess of divine order, law, natural law and custom, and a prophetic goddess &mdash; the divine voice who first instructed mankind in the primal laws of justice and morality.

Themis was inspired by the z-schema and json-model validators and tries to provide the best of both worlds. Many thanks to [Martin Zagora](https://github.com/zaggino) for his work on z-schema 3 from which most of the validation logic was adapted.

## Installation

```
npm install themis
```

## Example

### Validating a single schema

```javascript
var Themis = require('themis');

var schema = {
    "id": "basicSchema",
    "type": "array",
    "items": {
        "title": "Product",
        "type": "object",
        "properties": {
            "id": {
                "description": "The unique identifier for a product",
                "type": "number"
            },
            "name": {
                "type": "string"
            },
            "price": {
                "type": "number",
                "minimum": 0,
                "exclusiveMinimum": true
            },
            "tags": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "minItems": 1,
                "uniqueItems": true
            },
            "dimensions": {
                "type": "object",
                "properties": {
                    "length": {"type": "number"},
                    "width": {"type": "number"},
                    "height": {"type": "number"}
                },
                "required": ["length", "width", "height"]
            },
            "warehouseLocation": {
                "description": "Coordinates of the warehouse with the product"
            }
        },
        "required": ["id", "name", "price"]
    }
}


var data = [
    {
        "id": 2,
        "name": "An ice sculpture",
        "price": 12.50,
        "tags": ["cold", "ice"],
        "dimensions": {
            "length": 7.0,
            "width": 12.0,
            "height": 9.5
        },
        "warehouseLocation": {
            "latitude": -78.75,
            "longitude": 20.4
        }
    },
    {
        "id": 3,
        "name": "a blue mouse",
        "price": 25.50,
            "dimensions": {
            "length": 3.1,
            "width": 1.0,
            "height": 1.0
        },
        "warehouselocation": {
            "latitude": 54.4,
            "longitude": -32.7
        }
    }
];

// Generate the validator
var validator = Themis.validator(schema);

// now validate our data against the schema
var report = validator(data, 'basicSchema');

console.log(require('util').inspect(report, { depth: 10, colors: true }));
// { valid: true, errors: [], subReport: [] }
```

### Validating against schemas with no `id` attribute

Themis assumes your schema will have an `id` giving the schema a name. But if
your schema has no `id` attribute, pass Themis a default `id` of `'0'`.

In the above example, you would change this:

```javascript
// now validate our data against the schema
var report = validator(data, 'basicSchema');
```

to this:

```javascript
// now validate our data against the schema
var report = validator(data, '0');
```

### Validating against multiple schemas
At present themis does not support fetching remote json-schemas. You can however pre-fetch them and pass them in.

```javascript
var Themis = require('themis');

var schemas = [
    {
        id: "personDetails",
        type: "object",
        properties: {
            firstName: { type: "string" },
            lastName: { type: "string" }
        },
        required: ["firstName", "lastName"]
    },
    {
        id: "addressDetails",
        type: "object",
        properties: {
            street: { type: "string" },
            city: { type: "string" }
        },
        required: ["street", "city"]
    },
    {
        id: "personWithAddress",
        allOf: [
            { $ref: "personDetails" },
            { $ref: "addressDetails" }
        ]
    }
];

var data = {
    firstName: "Johny",
    lastName: "Jose",
    street: "24th Main, HSR Layout",
    city: "Bangalore"
};

// Generate the validator
var validator = Themis.validator(schemas);

// now validate our data against the last schema
var report = validator(data, 'personWithAddress');

console.log(require('util').inspect(report, { depth: 10, colors: true }));
// { valid: true, errors: [] }
```

### Validating with custom formats

You can register custom format validators with Themis.

```javascript
var Themis = require('../src/themis');

Themis.registerFormat('username', function (str) {
  return /^[a-zA-Z0-9_\.-]+$/.test(str);
});

Themis.registerFormat('password', function (str) {
  return /^(?=.{6,}).*$/.test(str);
});

Themis.registerFormat('identifier', function (str) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str);
});

var schema = {
  "id": "player",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "identifier"
    },
    "username": {
      "type": "string",
      "format": "username"
    },
    "password" :{
      "type": "string",
      "format": "password"
    }
  }
};

var valid_player = {
  "id": "frodo",
  "username": "Frodo",
  "password": "TheOneRing"
};

var invalid_player = {
  "id": "123",
  "username": "!@#",
  "password": "foo"
};

// Generate the validator
var validator = Themis.validator(schema);

var report = validator(valid_player, 'player');
console.log(require('util').inspect(report, { depth: 10, colors: true }));
// { valid: true, errors: [] }

var report = validator(invalid_player, 'player');
console.log(require('util').inspect(report, { depth: 10, colors: true }));
/*
{ valid: false,
  errors: [],
  subReport:
   [ { valid: false,
       errors:
        [ { code: 'INVALID_FORMAT',
            schema: 'player/properties/id',
            params: { actual: '123', expected: 'identifier' } } ] },
     { valid: false,
       errors:
        [ { code: 'INVALID_FORMAT',
            schema: 'player/properties/username',
            params: { actual: '!@#', expected: 'username' } } ] },
     { valid: false,
       errors:
        [ { code: 'INVALID_FORMAT',
            schema: 'player/properties/password',
            params: { actual: 'foo', expected: 'password' } } ] } ] }
*/
```

### Using custom validation keywords

Themis allows you to create custom validation keywords. This can be useful in a number of scenarios where the keywords provided by the json-schema specification are just not enough.

```javascript
var Themis = require('themis');

Themis.registerValidator('matches', { order: ['after', 'format'],  type: 'string' }, function(schema, path) {
  var code = [
    "if (!(data === parent['"+ schema.matches +"'])) {",
      "report.valid = false;",
      "report.errors = {",
        "code: 'MATCH_FAILED',",
        "schema: '"+ path +"',",
        "params: { actual: data, expected: parent['"+ schema.matches +"'] }",
      "};",
    "}"
  ];
  return code;
})

var schema = {
  "id": "registration",
  "type": "object",
  "properties": {
    "email": {
      "type": "string"
    },
    "password": {
      "type": "string"
    },
    "password_again": {
      "type": "string",
      "matches": "password"
    }
  }
};

var valid_registration = {
  email: 'johny@playlyfe.com',
  password: 'foo',
  password_again: 'foo'
};

var invalid_registration = {
  email: 'johny@playlyfe.com',
  password: 'foo',
  password_again: 'bar'
};

var validator = Themis.validator(schema);

// now validate our data against the schema
var report = validator(valid_registration, 'registration');

console.log(require('util').inspect(report, { depth: 10, colors: true }));
// { valid: true, errors: [], subReport: [] }

report = validator(invalid_registration, 'registration');

console.log(require('util').inspect(report, { depth: 10, colors: true }));
/*
{ valid: false,
  errors: [],
  subReport:
   [ { valid: false,
       errors:
        { code: 'NOT_SAME',
          schema: 'registration/properties/password_again',
          params: { actual: 'bar', expected: 'foo' } } } ] }
*/
```

At present custom validator must by sync. To create a custom validator you must specify three pieces of information.

  - When will the validation be applied ?

    You can specify when the validation must be applied by providing an array containing two parameters to the `order` key:

      1. The relative position (`before` or `after`)
      2. An existing validation keyword

    Themis performs all its validations in a specific order for optimization reasons. Hence you must ensure that you correctly specify the order in which your validation must be performed relative to others.

    The current ordering of validation is as follows

    1. default
    2. $schema
    3. $ref
    4. title
    5. description
    6. definitions
    7. type
    8. multipleOf
    9. minimum
    10. exclusiveMinimum
    11. maximum
    12. exclusiveMaximum
    13. minLength
    14. maxLength
    15. pattern
    16. format
    17. additionalItems
    18. items
    19. minItems
    20. maxItems
    21. uniqueItems
    22. required
    23. additionalProperties
    24. patternProperties
    25. properties
    26. minProperties
    27. maxProperties
    28. dependencies
    29. allOf
    30. anyOf
    31. oneOf
    32. not
    33. enum

  - What type of data type can the validation be applied to ?

    The validators in Themis are grouped together by the type of data they are applied to. You must specify the type in the `type` key:

    The allowed values are:
    - string
    - number
    - array
    - object
    - any

  - The generated code which will actually perform the validation

    Themis generates a validation function for each schema. Hence your validation function must return an array of code statements which will be compiled into the final validation function.

    The validation function generator will receive the following arguments:

      1. schema - The schema document
      2. path - The path to the schema
      3. schema_id - The id of the schema
      4. options - The options object passed in when creating the validator

    The compiled validation function will have access to the following variable which it can use to perform the validation:

      1. data - The actual json data that is being validated
      2. parent - The parent object/array of the data. This could be null if no parent exists.
      3. report - The report object on which any `errors` can be attached and whose `valid` key must be set to reflect the result of the validation.

### Applying default values

The `default` keyword is an extremely useful but often unimplemented feature in most json validators. Even the ones that implement it make a half hearted attempt at doing it properly. Themis hopes to change this trend. Themis tries its best to implement complete support for the default keyword including handling its usage in complex scenarios with `anyOf`, `allOf`, `oneOf`, `items`, `additionalItems` and `not`. You can even assign default values to array items.

This allows a lot of potentially complex behaviours using your validator. You can check the tests for all the different cases that are supported.

To use this functionality in your validator you must set the `enable_defaults` value to `true` in the options object when creating the validator.

#### Simple Defaults
```javascript
var Themis = require('../src/themis');
var util = require('util');

var schema = {
  "id": "simple_defaults",
  "type": "object",
  "required": ["required"],
  "properties": {
    "string": {
      "type": "string",
      "default": "normal"
    },
    "object": {
      "type": "object",
      "default": { x: 100, y: 200 }
    },
    "array": {
      "type": "array",
      "default": [100, 200, { x: 1 }, 'foo', null, true]
    },
    "number": {
      "type": "number",
      "default": 100
    },
    "required": {
      "type": "boolean",
      "default": false
    }
  }
};

var empty_data = {};

var filled_data = {
  string: 'foo',
  object: {},
  array: [],
  number: 0,
  required: true
};
var partial_data = {
  string: 'foo',
  object: {},
  array: [],
};

// Generate the validator
var validator = Themis.validator(schema, { enable_defaults: true });

// now validate our data against the schema
var report = validator(empty_data, 'simple_defaults');

console.log(util.inspect(report, { depth: 10, colors: true }));
// { valid: true, errors: [], passed: 7 }

console.log(util.inspect(empty_data, { depth: 10, colors: true }));
/*
{ required: false,
  number: 100,
  array:
   [ 100,
     200,
     { x: 1 },
     'foo',
     null,
     true ],
  object: { x: 100, y: 200 },
  string: 'normal' }
*/

report = validator(filled_data, 'simple_defaults');

console.log(util.inspect(report, { depth: 10, colors: true }));
// { valid: true, errors: [] }

console.log(util.inspect(filled_data, { depth: 10, colors: true }));
/*
{ string: 'foo',
  object: {},
  array: [],
  number: 0,
  required: true }
*/

report = validator(partial_data, 'simple_defaults');

console.log(util.inspect(report, { depth: 10, colors: true }));
// { valid: true, errors: [] }

console.log(util.inspect(partial_data, { depth: 10, colors: true }));
/*
{ string: 'foo',
  object: {},
  array: [],
  required: false,
  number: 100 }
*/
```

#### Complex Defaults

```javascript
var Themis = require('../src/themis');
var util = require('util');

var schema = {
  "id": "complex_defaults",
  "type": "object",
  "properties": {
    "allOf": {
      "default": {},
      "allOf": [
        {
          "type": "object",
          "properties": {
            "x": {
              "type": "string",
              "default": "a"
            }
          }
        },
        {
          "type": "object",
          "properties": {
            "y": {
              "type": "string",
              "default": "b"
            }
          }
        },
        {
          "type": "object",
          "properties": {
            "z" :{
              "type": "string",
              "default": "c"
            }
          }
        }
      ]
    },
    "oneOf": {
      "default": { x: true, y: false },
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "x": {
              "type": "string",
              "default": "a"
            }
          }
        },
        {
          "type": "object",
          "properties": {
            "y": {
              "type": "string",
              "default": "b"
            }
          }
        },
        {
          "type": "object",
          "properties": {
            "z" :{
              "type": "string",
              "default": "c"
            }
          }
        }
      ]
    },
    "anyOf": {
      "default": {},
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "x": {
              "type": "string",
              "default": "a"
            }
          }
        },
        {
          "type": "object",
          "properties": {
            "y": {
              "type": "string",
              "default": "b"
            }
          }
        },
        {
          "type": "object",
          "properties": {
            "z" :{
              "type": "string",
              "default": "c"
            }
          }
        }
      ]
    }
  },
  "not": {
    "type": "object",
    "required": ["not"],
    "properties": {
      "not": {
        "type": "object",
        "properties": {
          "x": {
            "type": "string",
            "default": "bar",
            "enum": ["foo"]
          }
        }
      }
    }
  }
}

// Generate the validator
var validator = Themis.validator(schema, { enable_defaults: true });

// now validate our data against the schema
var empty_data = {};
var report = validator(empty_data, 'complex_defaults');

console.log(util.inspect(report, { depth: 10, colors: true }));
/*
{ valid: true,
  errors: [] }
*/

console.log(util.inspect(empty_data, { depth: 10, colors: true }));
/*
{ anyOf: { x: 'a' },
  oneOf: { x: true, y: false, z: 'c' },
  allOf: { x: 'a', y: 'b', z: 'c' } }
*/

var partial_invalid_data = {
  oneOf: {}
};

report = validator(partial_invalid_data, 'complex_defaults');

console.log(util.inspect(report, { depth: 10, colors: true }));
/*
{ valid: false,
  errors: [],
  subReport:
   [ { valid: false,
       errors:
        [ { code: 'ONE_OF_MULTIPLE',
            schema: 'complex_defaults/properties/oneOf',
            subReports:
             [ { valid: true, errors: [] },
               { valid: true, errors: [] },
               { valid: true, errors: [] } ] } ] } ] }
*/

console.log(util.inspect(partial_invalid_data, { depth: 10, colors: true }));
//{ oneOf: {} }

var partial_valid_data = {
  oneOf: { y: true, z: false },
  allOf: { x: 'yes' },
  anyOf: { y: 'b' }
};

report = validator(partial_valid_data, 'complex_defaults');

console.log(util.inspect(report, { depth: 10, colors: true }));
/*
{ valid: true,
  errors: [] }
*/

console.log(util.inspect(partial_valid_data, { depth: 10, colors: true }));
/*
{ oneOf: { y: true, z: false, x: 'a' },
  allOf: { x: 'yes', y: 'b', z: 'c' },
  anyOf: { y: 'b', x: 'a' } }
*/

var invalid_data = {
  not: { x: 'foo'}
}
report = validator(invalid_data, 'complex_defaults');

console.log(util.inspect(report, { depth: 10, colors: true }));
/*
{ valid: true,
  errors: [] }
*/

console.log(util.inspect(invalid_data, { depth: 10, colors: true }));
/*
{ valid: true, errors: [] }
{ not: { x: 'foo' },
  anyOf: { x: 'a' },
  oneOf: { x: true, y: false, z: 'c' },
  allOf: { x: 'a', y: 'b', z: 'c' } }
*/
```

#### How it works

Themis applies the default values using a rollback mechanism. This allows us to rollback any changes we have performed on the original data in case we later find out that the data does not pass validation by the schema. This allows us to handle the messy `anyOf`, `allOf`, `oneOf` scenarios. At present the way themis applies defaults for each keyword is as follows:

- allOf - All the default values for all schemas are applied. If the data is invalid nothing is applied.
- oneOf - Exactly one set of default values are applied. If the data is invalid nothing is applied.
- anyOf - The default values of the first schema which successfully validates the data is applied. If the data is invalid then nothing is applied. The order of validation of schemas is the same as the order in which it is specified in the schema document.
- not - None of the default values are ever applied.
- items - Default values are applied to an item if it equals `undefined`. If the data is invalid nothing is applied.
- additionalItems - All additional items whose value equals `undefined` get assigned the default value. If the data is invalid then nothing is applied.


## Methods
The Themis object contains methods to create validators and register formats.

### validator(schemas, options)
Generate a new compiled validator from the provided schemas. The returned validator function can be reused any number of times. Check the examples above to see its usage.

The available options are:

  - enable_defaults (default: false) - Allow the validator to apply default values. Enabling this imposes a significant performance overhead as can the seen in the benchmark results.

### registerFormat(format, validation_func)
Register a new format and its associated validation function.

### registerValidator(keyword, meta({order, type}), generator_func)
Register a new validation generator. Check out the example given above to see usage.

## Performance

Themis achieves its high performance by generating custom optimized validation functions for every json schema document provided to it. For most types of data Themis is atleast 5-10 times faster than Z-Schema 3 and atleast twice as fast as json-model.

```
Basic Object Validation
-----------------------
is-my-json-valid#basicObject x 5,742,425 ops/sec ±0.53% (98 runs sampled)
themis[minimal]#basicObject x 479,754 ops/sec ±0.42% (99 runs sampled)
themis[default]#basicObject x 343,837 ops/sec ±0.47% (102 runs sampled)
ajv#basicObject x 7,112,748 ops/sec ±0.59% (101 runs sampled)
jsen#basicObject x 1,941,323 ops/sec ±1.00% (99 runs sampled)
json-model#basicObject x 63,082 ops/sec ±0.67% (97 runs sampled)
z-schema 3#basicObject x 52,547 ops/sec ±0.44% (97 runs sampled)
tv4#basicObject x 54,321 ops/sec ±0.64% (98 runs sampled)
jjv#basicObject x 11,411 ops/sec ±0.94% (98 runs sampled)
jsonschema#basicObject x 4,011 ops/sec ±1.49% (98 runs sampled)
jayschema#basicObject x 1,006 ops/sec ±0.48% (95 runs sampled)
Fastest is ajv#basicObject

Advanced Object Validation
--------------------------
is-my-json-valid#advancedObject x 373,102 ops/sec ±0.62% (97 runs sampled)
themis[minimal]#advancedObject x 55,200 ops/sec ±0.36% (96 runs sampled)
themis[default]#advancedObject x 15,186 ops/sec ±0.36% (102 runs sampled)
ajv#advancedObject x 433,042 ops/sec ±1.67% (94 runs sampled)
jsen#advancedObject x 128,032 ops/sec ±5.34% (91 runs sampled)
json-model#advancedObject x 11,762 ops/sec ±1.36% (97 runs sampled)
z-schema 3#advancedObject x 8,533 ops/sec ±0.43% (97 runs sampled)
tv4#advancedObject x 447 ops/sec ±0.60% (93 runs sampled)
jjv#advancedObject x 3,089 ops/sec ±0.75% (98 runs sampled)
jsonschema#advancedObject x 785 ops/sec ±0.72% (99 runs sampled)
jayschema#advancedObject x 143 ops/sec ±0.47% (84 runs sampled)
Fastest is ajv#advancedObject
```

For a more detailed analysis of performance check out the benchmarks against the other popular json schema validators available today.

[Benchmark Results](https://cdn.rawgit.com/playlyfe/themis/master/benchmark/results.html)

To run benchmark:

```
git submodule update --init
cd benchmark
npm install
node benchmark
```

##TODO

- Support remote reference fetching.
- Validate json schemas before attempting validation.
- Add more benchmarks for different types of datasets.
- Better validation errors.
- Add support for browsers

Author
======
Johny Jose <[johny@playlyfe.com](mailto)>
