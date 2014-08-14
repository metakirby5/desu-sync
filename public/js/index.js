/* TODO
    select/remove entries
    alert bad if folder (or maybe finish series?)

*/

(function($, angular) {
  'use strict';

  // Angular

  angular.module('desuSyncApp', [])

  .controller('desuSyncCtrl', ['$scope',// 'Hummingbird', 'MAL',
  function($scope) {
    $scope.entries = [];

    $scope.updateFiles = function(files) {
      for(var i = 0, file; file = files[i]; i++) {
        var name = file.name;
        console.log(file.type); // TODO REMOVE
        var checked = !(file.type && file.type.indexOf('video'));

        $scope.entries.push({name: name, checked: checked});
      }
    };

    $scope.$watch('entries', function(entries) {

    })
  }])

  .directive('desuBox', function() {
    return {
      restrict: 'E',
      scope: {
        callback: '&onDrop'
      },
      link: function(scope, elem, attrs) {
        elem.on('dragover dragleave dragend drop', function(e) {
          e.stopPropagation();
          e.preventDefault();
          $(e.target)[e.type == 'dragover' ? 'addClass' : 'removeClass']('hover');
          return false;
        }).
        on('drop', function(e) {
          scope.callback( {files: e.originalEvent.dataTransfer.files });
          scope.$apply();
        });
      }
    };
  });

})(window.jQuery, window.angular);