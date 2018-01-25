var getYelp = angular.module('getYelp', []);

function mainController($scope, $http) {
  $scope.formData = {};

  // search yelp businesses
  $scope.searchYelp = function() {
    console.log("calling searchYelp");
    $http.get("/search/"+$scope.searchTerm)
      .success(function(data) {
        $scope.yelpList = data.businesses;
        console.log("Yelp search returned " + data.total);
      })
      .error(function(data) {
        console.log('Yelp search error: ' + data);
      });
  };

}