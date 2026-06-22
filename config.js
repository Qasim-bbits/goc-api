const mongoose = require('mongoose');
 
// Connection URL
const url = 'mongodb://localhost:27017/connected_goc';
// const url = 'mongodb://fulluser:Park45FullUser5566@35.188.112.0:27017/connected_goc';

module.exports = function(){
  // mongoose.set('useFindAndModify', false);

mongoose.connect(url, {
  useNewUrlParser : true,
  useUnifiedTopology: true,
  // useCreateIndex: true
  
}).then(() => console.log(mongoose.connection.readyState))
}