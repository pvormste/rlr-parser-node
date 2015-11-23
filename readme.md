# Rocket League Replay Parser for NodeJS
A NodeJS Parser for Rocket League Replay Files.

It is a port of [jjbots](https://github.com/jjbott) awesome .Net library for [Rocket League Replays](https://github.com/jjbott/RocketLeagueReplayParser).

## Features
* Parses the meta data (crc, version info, etc.)
* Parses all properties (like team size, team members, goals, etc.)
* Automatically assigns players to the blue or orange team regarding to the match info
* Modular: If you only want to use the parser and build your own object representation - go ahead!

## Todo
* Parse key frame data
* Parse network data

## Usage

There are two ways to use the parser:

```js
var Replay = require('lib/rocket_league_replay.js').Replay;

// Replay file location C:\ ... \Documents\my games\Rocket League\TAGame\Demos
var replayfile = 'path/to/replayfile.replay';

fs.readFile(replayfile, function(err, buffer) {
	// Create a Replay object directly from buffer
	var replay = new Replay.fromBuffer(buffer);
  // Print the result
	console.log(require('util').inspect(replay, { depth: null }));
});
```

or

```js
var RocketLeagueParser = require('lib/rocket_league_replay.js').Parser;
var Replay = require('lib/rocket_league_replay.js').Replay;

// Replay file location C:\ ... \Documents\my games\Rocket League\TAGame\Demos
var replayfile = 'path/to/replayfile.replay';

fs.readFile(replayfile, function(err, buffer) {
	// Parse replay file first
	var parsedReplay = RocketLeagueParser.parse(buffer);
	// Convert it then in a more usable way
	var replay = new Replay(parsedReplay);
  // Print the result
	console.log(require('util').inspect(replay, { depth: null }));
});
```


## Issue
* On old replay files, the player list is not part of the properties section. It must be read from network stream.

## Author
* [Patric Vormstein](https://github.com/pvormste)

## License
This project is released under the [MIT-License](https://github.com/pvormste/rlr-parser-node/blob/master/LICENSE).
