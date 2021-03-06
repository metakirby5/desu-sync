angular.module('animeLists', ['ngResource']).
  factory('config', function() {
    return {
      MASHAPE_KEY: '' // YOUR KEY HERE
    };
  }).

  factory('parser', function() {
    // Plagiarized from teh w0nd3rful Richard Lin

    function cleanFilename(name) {
      name = name.trim();

      // get rid of things in [] and (), as well as file extensions
      var result = name.replace(/(((\[|\()(.*?)(\]|\)))|(\.(\w+))$)/g, '');

      // replace underscores, dots with single space
      result = result.replace(/(_|\.)/g, ' ');

      // some files like to have v_ after the ep number, e.g. 12v2
      // hopefully doesn't break anything..?
      result = result.replace(/v\d/g, '');

      // if they snuck a 'Ep 5' or 'Episode 5' somewhere
      var nameWithEp = result.match(/(.*)(ep|episode)\s*\d+/gi);
      if(nameWithEp) {
        result = nameWithEp[0];
      }

      // replace 720p/1080p/etc, bluray, HD/FHD, x264...
      result = result.replace(/(\d+p|bluray|hd|fhd|(x264(.*)))/gi, '');

      // detects dashes AFTER numbers, strips after dash (remove ep title)
      // but in rare case of "NUM - Episode NUM", keep the "Episode NUM"
      //var epTitleGone = result.match(/(.*)(\d+ - ((ep|episode) \d+)?)|(?!.*)/gi);
      var epTitleGone = result.match(/(.*)(\d+ - (((ep|episode) )?\d+)?)|(?!.*)/gi);
      if(epTitleGone) {
        result = epTitleGone[0];
      }

      // removes trailing dashes
      result = result.replace(/(-\s*)$/g, '');

      // shortens whitespace to one space
      result = result.replace(/[\s]+/g, ' ');

      return result.trim();
    }

    function getEpisodeNumber(name) {
      // get rid of everything except for last number
      var result = name.match(/[0-9]+$/g);

      // no number? probably a movie/OVA...
      if(!result) {
        result = 1;
      }

      return +result;
    }

    function getTitle(name) {
      // get rid of "ep"/"episode", episode number
      var result = name.replace(/(((ep|episode)\.?)?\s?\d+)$/gi, '');

      // removes trailing dash, if any
      result = result.trim().replace(/-$/g, '');

      return result.trim();
    }

    function querify(name) {
      // removes dashes
      var result = name.replace(/-/g, '');

      // replace spaces with pluses
      return result.replace(/[\s]+/g, '+');
    }

    function parse(name) {
      var full = cleanFilename(name);
      var title = getTitle(full);
      var ep = getEpisodeNumber(full);
      return {
        title: title,
        ep: ep,
      }
    }

    return {
      parse: parse,
      querify: querify
    };
  }).


  factory('hummingbird', ['$resource', '$http', 'config',
  function($resource, $http, config) {
    // Inspired by the c00l as h3ck Richard Lin
    var API = 'https://hummingbirdv1.p.mashape.com';

    // Set headers all around
    $http.defaults.headers.common['X-Mashape-Key'] = config.MASHAPE_KEY;

    // Returns a promise object
    function search(query) {
      return $http.get(API + '/search/anime', {
        params: {query: query}
      });
    }

    // Returns a promise object
    function auth(username, password) {
      return $http.post(API + '/users/authenticate', {
        username: username,
        password: password
      });
    }

    /*
    Returns a promise object

    Takes this object for data:
    {
      id:       int,
      status:   currently-watching, plan-to-watch, completed, on-hold,
      privacy:  public, private,
      rating:   0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5,
      notes:    string,
      eps:      0 < eps < epsMax
    }
    */
    function update(token, data) {
      var postData = {};

      postData.auth_token = token;
      postData.status = data.status ? 'currently-watching' : data.status;
      if (data.privacy) postData.privacy = data.privacy;
      if (data.rating) postData.sane_rating_update = data.rating;
      if (data.notes) postData.notes = data.notes;
      if (data.eps) postData.episodes_watched = data.eps;

      return $http.post(API + '/libraries/' + data.id, postData);
    }

    return {
      search: search,
      auth: auth,
      update: update
    }
  }]);
