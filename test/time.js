
suite('timeFunctions', function() {

    var assert = require('chai').assert,
        timefunc = require('../extension/js/timefunctions');

    suite('computeTimeDifference', function() {

        test('Returns zero when the same time is passed twice', function() {
            // Arrange
            var time1 = "10:53",
                time2 = time1;
            
            // Act
            var diff = timefunc.computeTimeDifference(time1, time2);
            
            // Assert
            assert.equal(diff, 0);
        });

        test('Returns one when changing hour', function() {
            // Arrange
            var time1 = "10:59",
                time2 = "11:00";
            
            // Act
            var diff = timefunc.computeTimeDifference(time1, time2);
            
            // Assert
            assert.equal(diff, 1);
        });

        test('Returns less than 0 when changing day', function() {
            // Arrange
            var time1 = "23:59",
                time2 = "00:00";
            
            // Act
            var diff = timefunc.computeTimeDifference(time1, time2);
            
            // Assert
            assert.isTrue(diff < 0);
        });

    });
});
