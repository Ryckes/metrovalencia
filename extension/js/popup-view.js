
;(function(exports) {

    var document,
        timeFunctions;

    function initialize(timeFunctionsLocal, documentLocal) {
        timeFunctions = timeFunctionsLocal;
        document = documentLocal;
    }


    function selectOriginStation(identifier) {
	document.$originSelector.find('option[value=' + identifier + ']').prop('selected', 'selected');
    }

    function selectDestinationStation(identifier) {
	document.$destinationSelector.find('option[value=' + identifier + ']').prop('selected', 'selected');
    }

    function setDesiredTime(date) {
        var minutes = date.getMinutes();
        if(minutes < 10) minutes = "0" + minutes;
        
        document.$desiredTimeInput.val(date.getHours() + ':' + minutes);
    }

    function setDesiredDate(date) {
        document.$desiredDateInput.val(timeFunctions.getDateString(date));
    }
    
    function initializeForm() {
	var date = new Date(new Date().getTime() + 60*60*1000); // 1 hour from now is the default

	setDesiredTime(date);
        setDesiredDate(date);
    }

    function retrieveInputDate() {
        var time = document.$desiredTimeInput.val().split(":"),
            date = document.$desiredDateInput.val().split("/"),
            hours = time[0],
            minutes = time[1],
            day = date[0],
            month = date[1],
            year = date[2];

        return new Date(year, month - 1, day, hours, minutes, 0, 0);
    }

    function bindButtons() {

        function timeChanger(offset) {
            return function() {
                var date = retrieveInputDate();
                date = new Date(date.getTime() + offset);

                setDesiredTime(date);
                setDesiredDate(date);
            };
        }
        
        $('#increaseTimeButton').click(timeChanger(60*1000)); // 1 minute
        $('#decreaseTimeButton').click(timeChanger(-60*1000));
        $('#increaseDateButton').click(timeChanger(24*60*60*1000)); // 1 day
        $('#decreaseDateButton').click(timeChanger(-24*60*60*1000));
    }

    function getDOM() {
        // With this we can mock the DOM
        if(document) return document;
        
        return {
            $originSelector: $('#fromStation'),
            $destinationSelector: $('#toStation'),

            $desiredTimeInput: $('#timeInput'),
            $desiredDateInput: $('#dateInput'),

            $submitForm: $('#submitForm'),

            $history: $('#history'),

            addToHistoryList: function(html) {
                $('#history ul').append(html);
            }
        };
    }
    
    function getFeedback(trip) {

        if(trip.length === 0)
            return 'No hay ninguna combinación de metros que permita realizar este trayecto.';


        return '';
    }

    function addStationOption(id, name) {
        var html = '<option value="' + id + '">' + name + '</option>';
		        
	document.$originSelector.append(html);
	document.$destinationSelector.append(html);
    }

    function onFormSubmit(cb) {
        document.$submitForm.click(cb);
    }

    function getSelectedOrigin() {
        return $('#fromStation :selected').val();
    }

    function getSelectedDestination() {
        return $('#toStation :selected').val();
    }

    function getSelectedTimeType() {
        return $('#arrivalOrDeparture :selected').val();
    }

    function renderStep(step, num) {
        var output = '';
        output += '<div class="step" data-num="' + num + '">';

        if(step.findAnotherTrainButton)
            output += '<button class="findAnotherTrainButton" data-step="' + num + '" data-type="' + step.findAnotherTrainButton + '">Buscar tren ' + ((step.findAnotherTrainButton === 'next')?'siguiente':'anterior') + '</button><br />';
        
        output += '<span class="time">' + step.departureTime + '</span> ' + step.departureStation;
        output += '<br />';
        output += '<span class="time">' + step.arrivalTime + '</span> ' + step.arrivalStation;
        output += '</div>';

        return output;
    }

    function displayFeedback(html) {
        $('#formOutput').html(html);
    }

    function displayTrip(trip) {
        var tripDepartureTime = trip[0].departureTime,
            tripArrivalTime = trip[trip.length-1].arrivalTime,
            output = 'El tren sale a las ' + tripDepartureTime + ' y llega a las ' + tripArrivalTime + '.<br />';
        
        for(var numStep in trip) {
            if(!trip.hasOwnProperty(numStep)) continue;

            output += '<br />';
            output += renderStep(trip[numStep], numStep);
        }

        displayFeedback(output);
    }

    function bindClick(pattern, cb) {
        $(pattern).click(cb);
    }

    function addHistoryEntry(entry) {
        console.log('adding');
        var from = entry[0].departureStation;
        var to = entry[entry.length-1].arrivalStation;

        var timeString = timeFunctions.getTimeString(entry[0].departureDate) + '-' + timeFunctions.getTimeString(entry[entry.length-1].arrivalDate);

        document.addToHistoryList('<li><a data-id="' + entry.id + '" href="">' + from + ' - ' + to + ' (' + timeString + ')' + '</a></li>');
    }

    function onHistoryEntryClick(cb) {
        $('#history a').click(cb);
    }

    function showHistoryList() {
        document.$history.show();
    }

    exports.initialize = initialize;

    exports.addHistoryEntry = addHistoryEntry;
    exports.addStationOption = addStationOption;
    exports.bindButtons = bindButtons;
    exports.bindClick = bindClick;
    exports.displayFeedback = displayFeedback;
    exports.displayTrip = displayTrip;
    exports.initializeForm = initializeForm;
    exports.getDOM = getDOM;
    exports.getFeedback = getFeedback;
    exports.getSelectedOrigin = getSelectedOrigin;
    exports.getSelectedDestination = getSelectedDestination;
    exports.getSelectedTimeType = getSelectedTimeType;
    exports.onFormSubmit = onFormSubmit;
    exports.onHistoryEntryClick = onHistoryEntryClick;
    exports.renderStep = renderStep;
    exports.retrieveInputDate = retrieveInputDate;
    exports.selectOriginStation = selectOriginStation;
    exports.selectDestinationStation = selectDestinationStation;
    exports.showHistoryList = showHistoryList;
    
}(typeof exports === 'undefined'? this : exports));
