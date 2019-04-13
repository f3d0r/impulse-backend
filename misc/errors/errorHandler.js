const ERROR_CODES = require('./errorCodes');

function getErrorJSONTemp(error, resContent, missingParameter) {
  const res = {
    res_info: {
      code: ERROR_CODES[error].RESPONSE_CODE,
      code_info: error
    }
  };
  const code = ERROR_CODES[error].HTTP_CODE;
  if (error === 'MISSING_PARAMETER') res.res_info.missing_parameter = missingParameter;
  else if (typeof resContent !== 'undefined' && resContent != null) res.res_content = resContent;
  return {
    code,
    res
  };
}

function defaultQueryMissingCallback(res, foundQueries, missingQueries) {
  res
    .status(422)
    .send(getErrorJSONTemp('MISSING_PARAMETER', null, `${missingQueries[0]} query required`).res);
}

module.exports = {
  checkQueries(req, res, queryList, successCB, failCB = defaultQueryMissingCallback) {
    const foundQueries = [];
    queryList.forEach(currentQuery => {
      if (typeof req.query[currentQuery] !== 'undefined' && req.query[currentQuery] !== null)
        foundQueries.push(currentQuery);
    });
    if (queryList.length - foundQueries.length !== 0) {
      const missingQueries = queryList.filter(x => !foundQueries.includes(x));
      failCB(res, foundQueries, missingQueries);
    } else {
      successCB();
    }
  },
  getErrorCode(error) {
    try {
      return ERROR_CODES[error.res_info.code_info].HTTP_CODE;
    } catch (e) {
      return 500;
    }
  },
  getResponseJSON(error, extraJSON) {
    return getErrorJSONTemp(error, extraJSON);
  }
};
