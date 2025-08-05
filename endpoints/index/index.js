const { createHandler } = require('@app-core/server');
const { Error } = require('mongoose');
const { appError } = require('../../services/utils/reqline');
const reqlineService = require('../../services/index');

module.exports = createHandler({
  path: '/',
  method: 'post',
  async handler(rc, helpers) {
    const { reqline } = rc.body;
    console.log(reqline);
    try {
      const response = await reqlineService(reqline);
      if (response.error) throw response;
      return {
        status: 200,
        data: response,
      };
    } catch (error) {
      console.log(error);
      return {
        status: 400,
        data: error,
      };
    }
  },
});
