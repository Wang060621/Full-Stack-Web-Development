const db = require('../../database');

const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function onResult(err) {
        if (err) return reject(err);
        return resolve({ id: this.lastID, changes: this.changes });
    });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        return resolve(row);
    });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        return resolve(rows);
    });
});

module.exports = { run, get, all };
