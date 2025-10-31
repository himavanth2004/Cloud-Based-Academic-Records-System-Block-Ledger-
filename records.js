const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { Blockchain } = require('../blockchain');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const dbFile = process.env.DATABASE_FILE || './data/blockledger.sqlite';
const db = new sqlite3.Database(dbFile);

// initialize blocks table to persist chain
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_json TEXT
  )`);
  // ensure there's at least genesis stored
  db.get('SELECT COUNT(*) as c FROM blocks', (err, row) => {
    if (!err && row && row.c === 0) {
      const genesis = new (require('../blockchain').Blockchain)();
      db.run('INSERT INTO blocks (block_json) VALUES (?)', [JSON.stringify(genesis.chain[0])]);
    }
  });
});

// load chain from DB
function loadChainFromDB() {
  return new Promise((resolve, reject) => {
    db.all('SELECT block_json FROM blocks ORDER BY id ASC', (err, rows) => {
      if (err) return reject(err);
      const blocks = rows.map(r => JSON.parse(r.block_json));
      resolve(new Blockchain(blocks));
    });
  });
}

// persist block to DB
function persistBlock(block) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO blocks (block_json) VALUES (?)', [JSON.stringify(block)], function(err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
}

// simple auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'unauthorized' });
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({ error: 'invalid token' });
  }
}

// add a new academic record to the chain
router.post('/add', auth, async (req, res) => {
  const { studentName, institution, degree, grade, date } = req.body;
  if (!studentName || !institution || !degree) return res.status(400).json({ error: 'missing fields' });

  try {
    const chain = await loadChainFromDB();
    const record = {
      id: uuidv4(),
      studentName,
      institution,
      degree,
      grade: grade || null,
      date: date || new Date().toISOString(),
      issuer: req.user.email
    };
    const block = chain.addBlock(record);
    await persistBlock(block);
    res.json({ block });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to add record' });
  }
});

// list all records (blocks) - lightweight view
router.get('/list', auth, async (req, res) => {
  try {
    const chain = await loadChainFromDB();
    const records = chain.chain.map(b => ({ index: b.index, hash: b.hash, previousHash: b.previousHash, timestamp: b.timestamp, data: b.data }));
    res.json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to load records' });
  }
});

// verify chain integrity
router.get('/verify', auth, async (req, res) => {
  try {
    const chain = await loadChainFromDB();
    const ok = chain.isValid();
    res.json({ valid: ok });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'verification failed' });
  }
});

// find record by id
router.get('/record/:id', auth, async (req, res) => {
  try {
    const chain = await loadChainFromDB();
    const rec = chain.findRecordById(req.params.id);
    if (!rec) return res.status(404).json({ error: 'not found' });
    res.json({ block: rec });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'lookup failed' });
  }
});

module.exports = router;
