'use strict';
const argv = require('minimist')(process.argv.slice(2));

const predicate = (block) => {
    let result = true;
    result &= !argv.unlocked || block.unlocked;
    result &= !argv.locked || !block.unlocked;
    result &= !argv['pay-ready'] || block.pay_ready;
    result &= !argv.valid || block.valid;
    return result;
};

require('../init_mini.js').init(function () {
    let txn = global.database.env.beginTxn({ readOnly: true });

    let cursor = new global.database.lmdb.Cursor(txn, global.database.altblockDB);
    let count = 0;
    let total = 0;
    let totalReward = 0;
    for (let found = cursor.goToFirst(); found; found = cursor.goToNext()) {
        cursor.getCurrentBinary(function (key, data) {
            // jshint ignore:line
            try {
                let block = global.protos.AltBlock.decode(data);
                if (predicate(block)) {
                    console.log(key + ': ' + JSON.stringify(block));
                    count += 1;
                    totalReward += block.value;
                }
                total += 1;
            } catch (e) {
                console.error(`Failed to decode ${key}`);
                console.error(e);
            }
        });
    }
    console.log(`${count} block(s) found (total ${total})`);
    console.log(`Total reward value: ${totalReward}`);
    cursor.close();
    txn.commit();
    process.exit(0);
});
