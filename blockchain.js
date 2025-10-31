const crypto = require('crypto');

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data; // academic record payload
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    const str = this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash;
    return crypto.createHash('sha256').update(str).digest('hex');
  }
}

class Blockchain {
  constructor(blocks = []) {
    if (blocks.length) {
      this.chain = blocks.map(b => Object.assign(new Block(), b));
    } else {
      this.chain = [this.createGenesisBlock()];
    }
  }

  createGenesisBlock() {
    return new Block(0, Date.now().toString(), { info: 'Genesis Block' }, '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data) {
    const index = this.chain.length;
    const timestamp = Date.now().toString();
    const previousHash = this.getLatestBlock().hash;
    const block = new Block(index, timestamp, data, previousHash);
    this.chain.push(block);
    return block;
  }

  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const prev = this.chain[i - 1];
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== prev.hash) return false;
    }
    return true;
  }

  findRecordById(id) {
    return this.chain.find(b => b.data && b.data.id === id);
  }
}

module.exports = { Block, Blockchain };
