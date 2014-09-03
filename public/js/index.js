(function($, _, angular) {
  'use strict';

  angular.module('desuSyncApp', ['animeLists']).

  // Sharing is caring
  factory('pub', function() {
    return {obj: {}};
  }).

  // Tabs
  controller('tabsCtrl', ['$scope', 'pub',
  function($scope, pub) {
    $scope.pub = pub.obj;

    $scope.tabs = ['Credentials', 'Select Episodes'];
    $scope.curTab = $scope.tabs[0];

    $scope.pub.setTab = function(tab) {$scope.curTab = tab;};
    $scope.pub.getTab = function() {return $scope.curTab;};
    $scope.pub.isTab = function(tab) {return $scope.curTab === tab;};
  }]).

  // Login credentials
  controller('credsCtrl', ['$scope', 'pub', 'hummingbird',
  function($scope, pub, hummingbird) {
    $scope.pub = pub.obj;

    $scope.hb = {
      user: '',
      pass: '',
      token: '',
      err: '',
      ajaxing: false
    };

    $scope.hbSubmit = function() {
      $scope.hb.ajaxing = true;
      hummingbird.auth($scope.hb.user, $scope.hb.pass).
        success(function(data) {
          $scope.hb.token = data.slice(1, -1); // Get rid of double quotes
          $scope.hb.err = '';
          $scope.hb.ajaxing = false;
          $scope.pub.setTab('Select Episodes');
        }).
        error(function(data) {
          $scope.hb.token = '';
          $scope.hb.err = data.error;
          $scope.hb.ajaxing = false;
        });
    };

    $scope.pub.getHbToken = function() {return $scope.hb.token;};
  }]).

  // Filenames and stuff
  // this code is rly spaghetti pls don't hate me for it
  controller('entriesCtrl', ['$scope', '$timeout', 'pub', 'parser', 'hummingbird',
  function($scope, $timeout, pub, parser, hummingbird) {
    $scope.pub = pub.obj;

    $scope.entries = [];
    $scope.selectAll = false;

    $scope.manualTitle = '';
    $scope.manualEp = '';

    $scope.errors = [];
    $scope.ajaxing = false;

    var added = [];
    var queue = [];

    // Basic functions

    function addErr(data, msg, klass) {
      data.err = msg;
      if (klass) data.klass = klass;
      $scope.errors.push(data);
      $timeout(function() {
        $scope.removeErr(data);
      }, 5000);
    }

    $scope.removeErr = function(err) {
      $scope.errors.splice($scope.errors.indexOf(err), 1);
    };

    // Will check for entries to kick before pushing.
    function pushEntry(data) {
      angular.forEach($scope.entries, function(entry) {
        if (data.id === entry.id)
          if (data.ep > entry.ep)
            $scope.removeEntry(entry);
      });
      $scope.entries.push(data);
    }

    $scope.removeEntry = function(entry) {
      $scope.entries.splice($scope.entries.indexOf(entry), 1);
    };

    $scope.countChecked = function() {
      var count = 0;
      angular.forEach($scope.entries, function(entry) {
        if (entry.checked)
          count++;
      });
      return count;
    };

    // Remove checked or unchecked
    $scope.removeChecked = function(checked) {
      angular.forEach($scope.entries.slice(), function(entry) {
        if (entry.checked === checked)
          $scope.removeEntry(entry);
      });
    };

    $scope.removeAll = function() {
      $scope.entries = [];
    };

    function enqueue(title, ep) {
      queue.push({title: title, ep: ep});
    }

    function processQueued() {
      angular.forEach(queue, function(entry) {
        searchAndPush(entry.title, entry.ep);
      });
      queue = [];
    }

    // Adds to the 'added' array
    function recordAdded(title, ep) {
      added.push({title: title, ep: ep});
    }

    function shouldAdd(title, ep) {
      var retval = true;
      angular.forEach(added.concat(queue), function(entry) {
        if (title === entry.title) {
          if (ep <= entry.ep)
            retval = false;
          else // Clean up smaller entries
            queue.splice(entry, 1);
        }
      });
      return retval;
    }

    /*
    Callback takes err, data:
    {
      id,
      title,
      ep,
      max,
      img
    }
    */
    function search(title, ep, callback) {
      $scope.ajaxing = true;
      var errObj = {title: title, ep: ep};
      hummingbird.search(parser.querify(title)).
        success(function(data) {
          console.log(data);
          if(!(data && data[0])) {
            callback('Anime not found', errObj);
            return;
          }

          var entry = data[0];
          console.log(entry);
          if (ep <= entry.episode_count) {
            callback(null, {
              id: entry.id,
              title: entry.title,
              ep: ep,
              max: entry.episode_count,
              img: entry.cover_image,
              checked: true
            });
          }
          else {
            callback(entry.title + ' only has ' + entry.episode_count + ' episodes', errObj);
          }
          $scope.ajaxing = false;
        }).
        error(function(data) {
          console.log(data);
          callback('AJAX error', errObj);
          $scope.ajaxing = false;
        });
    }

    // Returns success or failure
    function searchAndPush(title, ep) {
      search(title, ep, function(err, data) {
        if (err) {
          addErr(data, err, 'alert-danger');
          return false;
        }
        recordAdded(title, ep);
        pushEntry(data);
        return true;
      });
    }

    // Manual text fields - no queuing needed
    $scope.manualAdd = function() {
      (function(title, ep) {
        if (shouldAdd(title, ep))
          searchAndPush(title, ep);
        else
          addErr({title: title, ep: ep}, 'Already added episode ' + entry.ep, 'alert-info');
      })($scope.manualTitle, $scope.manualEp);

      $scope.manualTitle = '';
      $scope.manualEp = '';
    };

    function fileValid(file) {
      return !(file.type && file.type.indexOf('video'));
    }

    $scope.addFiles = function(files) {
      // Queue so we don't make n queries
      angular.forEach(files, function(file) {
        if (!fileValid(file)) {
          addErr({title: file.name, ep: 'n/a'}, 'File type not valid', 'alert-warning');
          return;
        }

        var parsed = parser.parse(file.name);
        var title = parsed.title;
        var ep = parsed.ep;

        if (shouldAdd(title, ep)) {
          enqueue(title, ep);
        }
      });

      processQueued();
    };

    $scope.update = function() {
      $scope.ajaxing = true;
      angular.forEach($scope.entries, function(entry) {
        if (entry.checked) {
          hummingbird.update($scope.pub.getHbToken(), {id: entry.id, eps: entry.ep}).
            success(function(data) {
              console.log(data);
              addErr({title: entry.title, ep: entry.ep}, 'Added successfully', 'alert-success');
              $scope.removeEntry(entry);
              $scope.ajaxing = false;
            }).
            error(function(data) {
              addErr({title: entry.title, ep: entry.ep}, data.error, 'alert-danger');
              $scope.ajaxing = false;
            });
        }
      });
    };

    $scope.$watch('selectAll', function(selected) {
      angular.forEach($scope.entries, function(entry) {
        entry.checked = selected;
      });
    });

  }]).

  // Drag and drop box
  directive('desuBox', function() {
    return {
      restrict: 'E',
      // transclude: true,
      // template: '<label ng-transclude></label>',
      scope: {
        callback: '&onDrop'
      },
      link: function(scope, elem) {
        elem.on('dragover dragleave dragend drop', function(e) {
          e.stopPropagation();
          e.preventDefault();
          $(e.target)[e.type == 'dragover' ? 'addClass' : 'removeClass']('hover');
          return false;
        }).
        on('drop', function(e) {
          scope.callback({files: e.originalEvent.dataTransfer.files});
          scope.$apply();
        });
      }
    };
  }).

  // File select
  directive('desuSelect', function() {
    return {
      restrict: 'E',
      template: '<input type="file" multiple>',
      scope: {
        callback: '&onSelect'
      },
      link: function(scope, elem) {
        elem.on('change', function(e) {
          e.stopPropagation();
          e.preventDefault();
          scope.callback({files: e.target.files});
          scope.$apply();
        });
      }
    };
  });

  $(function() {
    // Remove drag and drop if not supported
    if (!(window.File || window.FileList))
      $('desu-box').remove();
  });

})(window.jQuery, window._, window.angular);