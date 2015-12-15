'use strict';

/**
 * @ngdoc function
 * @name bookdAdminApp.controller:AdminCtrl
 * @description
 * # AdminCtrl
 * Controller of the bookdAdminApp
 */
module.exports = function ($scope, businessFactory) {
    businessFactory.getRequests()
        .then(function () {
            $scope.pendingRequests = businessFactory.requests;
        });

    $scope.updateRequest = function (request, pending, claimed) {
        request.pending = pending;
        request.claimed = claimed;
        businessFactory.changeStatus(request)
            .then(function () {
                businessFactory.getRequests();
            });
    }
};
