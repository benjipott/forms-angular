'use strict';

formsAngular.factory('$data', [function() {

    var sharedData = {
        record: {},
        disableFunctions: {}
    };
    return sharedData;

}]);
