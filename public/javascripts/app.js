global.jQuery = require('jquery');
global.$ = global.jQuery;

var angular = require('angular');
require('angular-ui-router');
require('bootstrap');
var app = angular.module('admin', ['ui.router'

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
                controller: 'AdminCtrl'
            })
            .state('landing', {
                url: '/',
                templateUrl: 'partials/landing.html',
                controller: 'LandingCtrl'
            });
        $urlRouterProvider.otherwise('/');
    }]).run(function () {

});
