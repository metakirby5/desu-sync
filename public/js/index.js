(function($, _, angular, require) {
  'use strict';

  angular.module('desuSyncApp', []).

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

    $scope.pub.setTab = function(tab) {
      if ($scope.curTab === 'Credentials' && !$scope.pub.credsValid())
        return;

      $scope.curTab = tab;
    };
    $scope.pub.getTab = function() {return $scope.curTab;}
    $scope.pub.isTab = function(tab) {return $scope.curTab === tab;};
  }]).

  // Filenames and stuff
  controller('entriesCtrl', ['$scope', 'pub',// 'Hummingbird', 'MAL',
  function($scope, pub) {
    $scope.pub = pub.obj;

    $scope.entries = [];
    $scope.selectAll = false;

    $scope.manualName = '';
    $scope.manualEp = '';

    $scope.add = function(name, ep, checked) {
      $scope.entries.push({
        name: name,
        ep: ep ? ep : 1,
        checked: checked
      });
    }

    $scope.remove = function(entry) {
      $scope.entries.splice($scope.entries.indexOf(entry), 1);
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
        $scope.add(file.name, 1, !(file.type && file.type.indexOf('video')));
      }, $scope.entries);
    };

    // Manual text fields
    $scope.manualAdd = function() {
      $scope.add($scope.manualName, $scope.manualEp, true);
      $scope.manualName = '';
      $scope.manualEp = '';
    }

    // Remove checked or unchecked
    $scope.removeCheck = function(checked) {
      angular.forEach($scope.entries.slice(), function(entry) {
        if (entry.checked === checked)
          $scope.remove(entry);
      });
    };

    $scope.removeAll = function() {
      $scope.entries = [];
    };

    $scope.$watch('selectAll', function(selected) {
      angular.forEach($scope.entries, function(entry) {
        entry.checked = selected;
      })
    });

  }]).

  // Login credentials
  controller('credsCtrl', ['$scope', 'pub',
  function($scope, pub) {
    $scope.pub = pub.obj;

    $scope.hb = {
      user: '',
      pass: ''
    }
    $scope.mal = {
      user: '',
      pass: ''
    }

    $scope.pub.getHb = function() {return $scope.hb;};
    $scope.pub.getMal = function() {return $scope.mal;};
    $scope.pub.credFilled = function(form) {
      var size = 0;
      var filled = 0;
      for (var key in form) {
        size++;
        filled += form[key] ? 1 : 0;
      }
      return size ? filled === size : false;
    };
    $scope.credValid = function(form) {
      var size = 0;
      var filled = 0;
      for (var key in form) {
        size++;
        filled += form[key] ? 1 : 0;
      }
      return size ? !(0 < filled && filled < size) : false;
    };
    $scope.pub.credsValid = function() {
      // Both valid, at least one filled
      return ($scope.credValid($scope.hb) && $scope.credValid($scope.mal)) &&
             ($scope.pub.credFilled($scope.hb) || $scope.pub.credFilled($scope.mal));
    };
  }]).

  // Drag and drop box
  directive('desuBox', function() {
    return {
      restrict: 'E',
      transclude: true,
      template: '<label ng-transclude></label>',
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