import React, { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API || 'http://localhost:5000/api';

function Auth({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');

  async function submit(e) {
    e.preventDefault();
    const res = await fetch(`${API}/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const j = await res.json();
    if (j.token) {
      localStorage.setItem('token', j.token);
      onAuth(j.token);
    } else {
      alert(j.error || 'auth failed');
    }
  }

  return (
    <div style={{maxWidth:400, margin:'40px auto'}}>
      <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
      <form onSubmit={submit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" required style={{width:'100%',padding:8,marginBottom:8}}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="password" required style={{width:'100%',padding:8,marginBottom:8}}/>
        <button type="submit" style={{padding:8}}>{mode}</button>
      </form>
      <button onClick={()=>setMode(mode==='login'?'register':'login')} style={{marginTop:8}}>
        Switch to {mode==='login'?'register':'login'}
      </button>
    </div>
  );
}

function AddRecord({ token, onAdded }) {
  const [studentName, setStudentName] = useState('');
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [grade, setGrade] = useState('');
  const [date, setDate] = useState('');

  async function submit(e) {
    e.preventDefault();
    const res = await fetch(`${API}/records/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer '+token },
      body: JSON.stringify({ studentName, institution, degree, grade, date })
    });
    const j = await res.json();
    if (j.block) {
      alert('Record added to ledger (index: ' + j.block.index + ')');
      onAdded();
    } else alert(j.error || 'failed');
  }

  return (
    <form onSubmit={submit} style={{marginBottom:20}}>
      <h3>Add Academic Record</h3>
      <input placeholder="Student Name" value={studentName} onChange={e=>setStudentName(e.target.value)} required style={{width:'100%',padding:8,marginBottom:8}}/>
      <input placeholder="Institution" value={institution} onChange={e=>setInstitution(e.target.value)} required style={{width:'100%',padding:8,marginBottom:8}}/>
      <input placeholder="Degree" value={degree} onChange={e=>setDegree(e.target.value)} required style={{width:'100%',padding:8,marginBottom:8}}/>
      <input placeholder="Grade (optional)" value={grade} onChange={e=>setGrade(e.target.value)} style={{width:'100%',padding:8,marginBottom:8}}/>
      <input placeholder="Date (ISO) optional" value={date} onChange={e=>setDate(e.target.value)} style={{width:'100%',padding:8,marginBottom:8}}/>
      <button type="submit">Add Record</button>
    </form>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [records, setRecords] = useState([]);
  const [valid, setValid] = useState(null);

  useEffect(()=>{ if (token) fetchList(); }, [token]);

  async function fetchList() {
    const res = await fetch(`${API}/records/list`, { headers: { Authorization: 'Bearer '+token }});
    const j = await res.json();
    setRecords(j.records || []);
  }

  async function verify() {
    const res = await fetch(`${API}/records/verify`, { headers: { Authorization: 'Bearer '+token }});
    const j = await res.json();
    setValid(j.valid);
    alert('Ledger valid: ' + j.valid);
  }

  if (!token) return <Auth onAuth={t=>setToken(t)} />;

  return (
    <div style={{maxWidth:900, margin:'20px auto', padding:20}}>
      <h1>Block Ledger — Academic Records</h1>
      <button onClick={()=>{ localStorage.removeItem('token'); setToken(''); }}>Logout</button>
      <AddRecord token={token} onAdded={fetchList} />
      <div style={{marginBottom:20}}>
        <button onClick={verify}>Verify Ledger Integrity</button>
        {valid !== null && <span style={{marginLeft:8}}>Valid: {String(valid)}</span>}
      </div>
      <h3>Ledger Records</h3>
      <ol>
        {records.map(r => (
          <li key={r.index} style={{marginBottom:12}}>
            <strong>Index #{r.index}</strong> — {new Date(parseInt(r.timestamp)).toLocaleString()}<br/>
            <em>Hash:</em> {r.hash}<br/>
            <em>Previous:</em> {r.previousHash}<br/>
            <pre style={{background:'#f6f6f6',padding:8}}>{JSON.stringify(r.data, null, 2)}</pre>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default App;
