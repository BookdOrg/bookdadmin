/**
 * Created by: Khalil Brown
 * AUTH Factory - Handles user authentication, login, registration, tokens.
 */
module.exports = function ($http, $window, $rootScope, $state) {
    var auth = {
        saveToken: function (token) {
            $window.localStorage['cc-token'] = token;
        },
        getToken: function () {
            return $window.localStorage['cc-token'];
        },
        isLoggedIn: function () {
            var token = auth.getToken();

            if (token !== 'undefined' && angular.isDefined(token)) {
                var payload = angular.fromJson($window.atob(token.split('.')[1]));

                return payload.exp > Date.now() / 1000;
            } else {
                return false;
            }
        },
        currentUser: function () {
            if (auth.isLoggedIn()) {
                var token = auth.getToken();
                return {
                    'user': angular.fromJson($window.atob(token.split('.')[1]))
                };
            }
        },
        logIn: function (user, info) {
            return $http.post('/admin/login', user)
                .then(function (data) {
                    auth.saveToken(data.data.token);
                    $rootScope.currentUser = auth.currentUser();
                }, function (error) {
                    throw error.data;
                });
        },
        logOut: function () {
            $window.localStorage.removeItem('cc-token');
            $rootScope.currentUser = null;
            $state.go('landing');
        }
    };

    return auth;
};
