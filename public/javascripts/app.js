window.jQuery = require('jquery');
window.$ = global.jQuery;
// window._ = require('lodash');

var angular = require('angular');
require('angular-ui-router');
require('bootstrap');
var app = angular.module('admin', ['ui.router',
    'ui.bootstrap'
]);

require('./services');
require('./controllers');

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    '$locationProvider',
    function ($stateProvider, $urlRouterProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
        $stateProvider
            .state('admin', {
                url: '/admin',
                templateUrl: 'partials/admin.html',
                controller: 'AdminCtrl',
                resolve: {
                    isAuthenticated: function ($state, $q, auth) {
                        var redirect = false;
                        if (!auth.isLoggedIn()) {
                            redirect = true;
                            return $q.reject({
                                state: 'error'
                            });
                        }
                        return redirect;
                    }
                }
            })
            .state('landing', {
                url: '/',
                templateUrl: 'partials/landing.html',
                controller: 'LandingCtrl'
            });
        $urlRouterProvider.otherwise('/');
    }]).run(function ($rootScope, $state) {
    $rootScope.$on('$stateChangeError', function (event, toState, toStateParams,
                                                  fromState, fromStateParams, error) {

        if (error) {
            console.log(error);
            $state.go('landing');
            //var navViewModel = $rootScope.$new();
            //$controller('NavCtrl', {$scope: navViewModel});
            //navViewModel.open('md', 'landing');
        }

    });
});
