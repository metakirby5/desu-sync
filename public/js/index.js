(function($, angular) {
  'use strict';

  angular.module('desuSyncApp', [])

  .controller('desuSyncCtrl', ['$scope',// 'Hummingbird', 'MAL',
  function($scope) {
    $scope.entries = [];
    $scope.selectAll = false;

    $scope.manualName = '';
    $scope.manualEp = '';

    // Manual text fields
    $scope.manualAdd = function() {
      $scope.entries.push({
        name: $scope.manualName,
        ep: $scope.manualEp,
        checked: true
      });
      $scope.manualName = '';
      $scope.manualEp = '';
    }

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
        this.push({
          name: file.name,
          checked: !(file.type && file.type.indexOf('video'))
        });
      }, $scope.entries);
    };

    $scope.remove = function(entry) {
      $scope.entries.splice($scope.entries.indexOf(entry), 1);
    };

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

  }])

  // Drag and drop box
  .directive('desuBox', function() {
    return {
      restrict: 'E',
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
  })

  // File select
  .directive('desuSelect', function() {
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

})(window.jQuery, window.angular);