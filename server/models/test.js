'use strict';

module.exports = function(Test) {
  Test.run = function(from, to, cb) {
    const times = 110;
    let updated = times;
    let cbCalled = false;
    for (let i = times; i >= 0; i--) {
      Test.findById(from)
        .then(fromUser => {
          if (fromUser.amount > 0) {
            fromUser.amount--;
          } else {
            throw new Error('not enough money');
          }
          return fromUser.save();
        })
        .then(fromUser => {
          console.log('from:', fromUser.amount);
          return Test.findById(to);
        })
        .then(toUser => {
          toUser.amount++;
          return toUser.save();
        })
        .then(toUser => {
          console.log('to:', toUser.amount);
          console.log('updated:', updated--);
          if (updated == 0) {
            cb(null, null);
          }
        })
        .catch(err => {
          if (!cbCalled) {
            cbCalled = true;
            cb(err);
          } else {
            console.log(err);
          }
        });
    }
  };

  Test.remoteMethod('run', {
    http: {
      path: '/run',
    },
    verb: 'post',
    accepts: [
      { arg: 'from', type: 'number', required: true, description: 'Id' },
      { arg: 'to', type: 'number', required: true, description: 'Id' },
    ],
    returns: { root: true },
  });

  Test.afterRemote('find', function(context, instances, next) {
    if (Array.isArray(instances)) {
      instances.forEach(i => {
        i.test = i.id + 100;
      });
    } else {
      instances.test = instances.id + 100;
    }
    next();
  });
};
