

suite('View', function() {

    var chai = require('chai'),
        assert = chai.assert,
        Promise = require('bluebird'),
        DOMParser = require('xmldom').DOMParser;

    var view = require('../extension/js/popup-view');
    var timeFunctions = require('../extension/js/timefunctions.js');

    var documentMock;

    setup(function() {

        documentMock = {
            addToHistoryList: function() {}
        };
        
    });

    function mockDependencies() {
        view.initialize(timeFunctions, documentMock);
    }

    suite('.renderHistoryEntry()', function() {

        test('should add a data-id attribute to the history entry', function(done) {
            // Arrange
            var entry = [{
                departureStation: 'Here',
                departureDate: new Date(),
                arrivalStation: 'There',
                arrivalDate: new Date()
            }];
            entry.id = 5;
            
            documentMock.addToHistoryList = function(entry) {
                var parser = new DOMParser();
                var dom = parser.parseFromString(entry);
                
                // Assert
                assert.equal(dom.getElementsByTagName('a')[0].getAttribute('data-id'), 5);
                done();
            };
            mockDependencies();
            
            // Act
            view.addHistoryEntry(entry);
        });

        test('should show the right time range in each history entry', function(done) {
            // Arrange
            var entry = [{
                departureStation: 'Here',
                departureDate: new Date(),
                arrivalStation: 'There',
                arrivalDate: new Date(new Date().getTime() + 253000),
                time: new Date()
            }];

            var timeStr = timeFunctions.getTimeString(entry[0].departureDate) + '-' + timeFunctions.getTimeString(entry[entry.length-1].arrivalDate);
            
            documentMock.addToHistoryList = function(entry) {
                var parser = new DOMParser();
                var dom = parser.parseFromString(entry);
                var innerText = dom.getElementsByTagName('a')[0].childNodes[0].nodeValue;
                
                // Assert
                assert.include(innerText, timeStr);
                done();
            };
            mockDependencies();
            
            // Act
            view.addHistoryEntry(entry);
        });

        test('should throw an error if no time is provided for the first entry', function() {
            // Arrange
            var entry = [{
                departureStation: 'Here',
                arrivalStation: 'There'
            }];
            
            // Assert
            assert.throws(function() {
                // Act
                view.addHistoryEntry(entry);
            }, Error);
        });

    });

    suite('.showHistoryList()', function() {

        test('should be a function', function() {
            // Arrange
            
            
            // Act
            
            
            // Assert
            assert.equal(typeof view.showHistoryList, 'function');
        });

        
    });


    
});
