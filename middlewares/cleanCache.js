const { clearHash } = require('../services/cache')

// clear cache hash automatically when new blog is created
module.exports = async (req, res, next) => {
  await next(); // excute handler function first
  clearHash(req.user.id);
}