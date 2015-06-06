
;(function(exports) {

    var fetchStationsModule,
        config,
        constraintResolver,
        combinationSeeker,
        timeFunctions,
        view,
        history,
        document;

    var minimumConnectionTime,
        debug = true,
        noPossibleTrip = 'No hay ninguna combinación de metros que permita realizar este trayecto.';

    function log() {
        if(typeof debug !== 'undefined' && debug)
            console.log.apply(console, Array.prototype.slice.call(arguments));
    }

    function bindFindAnotherTrainButtons(trip) {
        view.bindClick('.findAnotherTrainButton', function() {
            constraintResolver.makeResolveConstraintButtonCallback(trip,
                                                                   parseInt(this.getAttribute('data-step'), 10),
                                                                   this.getAttribute('data-type'),
                                                                   minimumConnectionTime)()
                .then(function(newTrip) {
                    view.displayTrip(newTrip);
                    bindFindAnotherTrainButtons(newTrip);
                });
        });

    }

    function submitForm() {
        var fromStation = view.getSelectedOrigin(),
            toStation = view.getSelectedDestination(),
            timeType = view.getSelectedTimeType(),
            date = view.retrieveInputDate();

        combinationSeeker.seekCombination(fromStation, toStation,
                                          timeFunctions.getDateString(date),
                                          timeFunctions.getTimeString(date), timeType)
            .then(function(steps) {
                if(steps.length > 0) {
                    constraintResolver.resolveDates(steps, date, timeType);
                    constraintResolver.resolveTimeConstraints(steps, timeType, minimumConnectionTime);
                    view.displayTrip(steps);
                    bindFindAnotherTrainButtons(steps);

                    history.store(steps);
                }
                else
                    view.displayFeedback(noPossibleTrip);

            }, function() {
                view.displayFeedback(noPossibleTrip);
            });
    }

    exports.initialize = function(fetchStationsModuleLocal, configLocal,
                                  constraintResolverLocal, combinationSeekerLocal,
                                  timeFunctionsLocal, viewLocal,
                                  historyLocal) {
        // Receive module dependencies
        fetchStationsModule = fetchStationsModuleLocal;
        config = configLocal;
        constraintResolver = constraintResolverLocal;
        combinationSeeker = combinationSeekerLocal;
        timeFunctions = timeFunctionsLocal;
        view = viewLocal;
        history = historyLocal;

        document = view.getDOM();

        minimumConnectionTime = config.getDefault('minimumConnectionTime'); // minutes

        config.get('minimumConnectionTime', function(time) {
            minimumConnectionTime = time;
        });

    };

    exports.start = function(){
        view.initializeForm();

        fetchStationsModule.fetchStations()
            .then(function(stations) {
                var fromFav, toFav;
                
	            for(var station in stations) {
                    if(!stations.hasOwnProperty(station)) continue;
                    
                    var stationIsEnabled = !stations[station].disabled,
                        stationIdentifier = stations[station].i,
                        stationName = stations[station].n;

	                if(stations.hasOwnProperty(station) && stationIsEnabled) {
                        view.addStationOption(stationIdentifier, stationName);

		                if(stations[station].fromFav)
		                    fromFav = stationIdentifier;

		                if(stations[station].toFav)
		                    toFav = stationIdentifier;
	                }
	            }

                if(fromFav)
                    view.selectOriginStation(fromFav);

                if(toFav)
                    view.selectDestinationStation(toFav);

                view.onFormSubmit(submitForm);

                view.bindButtons();
            });

        history.getLast(3)
            .then(function(lastSearches) {
                for(var i in lastSearches) {
                    if(lastSearches.hasOwnProperty(i)) {
                        var entry = lastSearches[i];

                        view.addHistoryEntry(entry);
                    }
                }

                if(lastSearches.length > 0) {
                    view.showHistoryList();

                    view.onHistoryEntryClick(function(e) {
                        history.get(this.getAttribute('data-id'))
                            .then(function(trip) {
                                view.displayTrip(trip);
                                bindFindAnotherTrainButtons(trip);
                            });

                        e.preventDefault();
                    });
                }

                
            }, function(e) {

                // Error looking for last searches
                throw new Error('Error retrieving history of search: ' + e);
                
            });
    };
    
    
}(typeof exports === 'undefined'? this : exports));
