/**
 * Created by Jonfor on 12/17/15.
 */
'use strict';

describe('LandingCtrl', function () {

    beforeEach(module('admin'));
    it('should create "phones" model with 3 phones', inject(function ($controller) {
        var scope = {},
            ctrl = $controller('LandingCtrl', {$scope: scope});

        expect(scope.logIn.length).toBe(3);
    }));

});