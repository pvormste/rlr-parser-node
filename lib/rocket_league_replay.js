var RocketLeagueParser = require('./rocket_league_parser.js');
var BigNumber = require('bignumber.js');

//==============================================================================
// class Goal
//==============================================================================
var Goal = function(time, team, scorer) {
  this.time = time;
  this.team = team;
  this.scorer = scorer;
}

//==============================================================================
// class Player
//==============================================================================
var Player = function(name, platform, onlineID, score, goals, assists, saves, shots, bBot) {
  this.name = name;
  this.platform = platform;
  this.onlineID = onlineID;
  this.score = score;
  this.goals = goals;
  this.assists = assists;
  this.saves = saves;
  this.shots = shots;
  this.isBot = bBot;
}

//==============================================================================
// class Replay
//==============================================================================

// Constructor
var Replay = function(parsedReplay) {
  this.identifier = parsedReplay.identifier;
  this.crc = parsedReplay.crc;
  this.type = parsedReplay.type;
  this.versionMajor = parsedReplay.version_major;
  this.versionMinor = parsedReplay.version_minor;

  this.teamSize = 0;
  this.primaryPlayerTeam = 'blue';
  this.teamBlueScore = 0;
  this.teamOrangeScore = 0;

  this.goals = [];
  this.teamBluePlayers = [];
  this.teamOrangePlayers = [];

  this.recordFPS = 0;
  this.keyFrameDelay = 0;
  this.maxChannels = 0;
  this.maxReplaySizeMB = 0;
  this.ID = '';
  this.mapName = '';
  this.date = '';
  this.matchLength = 0;
  this.matchType = '';
  this.playerName = '';

  this.getProperties(parsedReplay);
};

//------------------------------------------------------------------------------
// public methods
//------------------------------------------------------------------------------

// Create a replay from buffer
Replay.fromBuffer = function(buffer) {
  var parsedReplay = RocketLeagueParser.parse(buffer);

  return new Replay(parsedReplay);
};

//------------------------------------------------------------------------------
// private methods
//------------------------------------------------------------------------------

// Extract properties from parsed replay
Replay.prototype.getProperties = function(parsedReplay) {

  // For each property ...
  parsedReplay.properties.forEach( (element, index, array) => {
    switch (element.name) {
      // ... with property name: TeamSize
      case 'TeamSize':
        this.teamSize = element.more.details.value;
        break;

      // ... with property name: PrimaryPlayerTeam
      // Blue if 0, Orange if 1
      case 'PrimaryPlayerTeam':
        if(element.more.details.value === 1)
          this.primaryPlayerTeam = 'orange';
        break;

      // ... with property name: Team0Score (Blue Team)
      case 'Team0Score':
        this.teamBlueScore = element.more.details.value;
        break;

      // ... with property name: Team1Score (Orange Team)
      case 'Team1Score':
        this.teamOrangeScore = element.more.details.value;
        break;

      // ... with property name: Goals
      // This is an array containing time, team and scorer for each goal
      case 'Goals':
        element.more.details.array.forEach( (element, index, array) => {
          // Time
          var time = element.part[0].more.details.value;

          // Team
          var team = '';
          if(element.part[2].more.details.value == 0)
            team = 'blue';
          else {
            team = 'orange';
          }

          // Scorer
          var scorer = element.part[1].more.details.value;

          // Create goal object and add to goal array
          this.goals.push(new Goal(time, team, scorer));
        });
        break;

      // ... with property name: PlayerStats
      // This is a array containing every Players in this match with
      // platform and steam id. This property is missing in older
      // replay files and has to be read in the network stream.
      case 'PlayerStats':
        element.more.details.array.forEach( (element, index, array) => {
          // Player name
          var name = element.part[0].more.details.value;

          // Platform: PS4 or Steam
          var platform = element.part[1].more.details.value2;

          // Online ID
          var hex1 = element.part[2].more.details.hex1;
          var hex2 = element.part[2].more.details.hex2;
          var onlineID = new BigNumber(hex1 + hex2, 16).toString();

          // Playing for team 0 (blue) or 1 (orange)
          var team = element.part[3].more.details.value;

          // Total score
          var score = element.part[4].more.details.value;

          // Goals
          var goals = element.part[5].more.details.value;

          // Assists
          var assists = element.part[6].more.details.value;

          // Saves
          var saves = element.part[7].more.details.value;

          // Shots
          var shots = element.part[8].more.details.value;

          // Was this player a bot?
          var isBot = false;

          if(element.part[9].more.details.value)
            isBot = true;

          // Add the player to a team array regarding to its team value
          if(team === 0)
            this.teamBluePlayers.push(new Player(name, platform, onlineID, score, goals, assists, saves, shots, isBot));
          else
            this.teamOrangePlayers.push(new Player(name, platform, onlineID, score, goals, assists, saves, shots, isBot));

        });
        break;

      // ... with property name: RecordFPS
      case 'RecordFPS':
        this.recordFPS = element.more.details.value;
        break;

      // ... with property name: KeyFrameDelay
      case 'KeyFrameDelay':
        this.keyFrameDelay = element.more.details.value;
        break;

      // ... with property name: MaxChannels
      case 'MaxChannels':
        this.maxChannels = element.more.details.value;
        break;

      // ... with property name: MaxReplaySize
      case 'MaxReplaySizeMB':
        this.maxReplaySizeMB = element.more.details.value;
        break;

      // ... with property name: Id
      // This is the match id
      case 'Id':
        this.ID = element.more.details.value;
        break;

      // ... with property name: MapName
      case 'MapName':
        this.mapName = element.more.details.value;
        break;

      // ... with property name: Date
      case 'Date':
        this.date = element.more.details.value;
        break;

      // ... with property name: NumFrames
      // This is the length of the match
      case 'NumFrames':
        this.matchLength = element.more.details.value;
        break;

      // ... with property name: MatchType
      case 'MatchType':
        this.matchType = element.more.details.value;
        break;

      // ... with property name: PlayerName
      // Whose replay is it?
      case 'PlayerName':
        this.playerName = element.more.details.value;
        break;
    }
  });
};

//==============================================================================
// Exports
//==============================================================================
exports.Replay = Replay;
exports.Parser = RocketLeagueParser;
