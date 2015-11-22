var fs = require('fs');
var Parser = require('../lib/rocket_league_parser.js');
var Replay = require('../lib/rocket_league_replay.js').Replay;

testfile = './test/replays/002E80F0452C36768F041E998A1C2C18.replay';
//testfile2 = './test/4A5B13DA4D3C650D729A98B85D350FF7.replay';
//testfileold1 = './test/626D0A274F5C721C033F75A4CD622C4B.replay';

fs.readFile(testfile, function(err, buf) {
	if(err) {
		console.log(err.message);
		return;
	}

	// Parse replay file
	var parsedReplay = Parser.parse(buf);

	// Plain pared replay only
	console.log(require('util').inspect(parsedReplay, { depth: null }));
});
