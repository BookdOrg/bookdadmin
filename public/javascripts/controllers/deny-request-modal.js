/**
 * Created by Jonfor on 12/17/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory) {
    var request = $uibModalInstance.request;
    $scope.denyRequest = function () {
        request.pending = false;
        request.claimed = false;
        businessFactory.changeStatus(request)
            .then(function () {
                businessFactory.getRequests();
            });

        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
};