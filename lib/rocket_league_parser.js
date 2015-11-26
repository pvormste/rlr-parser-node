var Parser = require('binary-parser').Parser;

//==============================================================================
// Helper functions
//==============================================================================

// Parser choices needs an int value as key.
// This function returns an int regarding to its property type.
var selectDataType = function() {
  if(this.type === 'IntProperty')
    return 1;
  else if(this.type === 'ArrayProperty')
    return 2;
  else if(this.type === 'StrProperty' || this.type === 'NameProperty')
    return 3;
  else if(this.type === 'ByteProperty')
    return 4;
  else if(this.type === 'QWordProperty')
    return 5;
  else if(this.type === 'BoolProperty')
    return 6;
  else if(this.type === 'FloatProperty')
    return 7;
};

// A function which returns 1 if the property name is "None", 0 if not.
// Again the parser choices needs int keys.
var isNone = function() {
  if(this.name === 'None')
    return 1;

  return 0;
};

// Helper function, which returns true, if the stream has read "None"
// (or isNone() was 1).
var readUntilNone = function(item, buf) {
  return item.name === 'None';
};

// JS can not handle 64 bit integers, so the parser reads 2 32 bit integers.
// This function converts the 32 bit integer from decimal to hex (little endian).
var decToHex = function(item) {
  var hex = parseInt(item, 10).toString(16);
  var len = 8 - hex.length;

  if (len > 0) {
    for(len; len > 0; --len)
      hex = '0' + hex;
  }

  return hex;
};

//==============================================================================
// Parsers
// (All are little endian)
//==============================================================================

//------------------------------------------------------------------------------
// Value parsers
//------------------------------------------------------------------------------

// Parses an 32 bit integer.
var IntProperty = new Parser()
  .endianess('little')
  .int32('value');

// Parses a 32 bit integer length value of the following string
// and the string itself with Null stripped.
var StrProperty = new Parser()
  .endianess('little')
  .int32('vl')
  .string('value', { encoding: 'ascii', length: 'vl', stripNull: true });

// The byte property contains 2 strings prefixed by 2 32 bit integers as lengths
// (Strange byte type ...)
var ByteProperty = new Parser()
  .endianess('little')
  .int32('vl1')
  .string('value1', { encoding: 'ascii', length: 'vl1', stripNull: true })
  .int32('vl2')
  .string('value2', { encoding: 'ascii', length: 'vl2', stripNull: true });

// Parses a 64 bit integer into 2 32 bit integers as hex values.
var QWordProperty = new Parser()
  .endianess('little')
  .int32('hex2', { formatter: decToHex })
  .int32('hex1', { formatter: decToHex });

// Parses 0 or 1 (1 byte).
var BoolProperty = new Parser()
  .endianess('little')
  .bit8('value');

// Parses a 32 bit single precision value.
var FloatProperty = new Parser()
  .endianess('little')
  .float('value');

//------------------------------------------------------------------------------
// Array Parsers
//------------------------------------------------------------------------------

// This parser is like the property parser, just for the properties of the array.
// See below for description.
var ArrayPropertyDetail = new Parser()
  .endianess('little')
  .int32('nl')
  .string('name', { encoding: 'ascii', length: 'nl', stripNull: true })
  .choice('more', {
    tag: isNone,
    choices: {
      1: new Parser(),
      0: new Parser()
        .endianess('little')
        .int32('tl')
        .string('type', { encoding: 'ascii', length: 'tl', stripNull: true })
        .int32('unkn1')
        .int32('unkn2')
        .choice('details', {
            tag: selectDataType,
            choices: {
              1: IntProperty,
              3: StrProperty,
              4: ByteProperty,
              5: QWordProperty,
              6: BoolProperty,
              7: FloatProperty
            }
        })
    }
  });

// This parser parses the array property, which has a length of elements
// (like 4 representing 4 Goals) and a array of goal properties.
var ArrayProperty = new Parser()
  .endianess('little')
  .int32('length')
  .array('array', {
    type: new Parser().array('part', { type: ArrayPropertyDetail, readUntil: readUntilNone }),
    length: 'length'
  });

//------------------------------------------------------------------------------
// Debug Log parser
//------------------------------------------------------------------------------

var TickMark = new Parser()
  .endianess('little')
  .int32('tl')
  .string('type', { encoding: 'ascii', length: 'tl', stripNull: true })
  .int32('frame');

//------------------------------------------------------------------------------
// Debug Log parser
//------------------------------------------------------------------------------

var DebugLog = new Parser()
  .endianess('little')
  .int32('frame_number')
  .int32('pl')
  .string('player', { encoding: 'ascii', length: 'pl', stripNull: true })
  .int32('tl')
  .string('text', { encoding: 'ascii', length: 'tl', stripNull: true });

//------------------------------------------------------------------------------
// Keyframe parser
//------------------------------------------------------------------------------

var Keyframe = new Parser()
  .endianess('little')
  .float('time')
  .int32('frame')
  .int32('file_position');


//------------------------------------------------------------------------------
// Property parser
//------------------------------------------------------------------------------

// This Parser parses the property section. It contains every single match
// information like goals, teamsize, score, etc.
// Every property has a name (string) prefixed by a length (int32).
// Then a type information (string) prefixed by a length (int32).
// And the value of the property (Selecting the right value parser).
// Btw: After the property type there are 2 unknown 32 bit integers.
var Property = new Parser()
  .endianess('little')
  .int32('nl')
  .string('name', { encoding: 'ascii', length: 'nl', stripNull: true })
  .choice('more', {
    tag: isNone,
    choices: {
      1: new Parser(),
      0: new Parser()
        .endianess('little')
        .int32('tl')
        .string('type', { encoding: 'ascii', length: 'tl', stripNull: true })
        .int32('unkn1')
        .int32('unkn2')
        .choice('details', {
            tag: selectDataType,
            choices: {
              1: IntProperty,
              2: ArrayProperty,
              3: StrProperty,
              4: ByteProperty,
              5: QWordProperty,
              6: BoolProperty,
              7: FloatProperty
            }
        })
    }
  });


//------------------------------------------------------------------------------
// Main parser and export
//------------------------------------------------------------------------------

// This is the main parser which first parses the meta information of the replay.
// Followed by the property section.
// A small explanation: Strings are length prefixed, so the tags for the prefixes
// are 2 chars like "tl" which means "type length".
// Those values are only necessary to know how long the string will be.
module.exports = new Parser()
  .endianess('little')
  .int32('identifier')
  .int32('crc')
  .int32('version_major')
  .int32('version_minor')
  .int32('tl')
  .string('type', { encoding: 'ascii', length: 'tl', stripNull: true })
  .array('properties', {
    type: Property,
    readUntil: readUntilNone
  })
  .int32('length_of_remaining_data')
  .uint32('unkn1')
  .int32('ldl')
  .array('level_data', {
    type: StrProperty,
    length: 'ldl'
  })
  .int32('kl')
  .array('keyframes', {
    type: Keyframe,
    length: 'kl'
  })
  .int32('ndl')
  /*.array('network_data', {
    type: BoolProperty,
    length: 'ndl'
  })*/
  .skip('ndl') // Skip network data as the information is not usable for now
  .int32('dll')
  .array('debugging_log', {
    type: DebugLog,
    length: 'dll'
  })
  .int32('tml')
  .array('tickmarks', {
    type: TickMark,
    length: 'tml'
  })
  .int32('pl')
  .array('packages', {
    type: StrProperty,
    length: 'pl'
  })
  .int32('ol')
  .array('objects', {
    type: StrProperty,
    length: 'ol'
  })
  .int32('nl')
  .array('names', {
    type: StrProperty,
    length: 'nl'
  });
