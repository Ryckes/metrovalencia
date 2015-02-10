

suite('View', function() {

    var chai = require('chai'),
        assert = chai.assert,
        Promise = require('bluebird'),
        DOMParser = require('xmldom').DOMParser;

    var view = require('../extension/js/popup-view');

    var timeFunctionsMock,
        documentMock;

    setup(function() {

        timeFunctionsMock = {};
        
        documentMock = {
            addToHistoryList: function() {}
        };
        
    });

    function mockDependencies() {
        view.initialize(timeFunctionsMock, documentMock);
    }

    suite('.renderHistoryEntry()', function() {

        test('should add a data-id attribute to the history entry', function(done) {
            // Arrange
            var entry = [{
                departureStation: 'Here',
                arrivalStation: 'There'
            }];
            entry.id = 5;
            documentMock.addToHistoryList = function(entry) {
                var parser = new DOMParser();
                var dom = parser.parseFromString(entry);
                assert.equal(dom.getElementsByTagName('a')[0].getAttribute('data-id'), 5);
                done();
            };
            mockDependencies();
            
            // Act
            view.addHistoryEntry(entry);
            
            // Assert
            
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
