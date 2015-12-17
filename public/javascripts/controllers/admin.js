'use strict';

/**
 * @ngdoc function
 * @name bookdAdminApp.controller:AdminCtrl
 * @description
 * # AdminCtrl
 * Controller of the bookdAdminApp
 */
module.exports = function ($scope, businessFactory, socketService) {
    //businessFactory.getRequests()
    //    .then(function () {
    //        $scope.pendingRequests = businessFactory.requests;
    //    });

    $scope.updateRequest = function (request, pending, claimed) {
        request.pending = pending;
        request.claimed = claimed;
        businessFactory.changeStatus(request)
            .then(function () {
                businessFactory.getRequests();
            });
    };

    $scope.pendingRequests = [];
    socketService.on('pending', function (pending) {
        // Don't push the same business again in case of socket disconnect and reconnect.
        // Use _id to uniquely identify a business.
        if (!(_.find($scope.pendingRequests, '_id', pending._id))) {
            $scope.pendingRequests.push(pending);
        }
    });
};
