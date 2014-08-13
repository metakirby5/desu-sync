(function($, angular) {

  // Angular

  angular.module('desuSyncApp', [])

  .controller('desuSyncCtrl', ['$scope',// 'Hummingbird', 'MAL',
  function($scope) {
    $scope.files = [];
  }])

  .directive('desuFiles', function() {
    return {
      template: 'Drag and drop files here!',
      link: function($scope, elem) {
        elem.bind('drop', function(e) {
          console.log(e);
          $scope.$apply(function() {
            $scope.files = e.originalEvent.dataTransfer.files;
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