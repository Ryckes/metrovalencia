
;(function(exports) {

    var storage;

    var Promise = require('bluebird');

    function initialize(storageLocal) {
        storage = storageLocal;
    }

    function get(id) {
        return new Promise(function(resolve, reject) {
            storage.get('history', function(entry) {
                restoreDates(entry['history'][id].setup);
                resolve(entry['history'][id].setup);
            });
        });
    }
    
    function getLast(num) {
        return new Promise(function(resolve, reject) {
            storage.get('history', function(hist) {
                hist = hist.history;

                var entries = [];

                for(var i in hist) {
                    if(hist.hasOwnProperty(i) && i !== 'nextKey') {
                        entries.push(hist[i]);
                    }
                }

                entries.map(function(entry, i) {
                    entry.setup.id = i;
                    return entry;
                });

                entries.sort(function(e1, e2) {
                    return e1.searchDate < e2.searchDate;
                });

                resolve(entries
                        .map(function(entry) {
                            return entry.setup;
                        })
                        .slice(0, num)
                        .map(restoreDates));
            });
        });
    }

    function restoreDates(trip) {
        for(var step in trip) {
            if(trip.hasOwnProperty(step)) {
                trip[step].arrivalDate = new Date(trip[step].arrivalDate);
                trip[step].departureDate = new Date(trip[step].departureDate);
            }
        }

        return trip; // For chaining

    }

    function copyStep(step) {
        var newStep = {};
        for(var prop in step) {
            if(step.hasOwnProperty(prop)) {
                var attr = step[prop];
                if(attr instanceof Date) attr = attr.getTime();
                newStep[prop] = attr;
            }
        }

        return newStep;
    }

    function copyTrip(trip) {
        var newTrip = [];
        for(var numStep in trip) {
            if(trip.hasOwnProperty(numStep)) {
                newTrip.push(copyStep(trip[numStep]));
            }
        }

        return newTrip;
    }

    function store(setup) {
        var toBeStored = {};
        toBeStored.setup = copyTrip(setup);
        toBeStored.searchDate = new Date().getTime();

        storage.get('history', function(obj) {
            var nextKey;
            if(!obj || !obj.history || !obj.history.nextKey) {
                obj = {};
                obj.history = {};
                obj.history.nextKey = 0;
            }

            nextKey = obj.history.nextKey++;
            
            obj.history[nextKey] = toBeStored;

            storage.set(obj);
        });
    }

    exports.initialize = initialize;
    exports.get = get;
    exports.getLast = getLast;
    exports.store = store;
    
}(typeof exports === 'undefined'? this : exports));
