
// THIS IS INTEGRATION, NOT ACCEPTANCE

suite('Main', function() {

    var chai = require('chai'),
        assert = chai.assert,
        Promise = require('bluebird');

    function nullPromise() {
        return new Promise(function() {});
    }

    function thenable(arg) {
        return function() {
            return {
                then: function(cb) {
                    cb(arg);
                }
            };
        };
    }

    function getFakeStation(disabled) {
        disabled = disabled || false;
        return {
            disabled: disabled
        };
    }

    function getFakeHistoryEntry() {
        return {};
    }

    var popup = require('../extension/js/popup');

    var fetchStationsMock,
        configMock,
        constraintResolverMock,
        combinationSeekerMock,
        timeFunctionsMock,
        viewMock,
        historyMock,
        chromeMock,
        eventMock;

    function mockDependencies() {
        popup.initialize(fetchStationsMock, configMock,
                         constraintResolverMock, combinationSeekerMock,
                         timeFunctionsMock, viewMock,
                         historyMock);
    }
        
    setup(function() {

        fetchStationsMock = {

            testParams: {
                fail: false,
                stations: []
            },

            fetchStations: function() {
                // Sync Promise
                return {
                    then: function(resolve, reject) {
                        if(fetchStationsMock.testParams.fail) reject();
                        else resolve(fetchStationsMock.testParams.stations);
                    }
                };
            }
        };

        configMock = {
            getDefault: function() {},
            get: function() {}
        };

        constraintResolverMock = {
            resolveDates: function() {},
            resolveTimeConstraints: function() {}
        };

        combinationSeekerMock = {
            seekCombination: function() {}
        };

        timeFunctionsMock = {
            getDateString: function() { return ''; },
            getTimeString: function() { return ''; }
        };

        viewMock = {
            testParams: {
                document: {

                }
            },

            addHistoryEntry: function() {},
            bindButtons: function() {},
            bindClick: function() {},
            displayFeedback: function() {},
            displayTrip: function() {},
            getDOM: function() { return viewMock.testParams.document; },
            getSelectedOrigin: function() { return ''; },
            getSelectedDestination: function() { return ''; },
            getSelectedTimeType: function() { return ''; },
            initializeForm: function() {},
            onFormSubmit: function() {},
            onHistoryEntryClick: function() {},
            retrieveInputDate: function() { return new Date(); },
            showHistoryList: function() {}
        };

        historyMock = {
            
            testParams: {
                fail: false,
                history: []
            },

            get: thenable(null),
            getLast: function(num) {
                // Sync Promise
                return {
                    then: function(resolve, reject) {
                        if(historyMock.testParams.fail) reject();
                        else resolve(historyMock.testParams.history.slice(num));
                    }
                };

            }
        };

        var storage = (function() {
            var mem = {};

            function set(obj, cb) {
                for(var key in obj) {
                    if(obj.hasOwnProperty(key)) {
                        mem[key] = obj[key];
                    }
                }

                cb();
            }

            function get(key, cb) {
                cb(mem[key]);
            }

            return {
                get: get,
                set: set
            };
        }());
          
        chromeMock = {
            storage: {
                sync: storage,
                local: storage,
                managed: storage
            }
        };

        eventMock = {
            preventDefault: function() {}
        };

    });

    suite('View', function() {

        test('On startup, the form should always be initialized', function(done) {
            // Arrange
            viewMock.initializeForm = done;
            mockDependencies();
            
            // Act
            popup.start();
            
            // Assert
            
        });

        test('On startup, if two stations are fetched, two station options should be added to the form', function(done) {
            // Arrange
            var count = 0;
            viewMock.addStationOption = function() {
                if(++count === 2) done();
            };
            fetchStationsMock.testParams.stations = [
                getFakeStation(),
                getFakeStation()
            ];
            mockDependencies();
            
            // Act
            popup.start();
            
            // Assert
            
        });


    });


    suite('History', function() {

        test('On startup, the popup should ask for the recently searched trips to show a history', function(done) {
            // Arrange
            historyMock.getLast = function() {
                done();

                return nullPromise();
            };
            mockDependencies();
            
            // Act
            popup.start();
            
            // Assert

        });

        test('On startup, if there are no stored searches, view should not add any history entry and showHistoryList should not be called', function() {
            // Arrange
            historyMock.testParams.history = []; // No entries
            viewMock.addHistoryEntry = function() {
                throw new Error('addHistoryEntry() has been called');
            };
            viewMock.showHistoryList = function() {
                throw new Error('showHistoryList() has been called');
            };
            mockDependencies();
            
            // Act
            popup.start();
            
            // Assert

        });

        test('On startup, if there are two stored searches, view should add two history entries and show the history list', function(done) {
            // Arrange
            historyMock.getLast = function() {
                // No Promise, must be sync
                return {
                    then: function(success) {
                        success([getFakeHistoryEntry(),
                                 getFakeHistoryEntry()]); // Two entries
                    }
                };
            };
            var count = 0,
                shown;
            viewMock.addHistoryEntry = function() {
                if(++count === 2 && shown) done();
            };
            viewMock.showHistoryList = function() {
                shown = true;
                if(count === 2) done();
            };
            mockDependencies();

            // Act
            popup.start();
            
            // Assert

        });

        test('On startup, if there is one stored search, view.addHistoryEntry should receive the entry with its id', function(done) {
            // Arrange
            var entryRetrieved = {
                0: 'whatever',
                1: 'other thing'
            };
            historyMock.getLast = function() {
                // No Promise, must be sync
                return {
                    then: function(success) {
                        success({ 6: entryRetrieved });
                    }
                };
            };
            viewMock.addHistoryEntry = function(entry) {
                entryRetrieved.id = 6;
                assert.deepEqual(entryRetrieved, entry);
                done();
            };
            mockDependencies();
            
            // Act
            popup.start();
            
            // Assert
            
        });


        test('if the form is submitted and a trip is correctly returned, a history entry should be saved', function(done) {
            // Arrange
            var clickCallback = null;
            historyMock.store = function(trip) {
                if(trip)
                    done();
            };
            viewMock.onFormSubmit = function(cb) {
                // Store click callback
                clickCallback = cb;
            };

            var tripMock = [{}, {}];
            combinationSeekerMock.seekCombination = function() {
                return {
                    then: function(cb) {
                        cb(tripMock);
                    }
                };
            };
            mockDependencies();

            // Act
            popup.start();
            clickCallback();
            
            // Assert
            
        });

        test('if a history entry of the popup is clicked, no request should be made', function() {
            // Arrange
            var historyEntryClick = null;
            viewMock.onHistoryEntryClick = function(cb) {
                historyEntryClick = cb;
            };
            var historyEntry = {
                attributes: {
                    entryId: 2
                },

                getAttribute: function(key) {
                    return historyEntry.attributes[key];
                }
            };
            historyMock.getLast = thenable([{}, {}]);
            mockDependencies();
            popup.start();
            combinationSeekerMock.seekCombination = function() {
                // Only way to make a request in popup.js
                throw new Error('seekCombination was called when a history entry was clicked');
            };

            // Act
            historyEntryClick.apply(historyEntry, [eventMock]);
            
            // Assert
            
        });

        test('if a history entry of the popup is clicked, displayTrip should be called with the proper parameters', function(done) {
            // Arrange
            var historyEntryClick = null;
            viewMock.onHistoryEntryClick = function(cb) {
                historyEntryClick = cb;
            };
            var historyEntry = {
                attributes: {
                    "data-id": 2
                },

                getAttribute: function(key) {
                    return historyEntry.attributes[key];
                }
            };
            var clickedEntry = ['here', 'there'];

            historyMock.get = function(id) {
                if(id === 2)
                    return {
                        then: function(cb) {
                            cb(clickedEntry);
                        }
                    };

                throw new Error('Wrong argument in call to history.get() in popup.js');
            };
            historyMock.getLast = thenable([{}, {}]);
            mockDependencies();
            popup.start();
            viewMock.displayTrip = function(trip) {
                assert.deepEqual(trip, clickedEntry);
                done();
            };

            // Act
            historyEntryClick.apply(historyEntry, [eventMock]);
            
            // Assert
            
        });

        test('if a history entry of the popup is clicked, the click event should be stopped (preventDefault or return false)', function(done) {
            // Arrange
            var historyEntryClick = null;
            viewMock.onHistoryEntryClick = function(cb) {
                historyEntryClick = cb;
            };
            var historyEntry = {
                attributes: {
                    "data-id": 2
                },

                getAttribute: function(key) {
                    return historyEntry.attributes[key];
                }
            };
            var clickedEntry = {
                whatever: 'here'
            };
            historyMock.get = function(id) {
                if(id === 2)
                    return {
                        then: function(cb) {
                            cb(clickedEntry);
                        }
                    };

                throw new Error('Wrong argument in call to history.get() in popup.js');
            };
            historyMock.getLast = thenable([{}, {}]);
            mockDependencies();
            popup.start();
            eventMock.preventDefault = done;

            // Act
            var returnValue = historyEntryClick.apply(historyEntry, [eventMock]);
            if(returnValue === false) done();
            
            // Assert
            
        });

        test('if a history entry in the popup is clicked, displayTrip should receive the correct trip', function(done) {
            // Arrange
            var historyEntryClick = null;
            viewMock.onHistoryEntryClick = function(cb) {
                historyEntryClick = cb;
            };
            var historyEntry = {
                attributes: {
                    "data-id": 2 // Assumes data-id attribute exists
                },

                getAttribute: function(key) {
                    return historyEntry.attributes[key];
                }
            };
            var clickedEntry = {
                whatever: 'here'
            };
            historyMock.get = function(id) {
                if(id === 2)
                    return {
                        then: function(cb) {
                            cb(clickedEntry);
                        }
                    };

                throw new Error('Wrong argument in call to history.get() in popup.js');
            };
            historyMock.getLast = thenable([{}, {}]);
            viewMock.displayTrip = function(trip) {
                assert.deepEqual(clickedEntry, trip);
                done();
            };
            mockDependencies();
            popup.start();

            // Act
            historyEntryClick.apply(historyEntry, [eventMock]);
            
        });


    });

});