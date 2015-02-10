
var $minimumConnectionTimeInput,
    $minimumConnectionTimeDisplay,
    fetchStations = require('./fetch-stations').fetchStations,
    config = require('./config');

function setStatus(str) {
    $('#statusOutput').text(str);
    
    setTimeout(clearStatus, 2000);
}

function clearStatus() {
    $('#statusOutput').text('');
}

function getDisabled(callback) {
    chrome.storage.sync.get('disabledStations', function (data) {
	var disabled = data.disabledStations || [];
	callback(disabled);
    });
}

function setDisabled(newDisabled) {
    chrome.storage.sync.set({disabledStations: newDisabled});
}

function fillLists() {
    fetchStations()
        .then(function(stations) {
	    var i, station,
	        html, opt,
	        opt2,
	        $container = $('#stationCheckboxesContainer'),
	        $fromFav = $('#fromFavSelect'),
	        $toFav = $('#toFavSelect');

	    for(i = 0; i < stations.length; i++) {
	        station = stations[i];
	        
	        html = '<input class="stationCheckbox" type="checkbox" value="' + station.i + '"';

	        if(!station.disabled) {
		    html += ' checked';

		    opt = '<option value="' + station.i + '"';
		    opt2 = '>' + station.n + '</option>';

		    if(station.fromFav) {
		        $fromFav.append(opt + ' selected' + opt2);
		    }
		    else {
		        $fromFav.append(opt + opt2);
		    }
		    
		    if(station.toFav) {
		        $toFav.append(opt + ' selected' + opt2);
		    }
		    else {
		        $toFav.append(opt + opt2);
		    }
	        }
	        
	        html += '>' + station.n + '<br />';
	        
	        $container.append(html);
	    }
        });
}

function checkAll() {
    $('#stationCheckboxesContainer input').prop('checked', 'checked');
}

function uncheckAll() {
    $('#stationCheckboxesContainer input').prop('checked', false);
}

function saveOptions() {
    var disabled = [];
    $('#stationCheckboxesContainer input:not(:checked)').each(function() {
	disabled.push($(this).val());
    });
    
    setDisabled(disabled);

    chrome.storage.sync.set({
	fromFav: $('#fromFavSelect :selected').val(),
	toFav: $('#toFavSelect :selected').val()
    });
    
    setStatus('Cambios guardados.');

    config.set('minimumConnectionTime', getMinimumConnectionTime());
}

function cancelSelection() {
    getDisabled(function(disabled) {
	checkAll();
	$('#stationCheckboxesContainer input').each(function() {
	    if(disabled.indexOf($(this).val()) !== -1) {
		$(this).prop('checked', false);
	    }
	});
    });

    config.get('minimumConnectionTime', function(time) {
        $minimumConnectionTimeInput.val(time);
        displayMinimumConnectionTime(time);
    });
}

function displayMinimumConnectionTime(val) {
    $minimumConnectionTimeDisplay.text(val);
}

function getMinimumConnectionTime() {
    return $minimumConnectionTimeInput.val();
}

$(document).ready(function() {
    fillLists();
    
    $('#checkAllButton').click(checkAll);
    $('#uncheckAllButton').click(uncheckAll);
    
    $('#cancelButton').click(cancelSelection);
    $('#saveButton').click(saveOptions);

    $minimumConnectionTimeInput = $('#minimumConnectionTimeInput');
    $minimumConnectionTimeDisplay = $('#minimumConnectionTimeDisplay');

    $minimumConnectionTimeInput.on('input', function() {
        displayMinimumConnectionTime($(this).val());
    });

    config.get('minimumConnectionTime', function(time) {
        $minimumConnectionTimeInput.val(time);
        displayMinimumConnectionTime(time);
    });
});