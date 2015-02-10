
var popup = require('./popup'),
    fetchStations = require('./fetch-stations'),
    config = require('./config'),
    constraintResolver = require('./constraint-resolver'),
    combinationSeeker = require('./combination-seeker'),
    timeFunctions = require('./timefunctions'),
    view = require('./popup-view'),
    history = require('./history'),
    ajaxMethod = $.ajax;


$(document).ready(function() {

    // Resolve dependencies
    history.initialize(chrome.storage.sync);
    combinationSeeker.initialize(ajaxMethod);
    constraintResolver.initialize(timeFunctions, fetchStations, combinationSeeker, ajaxMethod);
    view.initialize(timeFunctions, view.getDOM());

    popup.initialize(fetchStations, config, constraintResolver,
                     combinationSeeker, timeFunctions, view,
                     history);
    popup.start();

});
