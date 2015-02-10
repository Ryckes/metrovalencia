module.exports = (function() {

    var stationToCodeMap = {};

    function buildStationToCodeMap(map) {
        stationToCodeMap = {};
        for(var i in map) {
            if(map.hasOwnProperty(i))
                stationToCodeMap[map[i].n] = map[i].i;
        }
    }

    function fetchStations() {

        return new Promise(function(resolve, reject) {
            
            chrome.storage.sync.get(['stations', 'disabledStations', 'fromFav', 'toFav'], function(data) {

	        var disabled = data.disabledStations || [];

	        if(data.stations) {
                    buildStationToCodeMap(data.stations);
	            resolve(checkSpecials(data.stations, disabled, data.fromFav, data.toFav));
	            return;
	        }
	        
	        $.ajax('http://www.metrovalencia.es/planificador.php', {
	            error: function() {
		        console.error('Error en la conexión a www.metrovalencia.es. Prueba de nuevo más adelante por favor.');
	            },
	            success: function(data, status, xhr) {
		        var regexp = /name="origen" id="origen">[^<]*((<option[^<]+<\/option>[^<]*)+)<\/select>/im,
                            results = data.match(regexp),
                            optionsStr = results[1];

		        var optionRegexp = /<option value="(\d+)">([^<]+)<\/option>/img,
                            optionsResult,
		            station,
		            stations = [];

		        while((optionsResult = optionRegexp.exec(optionsStr))) {
		            station = {
			        n: optionsResult[2],
			        i: optionsResult[1]
		            };

		            stations.push(station);
		        }

                        buildStationToCodeMap(stations);
		        chrome.storage.sync.set({stations: stations});
		        resolve(checkSpecials(stations, disabled, data.fromFav, data.toFav));
	            }
	        });
            });
        });
    }

    function checkSpecials(stations, disabled, fromFav, toFav) {
        var i, id;

        for(i = 0; i < stations.length; i++) {
	    id = stations[i].i;
	    
	    if(disabled.indexOf(id) !== -1) {
	        stations[i].disabled = true;
	    }

	    if(id === fromFav) {
	        stations[i].fromFav = true;
	    }

	    if(id === toFav) {
	        stations[i].toFav = true;
	    }
        }

        return stations;
    }

    function getStationCode(station) {
        return stationToCodeMap[station];
    }

    return {
        fetchStations: fetchStations,
        getStationCode: getStationCode
    };
}());