const { CostExplorer } = require('aws-sdk');
const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

// adding our own method to toggle caching as needed
mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true; 
  this.hashKey = JSON.stringify(options.key || '');

  return this; // so other methods can be chained to it later on
}
mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }


  // CREATE A UNIQUE REDIS KEY
  // Object.assign() - safely copy properties from one object to another
  const key = JSON.stringify(Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name
  }));

  // see if we have a value for 'key' in redis
  const cacheValue = await client.hget(this.hashKey, key);

  // if we do, return that
  if (cacheValue) {
    const doc = JSON.parse(cacheValue);
    
    // converting the cached object to a mongoose document
    return Array.isArray(doc)
    ? doc.map(d => new this.model(d))
    : new this.model(doc);
  }
  // otherwise, issue the query and store the result in redis
  const result = await exec.apply(this, arguments);
  // client.set(key, JSON.stringify(result), 'EX', 10);
  client.hset(this.hashKey, key, JSON.stringify(result));
  
  return result;
}

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
}