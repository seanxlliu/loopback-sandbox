'use strict';

module.exports = function(app, cb) {
  app.dataSources.mysql.autoupdate(['Test'], cb);
};
