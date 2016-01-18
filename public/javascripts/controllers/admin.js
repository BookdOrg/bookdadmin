'use strict';

/**
 * @ngdoc function
 * @name bookdAdminApp.controller:AdminCtrl
 * @description
 * # AdminCtrl
 * Controller of the bookdAdminApp
 */
module.exports = function ($scope, businessFactory, $uibModal) {
    businessFactory.getRequests()
        .then(function () {
            $scope.pendingRequests = businessFactory.requests;
        });

    $scope.approveRequest = function (request) {
        request.pending = false;
        request.claimed = true;
        $scope.loading = true;
        businessFactory.changeStatus(request)
            .then(function () {
                $scope.loading = false;
                businessFactory.getRequests();
            });
    };

    $scope.openDenialModal = function (size) {
        var modalInstance = $uibModal.open({
            templateUrl: 'denyRequestModal.html',
            controller: 'denyRequestModalCtrl as ctrl',
            size: size
        });

        // Set the request information to the request selected in the ng-repeat
        modalInstance.request = $scope.request;
    };

    //Needed to pass the request data from the ng-repeat to the modal.
    $scope.setRequest = function (request) {
        $scope.request = request;
    };
};
