

suite('History', function() {

    var chai = require('chai'),
        assert = chai.assert;
    
    var storageMock;

    var history = require('../extension/js/history');

    function getFakeStep(num) {
        return {
            arrivalDate: new Date(),
            arrivalStation: 'Wherever',
            departureDate: new Date(20000),
            departureStation: num
        };
    }

    function getFakeTrip(num) {
        num = num || 0;

        return [getFakeStep(num)];
    }

    setup(function() {
        storageMock = (function() {
            var mem = {};

            function getHistory() { // Just for testing
                return mem.history;
            }

            function setHistory(obj) { // Just for testing
                mem.history = obj;
            }

            function set(obj, cb) {
                for(var key in obj) {
                    if(obj.hasOwnProperty(key)) {
                        mem[key] = obj[key];
                    }
                }

                if(typeof cb === 'function')
                    cb();
            }

            function get(key, cb) {
                var returnMem = {};
                returnMem[key] = mem[key];
                cb(returnMem);
            }

            return {
                get: get,
                set: set,
                setHistory: setHistory
            };
        }());
    });

    suite('.get()', function() {

        test('should call storage.get with the correct arguments', function(done) {
            // Arrange
            storageMock.get = function(param) {
                assert.equal(param, 'history');
                done();
            };
            history.initialize(storageMock);
            
            // Act
            history.get(1);
            
            // Assert
            
        });

        test('should return the correct entry', function(done) {
            // Arrange
            var entry = getFakeTrip();
            storageMock.set({
                history: {
                    0: {
                        setup: entry,
                        searchDate: new Date().getTime()
                    },
                    nextKey: 1
                }
            });
            history.initialize(storageMock);
            
            // Act
            history.get(0)
                .then(function(entryLocal) {
                    assert.deepEqual(entryLocal, entry);
                    done();
                });
            
            // Assert
            
        });
    });

    suite('.store()', function() {

        test('should call storage.set with the correct arguments', function(done) {
            // Arrange
            var entry = getFakeTrip();
            storageMock.set = function(obj, cb) {
                var stored = obj.history[obj.history.nextKey-1];
                delete stored.searchDate;
                // Dates must be stored as numbers
                entry[0].departureDate = entry[0].departureDate.getTime();
                entry[0].arrivalDate = entry[0].arrivalDate.getTime();
                assert.deepEqual(stored, {
                    setup: entry
                });
                done();

                if(typeof cb === 'function')
                    cb();
            };
            history.initialize(storageMock);
            
            // Act
            history.store(entry);
            
            // Assert
            
        });

        test('should store only the three most recent entries', function(done) {
            // Arrange
            var entry = getFakeTrip();
            history.initialize(storageMock);

            // Act
            for (var i = 0; i < 5; i++) {
                entry[0].departureStation = i;
                history.store(entry);
            }

            storageMock.get('history', function(mem) {
                assert.isBelow(mem.history.nextKey, 4,
                               'More than 3 entries are stored in history');
                for (var i = 0; i < mem.history.nextKey; i++) {
                    // Referencing .setup here voids encapsulation in
                    // this test Another option is to use
                    // history.getLast(), but I'd rather test just
                    // store() method here
                    assert.isAbove(mem.history[i].setup[0].departureStation, 1,
                                    'The oldest entry is stored in lieu of' +
                                    ' one of the most recent entries');
                }

                done();
            });
        });
    });

    suite('.getLast()', function() {

        test('should return the correct set of entries', function(done) {
            // Arrange
            var hist = {
                0: {
                    setup: getFakeTrip(2),
                    searchDate: new Date(1000)
                },
                1: {
                    setup: getFakeTrip(3),
                    searchDate: new Date(0)
                },
                2: {
                    setup: getFakeTrip(6),
                    searchDate: new Date(2000)
                },
                nextKey: 3
                
            };
            storageMock.setHistory(hist);
            history.initialize(storageMock);
            var expectedSet = [
                hist[2].setup, // Most recent
                hist[0].setup
            ];
            
            // Act
            history.getLast(2)
                .then(function(entries) {
                    assert.deepEqual(entries, expectedSet);
                })
                .then(done, done);
            
            // Assert
            
        });
        
    });

    suite('.store() and .getLast()', function() {

        test('should work when used together in sequence', function(done) {
            // Arrange
            var hist = {
                0: getFakeTrip(1),
                1: getFakeTrip(2),
                2: getFakeTrip(3)
            };
            var expectedSet = [hist[1], hist[2]];
            history.initialize(storageMock);

            // Act
            history.store(hist[0]);
            setTimeout(function() {
                history.store(hist[2]);
                setTimeout(function() {
                    history.store(hist[1]);
                    
                    history.getLast(2)
                        .then(function(entries) {
                            delete entries[0].id;
                            delete entries[1].id;
                            assert.deepEqual(entries, expectedSet);
                        })
                        .then(done, done);
                }, 1);
            }, 1);

            // Assert
            
        });
        
    });


});
