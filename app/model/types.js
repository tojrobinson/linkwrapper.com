module.exports = {
   url: {
      type: String,
      max: 250
   },
   display: {
      type: String,
      max: 20
   },
   name: {
      type: String,
      max: 100
   },
   stringField: {
      type: String,
      max: 100
   },
   email: {
      type: String,
      max: 100,
      pattern: /.*@.*\..*/
   },
   bool: [true, false]
};
