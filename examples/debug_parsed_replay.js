var fs = require('fs');
var RocketLeagueParser = require('../lib/rocket_league_replay.js').Parser;

testfile = './test/replays/002E80F0452C36768F041E998A1C2C18.replay';
testfile2 = './test/replays/4A5B13DA4D3C650D729A98B85D350FF7.replay';
testfileold = './test/replays/626D0A274F5C721C033F75A4CD622C4B.replay';

fs.readFile(testfile, function(err, buf) {
	if(err) {
		console.log(err.message);
		return;
	}

	// Parse replay file
	var parsedReplay = RocketLeagueParser.parse(buf);

	// Plain parsed replay only
	console.log(require('util').inspect(parsedReplay, { depth: null }));
});
