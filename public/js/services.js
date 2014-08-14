var aniUp = require('ani-up')

angular.module('ani-up', []).
  factory('au-parser', function() {return aniUp.parser}).
  factory('au-hummingbird', function() {return aniUp.hummingbird}).
  factory('au-mal', function() {return aniUp.mal;});