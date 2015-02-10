
suite('Time constraints, threshold: 2', function() {

    var constraintResolver = require('../extension/js/constraint-resolver'),
        timeFunctions = require('../extension/js/timefunctions'),
        getTimeString = timeFunctions.getTimeString,
        getDateString = timeFunctions.getDateString;
    // getTimeString/getDateString method is trivial, it would be too cumbersome to mock

    var assert = require('chai').assert,
        Promise = require('bluebird'),
        threshold = 2;

    var mockTimeFunctions = function(diff) {
        var diffFun;
        if(typeof diff !== 'function') diffFun = function() { return diff; };
        else diffFun = diff;
        return {
            computeTimeDifference: diffFun,
            getDateString: getDateString,
            getTimeString: getTimeString
        };
    };
    var mockFetchStations = function(codes) {
        return {
            fetchStations: function() {},
            getStationCode: function(str) { return codes[str]; }
        };
    };

    suite('Single step', function() {

        test('No button is shown when time type is arrival', function() {
            // Arrange
            var steps = [];
            steps.push({
                departureStation: 'Here',
                departureTime: '10:00',
                arrivalStation: 'There',
                arrivalTime: '10:01'
            });
            
            // Act
            constraintResolver.resolveTimeConstraints(steps, 'arrival', threshold);
            
            // Assert
            assert.isNull(steps[0].findAnotherTrainButton);
        });

        test('No button is shown when time type is departure', function() {
            // Arrange
            var steps = [];
            steps.push({
                departureStation: 'Here',
                departureTime: '10:00',
                arrivalStation: 'There',
                arrivalTime: '10:01'
            });
            
            // Act
            constraintResolver.resolveTimeConstraints(steps, 'departure', threshold);
            
            // Assert
            assert.isNull(steps[0].findAnotherTrainButton);
        });
    });

    suite('Two steps', function() {

        test('No button is shown when connection time is above threshold, for time type of arrival', function() {
            // Arrange
            var steps = [];
            steps.push({
                departureStation: 'Here',
                departureTime: '10:00',
                arrivalStation: 'There',
                arrivalTime: '10:03'
            });
            steps.push({
                departureStation: 'There',
                departureTime: '10:10',
                arrivalStation: 'Nowhere',
                arrivalTime: '10:15'
            });
            var timeFunctionsMock = mockTimeFunctions(7);
            constraintResolver.initialize(timeFunctionsMock);
            
            // Act
            constraintResolver.resolveTimeConstraints(steps, 'arrival', threshold);
            
            // Assert
            assert.isNull(steps[0].findAnotherTrainButton);
            assert.isNull(steps[1].findAnotherTrainButton);
        });

        test('No button is shown when connection time is above threshold, for time type of departure', function() {
            // Arrange
            var steps = [];
            steps.push({
                departureStation: 'Here',
                departureTime: '10:00',
                arrivalStation: 'There',
                arrivalTime: '10:03'
            });
            steps.push({
                departureStation: 'There',
                departureTime: '10:10',
                arrivalStation: 'Nowhere',
                arrivalTime: '10:15'
            });
            var timeFunctionsMock = mockTimeFunctions(7);
            constraintResolver.initialize(timeFunctionsMock);
            
            // Act
            constraintResolver.resolveTimeConstraints(steps, 'departure', threshold);
            
            // Assert
            assert.isNull(steps[0].findAnotherTrainButton);
            assert.isNull(steps[1].findAnotherTrainButton);
        });

        test('"Find previous" button is shown in the first step when connection time is below threshold, for time type of arrival', function() {
            // Arrange
            var steps = [];
            steps.push({
                departureStation: 'Here',
                departureTime: '10:00',
                arrivalStation: 'There',
                arrivalTime: '10:03'
            });
            steps.push({
                departureStation: 'There',
                departureTime: '10:04',
                arrivalStation: 'Nowhere',
                arrivalTime: '10:07'
            });
            var timeFunctionsMock = mockTimeFunctions(1);
            constraintResolver.initialize(timeFunctionsMock);
            
            // Act
            constraintResolver.resolveTimeConstraints(steps, 'arrival', threshold);
            
            // Assert
            assert.equal(steps[0].findAnotherTrainButton, 'previous');
            assert.isNull(steps[1].findAnotherTrainButton);
        });

        test('"Find next" button is shown in the second step when connection time is below threshold, for time type of departure', function() {
            // Arrange
            var steps = [];
            steps.push({
                departureStation: 'Here',
                departureTime: '10:00',
                arrivalStation: 'There',
                arrivalTime: '10:03'
            });
            steps.push({
                departureStation: 'There',
                departureTime: '10:04',
                arrivalStation: 'Nowhere',
                arrivalTime: '10:07'
            });
            var timeFunctionsMock = mockTimeFunctions(1);
            constraintResolver.initialize(timeFunctionsMock);
            
            // Act
            constraintResolver.resolveTimeConstraints(steps, 'departure', threshold);
            
            // Assert
            assert.isNull(steps[0].findAnotherTrainButton);
            assert.equal(steps[1].findAnotherTrainButton, 'next');
        });
    });

    suite('Resolve dates', function() {

        test('Compute dates correctly for single-step same-day time of type departure', function() {
            // Arrange
            var steps = [];
            steps.push({
                departureStation: 'Here',
                departureTime: '10:00',
                arrivalStation: 'There',
                arrivalTime: '10:03'
            });
            var date = new Date(2015, 1, 1, 9, 59, 0, 0);
            var expectedDates = {
                departure: new Date(2015, 1, 1, 10, 0, 0, 0),
                arrival: new Date(2015, 1, 1, 10, 3, 0, 0)
            };
            
            // Act
            constraintResolver.resolveDates(steps, date, 'departure');
            
            // Assert
            assert.equal(steps[0].departureDate.getTime(),
                         expectedDates.departure.getTime());
            assert.equal(steps[0].arrivalDate.getTime(),
                         expectedDates.arrival.getTime());
        });

        test('Compute dates correctly for single-step different-day time of type departure', function() {
            // Arrange
            var steps = [];
            steps.push({
                departureStation: 'Here',
                departureTime: '23:57',
                arrivalStation: 'There',
                arrivalTime: '00:03'
            });
            var date = new Date(2015, 1, 1, 23, 50, 0, 0);
            var expectedDates = {
                departure: new Date(2015, 1, 1, 23, 57, 0, 0),
                arrival: new Date(2015, 1, 2, 0, 3, 0, 0)
            };
            var timeFunctionsMock = mockTimeFunctions(function(t1, t2) {
                if(t1 === '23:50') return 7;
                if(t1 === '23:57') return -(24*60 - 6);
                throw new Error('Mocked computeTimeDifference called with arguments ' + t1 + ' and ' + t2);
            });
            constraintResolver.initialize(timeFunctionsMock);
            
            // Act
            constraintResolver.resolveDates(steps, date, 'departure');
            
            // Assert
            assert.equal(steps[0].departureDate.getTime(),
                         expectedDates.departure.getTime());
            assert.equal(steps[0].arrivalDate.getTime(),
                         expectedDates.arrival.getTime());
        });

        test('Compute dates correctly for two-steps, different-day, time of type departure', function() {
            // Arrange
            var steps = [];
            steps.push({
                departureStation: 'Here',
                departureTime: '23:57',
                arrivalStation: 'There',
                arrivalTime: '00:03'
            });
            steps.push({
                departureStation: 'Here',
                departureTime: '00:06',
                arrivalStation: 'There',
                arrivalTime: '00:12'
            });
            var date = new Date(2015, 1, 1, 23, 50, 0, 0);
            var expectedDates = [{
                departure: new Date(2015, 1, 1, 23, 57, 0, 0),
                arrival: new Date(2015, 1, 2, 0, 3, 0, 0)
            }, {
                departure: new Date(2015, 1, 2, 0, 6, 0, 0),
                arrival: new Date(2015, 1, 2, 0, 12, 0, 0)
            }];
            var timeFunctionsMock = mockTimeFunctions(function(t1, t2) {
                if(t1 === '23:50') return 7;
                if(t1 === '23:57') return -(24*60 - 6);
                if(t1 === '00:03') return 3;
                if(t1 === '00:06') return 6;
                throw new Error('Mocked computeTimeDifference called with arguments ' + t1 + ' and ' + t2);
            });
            constraintResolver.initialize(timeFunctionsMock);
            
            // Act
            constraintResolver.resolveDates(steps, date, 'departure');
            
            // Assert
            assert.equal(steps[0].departureDate.getTime(),
                         expectedDates[0].departure.getTime());
            assert.equal(steps[0].arrivalDate.getTime(),
                         expectedDates[0].arrival.getTime());
            assert.equal(steps[1].departureDate.getTime(),
                         expectedDates[1].departure.getTime());
            assert.equal(steps[1].arrivalDate.getTime(),
                         expectedDates[1].arrival.getTime());
        });

        test('Compute dates correctly for single-step same-day time of type arrival', function() {
            // Arrange
            var steps = [];
            steps.push({
                departureStation: 'Here',
                departureTime: '10:00',
                arrivalStation: 'There',
                arrivalTime: '10:03'
            });
            var date = new Date(2015, 1, 1, 10, 5, 0, 0);
            var expectedDates = {
                departure: new Date(2015, 1, 1, 10, 0, 0, 0),
                arrival: new Date(2015, 1, 1, 10, 3, 0, 0)
            };
            var timeFunctionsMock = mockTimeFunctions(function(t1, t2) {
                if(t1 === '10:00') return 3;
                if(t1 === '10:03') return 2;
                throw new Error('Mocked computeTimeDifference called with arguments ' + t1 + ' and ' + t2);
            });
            constraintResolver.initialize(timeFunctionsMock);
            
            // Act
            constraintResolver.resolveDates(steps, date, 'arrival');
            
            // Assert
            assert.equal(steps[0].departureDate.getTime(),
                         expectedDates.departure.getTime());
            assert.equal(steps[0].arrivalDate.getTime(),
                         expectedDates.arrival.getTime());
        });

        test('Compute dates correctly for single-step different-day time of type arrival', function() {
            // Arrange
            var steps = [];
            steps.push({
                departureStation: 'Here',
                departureTime: '23:57',
                arrivalStation: 'There',
                arrivalTime: '00:03'
            });
            var date = new Date(2015, 1, 2, 0, 5, 0, 0);
            var expectedDates = {
                departure: new Date(2015, 1, 1, 23, 57, 0, 0),
                arrival: new Date(2015, 1, 2, 0, 3, 0, 0)
            };
            var timeFunctionsMock = mockTimeFunctions(function(t1, t2) {
                if(t1 === '23:57') return -(24*60 - 6);
                if(t1 === '00:03') return 2;
                throw new Error('Mocked computeTimeDifference called with arguments ' + t1 + ' and ' + t2);
            });
            constraintResolver.initialize(timeFunctionsMock);
            
            // Act
            constraintResolver.resolveDates(steps, date, 'arrival');
            
            // Assert
            assert.equal(steps[0].departureDate.getTime(),
                         expectedDates.departure.getTime());
            assert.equal(steps[0].arrivalDate.getTime(),
                         expectedDates.arrival.getTime());
        });

        test('Compute dates correctly for two-steps, different-day, time of type arrival', function() {
            // Arrange
            var steps = [];
            steps.push({
                departureStation: 'Here',
                departureTime: '23:57',
                arrivalStation: 'There',
                arrivalTime: '00:03'
            });
            steps.push({
                departureStation: 'Here',
                departureTime: '00:06',
                arrivalStation: 'There',
                arrivalTime: '00:12'
            });
            var date = new Date(2015, 1, 2, 0, 15, 0, 0);
            var expectedDates = [{
                departure: new Date(2015, 1, 1, 23, 57, 0, 0),
                arrival: new Date(2015, 1, 2, 0, 3, 0, 0)
            }, {
                departure: new Date(2015, 1, 2, 0, 6, 0, 0),
                arrival: new Date(2015, 1, 2, 0, 12, 0, 0)
            }];
            var timeFunctionsMock = mockTimeFunctions(function(t1, t2) {
                if(t1 === '00:12') return 3;
                if(t1 === '00:06') return 9;
                if(t1 === '00:03') return 3;
                if(t1 === '23:57') return -(24*60 - 9);
                return -1;
            });
            constraintResolver.initialize(timeFunctionsMock);
            
            // Act
            constraintResolver.resolveDates(steps, date, 'arrival');
            
            // Assert
            assert.equal(steps[0].departureDate.getTime(),
                         expectedDates[0].departure.getTime());
            assert.equal(steps[0].arrivalDate.getTime(),
                         expectedDates[0].arrival.getTime());
            assert.equal(steps[1].departureDate.getTime(),
                         expectedDates[1].departure.getTime());
            assert.equal(steps[1].arrivalDate.getTime(),
                         expectedDates[1].arrival.getTime());
        });
    });

    suite('#makeResolveConstraintButtonCallback()', function() {

        test('should call seekCombination with appropriate parameters', function(done) {
            // Arrange
            var stationCodes = {
                'Av. del Cid': 1,
                'Benimaclet': 2,
                'Universitat Politècnica': 3 },
                
                minimumConnectionTime = 2, trip = [{
                    departureTime: '11:10',
                    departureStation: 'Av. del Cid',
                    arrivalTime: '11:21',
                    arrivalStation: 'Benimaclet'
                }, {
                    departureTime: '11:22',
                    departureStation: 'Benimaclet',
                    arrivalTime: '11:26',
                    arrivalStation: 'Universitat Politècnica'
                }],
                originalAjaxFunction = function() {},
                minimumNextDeparture = '11:23', // 11:21 + minimumConnectionTime
                originalDateString = '4/2/2015',
                originalDate = new Date(2015, 1, 4, 11, 5, 0, 0), // months start from 0
                originalTimeType = 'departure'; // Hence, it is a 'next' button for the second step
            var seekCombination = function(from, to, dateString, timeString, timeType, ajaxFunction) {
                return new Promise(function() {
                    try {
                        assert.equal(from, getStationCode(trip[1].departureStation));
                        assert.equal(to, getStationCode(trip[1].arrivalStation));
                        assert.equal(dateString, originalDateString);
                        assert.equal(timeString, minimumNextDeparture);
                        assert.equal(timeType, originalTimeType); // next button, means departure trip
                        assert.equal(ajaxFunction, originalAjaxFunction);
                        done();
                    }
                    catch(e) {
                        done(e);
                    }
                });
            };
            var timeFunctionsMock = mockTimeFunctions(function(t1, t2) {
                if(t1 === '11:05') return 5;
                if(t1 === '11:10') return 11;
                if(t1 === '11:21') return 1;
                if(t1 === '11:22') return 4;
                return -1;
            });
            constraintResolver.initialize(timeFunctionsMock,
                                          mockFetchStations(stationCodes),
                                          {
                                              seekCombination: seekCombination
                                          },
                                          originalAjaxFunction);
            constraintResolver.resolveDates(trip, originalDate, 'departure');
            

            function getStationCode(str) {
                return stationCodes[str];
            }
            
            var callback = constraintResolver.makeResolveConstraintButtonCallback(trip, 1, 'next', minimumConnectionTime)(); // And call it

            // Act
            
            // Assert
        });

    });


});
