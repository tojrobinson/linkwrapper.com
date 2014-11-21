var test = require('tape');
var util = require('r/public/js/util');

test('Testing util.uniqueNames', function(t) {
   t.plan(4);

   var set = ['one', 'two', 'three', 'four', 'five'];
   var notSet = ['one', 'two', 'one', 'two', 'one'];
   var keySet = [{id: 'abc', name: 'one'},
                 {id: 'def', name: 'two'},
                 {id: 'hijklmnop', name: 'three'},
                 {id: 'ABC', name: 'four'},
                 {id: 'qrstuvw', name: 'five'},
                 {id: 'xyz', name: 'six'}];
   var notKeySet = [{id: '234', name: 'one'},
                    {id: '129', name: 'two'},
                    {id: '919', name: 'three'},
                    {id: '921', name: 'four'},
                    {id: '9h9', name: 'five'},
                    {id: '9z9', name: 'six'},
                    {id: '234', name: 'seven'}];

   t.equal(util.uniqueNames(set), true);
   t.equal(util.uniqueNames(notSet), false);
   t.equal(util.uniqueNames(keySet, 'id'), false);
   t.equal(util.uniqueNames(notKeySet, 'id'), false);
});
