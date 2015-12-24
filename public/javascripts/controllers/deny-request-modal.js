/**
 * Created by Jonfor on 12/17/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory) {
    // This request object is passed from the admin controller.
    $scope.request = $uibModalInstance.request;
    $scope.denyRequest = function () {
        $scope.request.pending = false;
        $scope.request.claimed = false;
        businessFactory.changeStatus($scope.request)
            .then(function () {
                businessFactory.getRequests();
            });

        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.reasons = [
        'test',
        '2',
        'h'
    ]
};