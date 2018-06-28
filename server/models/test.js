'use strict';

module.exports = function(Test) {
  Test.run = function(from, to, cb) {
    const times = 110;
    let updated = times;
    let cbCalled = false;
    let ps = [];
    for (let i = times; i > 0; i--) {
      // Test.findById(from)
      //   .then(fromUser => {
      //     if (fromUser.amount > 0) {
      //       fromUser.amount--;
      //     } else {
      //       throw new Error('not enough money');
      //     }
      //     return fromUser.save();
      //   })
      //   .then(fromUser => {
      //     console.log('from:', fromUser.amount);
      //     return Test.findById(to);
      //   })
      //   .then(toUser => {
      //     toUser.amount++;
      //     return toUser.save();
      //   })
      //   .then(toUser => {
      //     console.log('to:', toUser.amount);
      //     console.log('updated:', updated--);
      //     if (updated == 0) {
      //       return (null, null);
      //     }
      //   })
      //   .catch(err => {
      //     if (!cbCalled) {
      //       cbCalled = true;
      //       return err;
      //     } else {
      //       console.log(err);
      //     }
      //   });
      // try {
      //   await Test.app.dataSources.db.transaction(async models => {
      //     console.log('transaction begin');

      //     const { Test } = models;

      //     Test.findById(from)
      //       .then(fromUser => {
      //         if (fromUser.amount > 0) {
      //           fromUser.amount--;
      //         } else {
      //           throw new Error('not enough money');
      //         }
      //         return fromUser.save();
      //       })
      //       .then(fromUser => {
      //         console.log('from:', fromUser.amount);
      //         return Test.findById(to);
      //       })
      //       .then(toUser => {
      //         toUser.amount++;
      //         return toUser.save();
      //       })
      //       .then(toUser => {
      //         console.log('to:', toUser.amount);
      //         console.log('updated:', updated--);
      //         if (updated == 0) {
      //           return (null, null);
      //         }
      //       })
      //       .catch(err => {
      //         if (!cbCalled) {
      //           cbCalled = true;
      //           return err;
      //         } else {
      //           console.log(err);
      //         }
      //       });
      //   });
      // } catch (e) {
      //   console.log(e);
      // } finally {
      //   console.log('transaction end');
      // }
      // Test.beginTransaction({ isolationLevel: Test.Transaction.SERIALIZABLE, timeout: 30000 }, function(err, tx) {
      //   if (err) {
      //     if (!cbCalled) {
      //       cbCalled = true;
      //       return cb(err);
      //     } else {
      //       console.log(err);
      //     }
      //   }

      //   tx.observe('timeout', function(context, next) {
      //     console.log('tx timeout:', i);
      //     next();
      //   });

      //   let options = { transaction: tx };

      //   Test.findById(from, null, options)
      //     .then(fromUser => {
      //       console.log('fromUser:', fromUser);
      //       if (fromUser.amount <= 0) {
      //         throw new Error('not enough money');
      //       }
      //       return fromUser.updateAttributes({ amount: fromUser.amount - 1 }, options);
      //     })
      //     .then(fromUser => {
      //       console.log('from:', fromUser.amount);
      //       return Test.findById(to, null, options);
      //     })
      //     .then(toUser => {
      //       return toUser.updateAttributes({ amount: toUser.amount + 1 }, options);
      //     })
      //     .then(toUser => {
      //       tx.commit().then(() => {
      //       }).catch(err => { throw err; });

      //       console.log('to:', toUser.amount);
      //       console.log('updated:', updated--);
      //       if (updated == 0) {
      //         cb(null, null);
      //       }
      //     })
      //     .catch(err => {
      //       tx.rollback().catch(err => { console.log(err); });

      //       if (!cbCalled) {
      //         cbCalled = true;
      //         cb(err);
      //       } else {
      //         console.log(err);
      //       }
      //     });
      // });
      Test.doTransfer(from, to);
    }
    cb();
  };

  let sucCount = 0;

  Test.doTransfer = function(from, to) {
    let tx, fromUser, toUser;
    let cbCalled = false;
    return Promise.all([Test.findById(from), Test.findById(to)])
      .then(res => {
        [fromUser, toUser] = res;

        // console.log('fromUser:', fromUser);
        // console.log('toUser:', toUser);

        if (!fromUser || !toUser) {
          throw new Error('from or to id invalid');
        }

        if (fromUser.amount <= 0) {
          throw new Error('not enough money');
        }

        return Test.beginTransaction({ isolationLevel: Test.Transaction.READ_COMMIT, timeout: 30000 });
      })
      .then(t => {
        tx = t;
        let options = { transaction: tx };

        return Promise.all([
          Test.updateAll({ amount: fromUser.amount, id: fromUser.id }, { amount: fromUser.amount - 1 }, options),
          Test.updateAll({ amount: toUser.amount, id: toUser.id }, { amount: toUser.amount + 1 }, options),
        ]);
      })
      .then(res => {
        let [fromInfo, toInfo] = res;
        console.log('updated:', fromInfo.count, toInfo.count);
        if (fromInfo.count !== 1 || toInfo.count !== 1) {
          let e = new Error('update faild');
          e.retry = true;
          throw e;
        }

        if (tx) {
          return tx.commit();
        }

        console.log('success:', sucCount++);

        //   return Test.findById(to);
        // })
        // .then(toUser => {
        //   return Test.updateAll({ amount: toUser.amount, id: toUser.id }, { amount: toUser.amount + 1 });
        // })
        // .then(info => {
        //   console.log('updated to:', info.count);
        //   if (info.count !== 1) {
        //     let e = new Error('update faild');
        //     e.retry = true;
        //     throw e;
        //   }

        //   return Test.findById(to);

        //   console.log('to:', toUser.amount);
        //   console.log('updated:', updated--);
        //   if (updated == 0) {
        //     cb(null, null);
        //   }
      })
      .catch(err => {
        if (tx) {
          tx.rollback().catch(err => { console.log(err); });
        }

        if (err.retry) {
          console.log('retrying...');
          setTimeout(Test.doTransfer, 100, from, to);
        }

        console.log(err);
      });
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
