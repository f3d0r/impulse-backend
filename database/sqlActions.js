const db = require('./db');

module.exports = {
  insert: {
    addObject: (database, jsonObject, successCB, failCB) => {
      db.getConnection((err, connection) => {
        connection.query(
          `INSERT INTO ${connection.escapeId(database)} SET ?`,
          jsonObject,
          (error, results) => {
            connection.release();
            if (error) failCB(error);
            else successCB(results);
          }
        );
      });
    }
  },
  remove: {
    regularDelete: (database, keys, values, successCB, failCB) => {
      db.getConnection((err, connection) => {
        let sql = `DELETE FROM ${connection.escapeId(database)} WHERE `;
        if (keys.length !== values.length) return failCB('Key length must match value length.');
        for (let index = 0; index < keys.length; index += 1) {
          if (index < keys.length - 1) sql += `\`${keys[index]}\` = ? AND `;
          else sql += `\`${keys[index]}\` = ?`;
        }
        connection.query(sql, values, (error, rows) => {
          connection.release();
          if (error) failCB(error);
          else successCB(rows);
        });
        return true;
      });
    }
  },
  select: {
    regularSelect(
      database,
      selection,
      keys,
      operators,
      values,
      numResults,
      successCB,
      noneFoundCB,
      failCB
    ) {
      db.getConnection((err, connection) => {
        let sql = 'SELECT ';
        if (selection == null || selection === '*') {
          sql += '*';
        } else {
          sql += `${selection[0]} `;
          for (let index = 1; index < selection.length; index += 1) {
            sql += `, ${selection[index]}`;
          }
        }
        sql += ` FROM ${connection.escapeId(database)} WHERE `;
        if (keys.length !== operators.length || operators.length !== values.length)
          return failCB('Key length must match value length.');
        for (let index = 0; index < keys.length; index += 1) {
          if (index < keys.length - 1) sql += `\`${keys[index]}\` ${operators[index]} ? AND `;
          else sql += `\`${keys[index]}\` ${operators[index]} ?`;
        }
        connection.query(sql, values, (error, rows) => {
          connection.release();
          if (error) failCB(error);
          else if (numResults == null) successCB(rows);
          else if (numResults != null && rows.length === 0) noneFoundCB();
          else successCB(rows);
        });
        return true;
      });
    }
  }
};
