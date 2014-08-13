/* TODO
    select/remove entries
    alert bad if folder (or maybe finish series?)

*/

(function($, angular) {

  // Angular

  angular.module('desuSyncApp', [])

  .controller('desuSyncCtrl', ['$scope',// 'Hummingbird', 'MAL',
  function($scope) {
    $scope.files = [];
  }])

  .directive('desuFiles', function() {
    return {
      link: function(scope, elem, attrs, ctrl) {
        elem.on('drop', function(e) {
          scope.$apply(function() {
            // Append new files to model
            Array.prototype.push.apply(scope.files, e.originalEvent.dataTransfer.files);
          });
        });
      }
    };
  });

  // Handle frontend aspects
  function prepareDropbox() {
    $dropbox = $('.dropbox');

    $dropbox.on('dragover dragleave dragend drop', function(e) {
      e.stopPropagation();
      e.preventDefault();
      $(e.target)[e.type == 'dragover' ? 'addClass' : 'removeClass']('hover');
      return false;
    });
  }

  $(function() {
    prepareDropbox();
  });
})(window.jQuery, window.angular);