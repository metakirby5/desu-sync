(function($, _, angular, require) {
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
    $scope.pub.getTab = function() {return $scope.curTab;}
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
    }

    $scope.pub.getHbToken = function() {return $scope.hb.token;};
    $scope.pub.getMal = function() {return $scope.mal;};
  }]).

  // Filenames and stuff
  controller('entriesCtrl', ['$scope', 'pub', 'parser', 'hummingbird',
  function($scope, pub, parser, hummingbird) {
    $scope.pub = pub.obj;

    $scope.entries = [];
    $scope.selectAll = false;

    $scope.manualName = '';
    $scope.manualEp = '';

    $scope.errors = [];
    $scope.ajaxing = false;

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
      hummingbird.search(parser.querify(title)).
        success(function(data) {
          console.log(data);
          if(!(data && data[0])) {
            callback('Anime not found');
            return;
          }

          var entry = data[0];
          console.log(entry);
          callback(null, {
            id: entry.id,
            title: entry.title,
            ep: ep,
            max: entry.episode_count,
            img: entry.cover_image,
            checked: true
          });
          $scope.ajaxing = false;
        }).
        error(function(data) {
          console.log(data);
          callback('AJAX error');
          $scope.ajaxing = false;
        });
    }

    function pushEntry(data) {
      $scope.entries.push(data);
    }

    function shouldAdd(title, ep) {
      angular.forEach($scope.entries, function(entry) {
        if (data.id === entry.id || data.title === entry.title) {
          if (data.ep <= entry.ep) // Beat by other entry
            return false;
        }
      });
      return true;
    }

    function insertEntry(data) {
      var kicked = false;

      angular.forEach($scope.entries, function(entry) {
        if (data.id === entry.id || data.title === entry.title) {
          if (data.ep > entry.ep) // Kick lower entries out
            $scope.removeEntry(entry);
          else {                  // Other entry beat us
            kicked = true;
            return;
          }
        }
      });

      if (!kicked)
        pushEntry(data);
    }

    function addEntry(title, ep, queriable) {
      if (!shouldAdd(title, ep))
        return;
      if (queriable) {
        search(title, ep, function(err, data) {
          if (err) {
            console.log(err);
            addErr({title: title, ep: ep, err: err, klass: 'alert-danger'});
            return;
          }
          insertEntry(data);
        })
      } else {
        insertEntry({
          title: title,
          ep: ep ? ep : 1,
          checked: false
        });
      }
    }

    function addErr(err) {
      $scope.errors.push(err);
    }

    $scope.removeEntry = function(entry) {
      $scope.entries.splice($scope.entries.indexOf(entry), 1);
    };

    $scope.removeErr = function(err) {
      $scope.errors.splice($scope.errors.indexOf(err), 1);
    };

    $scope.count = function() {
      var count = 0;
      angular.forEach($scope.entries, function(entry) {
        if (entry.checked)
          count++;
      });
      return count;
    }

    $scope.addFiles = function(files) {
      angular.forEach(files, function(file) {
        var valid = !(file.type && file.type.indexOf('video'));
        if (valid) {
          var parsed = parser.parse(file.name);
          addEntry(parsed.title, parsed.ep, true);
        }
        else
          addEntry(file.name, 1);
      });
    };

    // Manual text fields
    $scope.manualAdd = function() {
      addEntry($scope.manualName, $scope.manualEp, true);
      $scope.manualName = '';
      $scope.manualEp = '';
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
          scope.callback({files: e.target.files})
          scope.$apply();
        })
      }
    }
  });

  $(function() {
    // Remove drag and drop if not supported
    if (!(window.File || window.FileList))
      $('desu-box').remove();
  });

})(window.jQuery, window._, window.angular, window.require);