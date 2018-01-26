(function() {

  angular.module('getYelp', []).controller("mainController", mainController);
  
  mainController.$inject = ["$scope", "$http"];

function mainController($scope, $http) {
  $scope.formData = {};
  $scope.yelpList = [];

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
  
  // add person to booking
  $scope.addBooking = function(business_id) {
    console.log("calling addBooking with id="+business_id);
    
    $http({
      method: 'POST',
      url: '/book',
      data: "business_id=" + business_id,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data) {
        console.log("addBooking returned " + data);
        if(data.people.length > 0) {
          for(var ii = 0; ii < $scope.yelpList.length; ii++) {
            if($scope.yelpList[ii].id == business_id) {
              console.log("updating yelpList ii="+ii);
              $scope.yelpList[ii].people = data.people;
            }
          }
        }
      })
      .error(function(data) {
        console.log('addBooking error: ' + data);
      });
  };

};
  
})();