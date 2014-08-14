(function($, angular, require) {
  'use strict';

  angular.module('desuSyncApp', [])

  // Filenames and stuff
  .controller('entriesCtrl', ['$scope',// 'Hummingbird', 'MAL',
  function($scope) {
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
  controller('credsCtrl', ['$scope',
  function($scope) {
    $scope.showCreds = true;
    $scope.hum = {
      email: '',
      user: '',
      pass: ''
    };
    $scope.mal = {
      user: '',
      pass: ''
    };

    $scope.toggleCreds = function() {
      $scope.showCreds = !$scope.showCreds;
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

})(window.jQuery, window.angular, window.require);