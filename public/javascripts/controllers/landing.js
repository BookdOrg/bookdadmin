/**
 * Created by Jonfor on 12/14/15.
 */
module.exports = function ($scope, auth, $state) {
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.logOut = auth.logOut;

    $scope.logIn = function () {
        var user = {
            'username': $scope.user.email,
            'password': $scope.user.password
        };
        auth.logIn(user)
            .then(function () {
                $state.go('admin');
            }, function (error) {
                $scope.error = error.message;
            });
    };

    if (auth.isLoggedIn()) {
        $state.go('admin');
    }
};
