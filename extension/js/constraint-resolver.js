
module.exports = (function(){

    var fetchStationsModule,
        timeFunctions,
        combinationSeeker,
        ajaxMethod;

    function makeResolveConstraintButtonCallback(originalTrip, numStep, buttonType, minimumConnectionTime) {
        return function() {
            return findAnotherTrain(originalTrip, numStep, buttonType, minimumConnectionTime, ajaxMethod)
                .then(function(newSteps) {
                    var tripCopy;
                    if(buttonType === 'next') {
                        tripCopy = originalTrip.slice(0, numStep);
                        tripCopy.push.apply(tripCopy, newSteps);
                    }
                    else if(buttonType === 'previous') {
                        newSteps.push.apply(newSteps, originalTrip.slice(numStep + 1));
                        tripCopy = newSteps;
                    }

                    return tripCopy;
                });
        };
    }

    function findAnotherTrain(steps, numStep, whichTrain, minimumConnectionTime) {
        var step,
            newDate, newDepartureStation,
            newArrivalStation, newDepartureStationCode,
            newArrivalStationCode, timeType;

        if(whichTrain === 'next') {
            step = steps[numStep - 1];
            newDate = new Date(step.arrivalDate.getTime() + minimumConnectionTime*60*1000);
            newDepartureStation = step.arrivalStation;
            newArrivalStation = steps[steps.length-1].arrivalStation;

            timeType = 'departure';
        }
        else if(whichTrain === 'previous') {
            step = steps[numStep + 1];
            newDate = new Date(step.departureDate.getTime() - minimumConnectionTime*60*1000);
            newDepartureStation = steps[0].departureStation;
            newArrivalStation = step.departureStation;

            timeType = 'arrival';
        }
        newDepartureStationCode = fetchStationsModule.getStationCode(newDepartureStation);
        newArrivalStationCode = fetchStationsModule.getStationCode(newArrivalStation);

        var newDateString = timeFunctions.getDateString(newDate);
        var newTimeString = timeFunctions.getTimeString(newDate);
        
        return combinationSeeker.seekCombination(newDepartureStationCode, newArrivalStationCode, newDateString, newTimeString, timeType, ajaxMethod);
    }

    function resolveDates(steps, desiredDate, timeType) {
        // TODO Long as f*ck, refactor if tested, test if untested

        var currentDate, lastTimeStr, step, numStep,
            departureTime, arrivalTime, interval;

        if(timeType === 'departure') {

            currentDate = new Date(desiredDate);

            for(numStep in steps) {
                if(!steps.hasOwnProperty(numStep)) continue;
                
                step = steps[numStep];

                if(numStep == 0)
                    lastTimeStr = timeFunctions.getTimeString(desiredDate);
                else
                    lastTimeStr = steps[numStep-1].arrivalTime;
                
                departureTime = step.departureTime;
                interval = timeFunctions.computeTimeDifference(lastTimeStr, departureTime);
                if(interval < 0)
                    currentDate.setDate(currentDate.getDate() + 1);

                currentDate.setHours(departureTime.split(":")[0]);
                currentDate.setMinutes(departureTime.split(":")[1]);

                step.departureDate = new Date(currentDate);

                arrivalTime = step.arrivalTime;
                interval = timeFunctions.computeTimeDifference(departureTime, arrivalTime);

                if(interval < 0)
                    currentDate.setDate(currentDate.getDate() + 1);

                currentDate.setHours(arrivalTime.split(":")[0]);
                currentDate.setMinutes(arrivalTime.split(":")[1]);
                
                step.arrivalDate = new Date(currentDate);
            }
        }
        else if(timeType === 'arrival') {

            currentDate = new Date(desiredDate);

            for(numStep = steps.length-1; numStep >= 0; numStep--) {
                step = steps[numStep];

                if(numStep === steps.length-1)
                    lastTimeStr = timeFunctions.getTimeString(desiredDate);
                else
                    lastTimeStr = steps[numStep+1].departureTime;

                arrivalTime = step.arrivalTime;
                interval = timeFunctions.computeTimeDifference(arrivalTime, lastTimeStr);

                if(interval < 0)
                    currentDate.setDate(currentDate.getDate() - 1);

                currentDate.setHours(arrivalTime.split(":")[0]);
                currentDate.setMinutes(arrivalTime.split(":")[1]);
                
                step.arrivalDate = new Date(currentDate);

                departureTime = step.departureTime;
                interval = timeFunctions.computeTimeDifference(departureTime, lastTimeStr);
                if(interval < 0)
                    currentDate.setDate(currentDate.getDate() - 1);

                currentDate.setHours(departureTime.split(":")[0]);
                currentDate.setMinutes(departureTime.split(":")[1]);

                step.departureDate = new Date(currentDate);
            }

        }

    }

    function resolveTimeConstraints(trip, timeType, threshold) {

        var lastTime = null;
        for(var step in trip) {
            if(trip.hasOwnProperty(step)) {
                trip[step].findAnotherTrainButton = null;

                if(lastTime !== null) {
                    var connectionTime = timeFunctions.computeTimeDifference(lastTime, trip[step].departureTime);

                    if(connectionTime < 0) {
                        // Add to fkin date
                        connectionTime += 24*60;
                    }

                    if(connectionTime < threshold) {
                        if(timeType === 'arrival') {
                            trip[step-1].findAnotherTrainButton = 'previous';
                        }
                        else if(timeType === 'departure') {
                            trip[step].findAnotherTrainButton = 'next';
                        }
                    }
                }
                // else: first step, no connection
                lastTime = trip[step].arrivalTime;
            }
        }
    }

    return {
        initialize: function(timeFunctionsLocal, fetchStationsModuleLocal, combinationSeekerLocal, ajaxMethodLocal) {
            timeFunctions = timeFunctionsLocal;
            fetchStationsModule = fetchStationsModuleLocal;
            combinationSeeker = combinationSeekerLocal;
            ajaxMethod = ajaxMethodLocal;
        },
        findAnotherTrain: findAnotherTrain,
        makeResolveConstraintButtonCallback: makeResolveConstraintButtonCallback,
        resolveDates: resolveDates,
        resolveTimeConstraints: resolveTimeConstraints
    };

}());