import { MongoClient, Db } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

type Role = 'Admin' | 'General User';
type Level = 'Alpha (Public)' | 'Beta (Internal)' | 'Omega (Full)';

interface UserDoc { id: string; name: string; role: Role; accessLevel: Level; status: 'Active' | 'Suspended'; passwordHash: string; createdAt: string; }
interface Candidate { id: string; name: string; role: string; aadhaar: string; phone: string; score: number; stage: number; }
interface RecordDoc { id: string; title: string; level: 'Public' | 'Internal' | 'Confidential'; status: 'Decrypted' | 'Encrypted'; size: string; candidateId: string; }

let dbPromise: Promise<Db> | null = null;

async function getDb(): Promise<Db | null> {
  const uri = process.env['MONGODB_URI'];
  if (!uri) return null;
  if (!dbPromise) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    dbPromise = client.connect().then(c => c.db(process.env['MONGODB_DB'] || 'trustvault'));
  }
  return dbPromise;
}

async function ensureSeed(db: Db | null): Promise<void> {
  if (!db) return;
  
  const usersCol = db.collection<UserDoc>('users');
  if (await usersCol.countDocuments() === 0) {
    const adminHash = await bcrypt.hash('admin', 10);
    const userHash = await bcrypt.hash('priya', 10);
    await usersCol.insertMany([
      { id: 'admin', name: 'Alex Admin', role: 'Admin', accessLevel: 'Omega (Full)', status: 'Active', passwordHash: adminHash, createdAt: new Date().toISOString() },
      { id: 'priya', name: 'Priya Sharma', role: 'General User', accessLevel: 'Beta (Internal)', status: 'Active', passwordHash: userHash, createdAt: new Date().toISOString() }
    ]);
  }

  const candCol = db.collection<Candidate>('candidates');
  if (await candCol.countDocuments() === 0) {
    await candCol.insertMany([
      { id: 'C-101', name: 'Ananya Rao', role: 'Backend Engineer', aadhaar: '[Aadhaar Redacted]', phone: '+91 98765 43210', score: 96, stage: 3 },
      { id: 'C-102', name: 'Rohit Verma', role: 'DevOps Engineer', aadhaar: '[Aadhaar Redacted]', phone: '+91 91234 56780', score: 88, stage: 2 },
      { id: 'C-103', name: 'Sneha Kulkarni', role: 'QA Analyst', aadhaar: '[Aadhaar Redacted]', phone: '+91 99887 76655', score: 79, stage: 1 },
      { id: 'C-104', name: 'Arjun Mehta', role: 'Security Analyst', aadhaar: '[Aadhaar Redacted]', phone: '+91 90000 11122', score: 91, stage: 0 }
    ]);
  }

  const recCol = db.collection<RecordDoc>('records');
  if (await recCol.countDocuments() === 0) {
    await recCol.insertMany([
      { id: 'REC-77A1', title: 'Public Protocol Guidelines', level: 'Public', status: 'Decrypted', size: '1.2 MB', candidateId: 'C-101' },
      { id: 'REC-77B2', title: 'System Architecture Map', level: 'Internal', status: 'Decrypted', size: '14.5 MB', candidateId: 'C-102' },
      { id: 'REC-88D4', title: 'Quantum Encryption Keys', level: 'Confidential', status: 'Encrypted', size: '0.5 KB', candidateId: 'C-104' }
    ]);
  }
}

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const secret = () => process.env['JWT_SECRET'] || 'trustvault-demo-change-me';

function authToken(req: Request): { id: string; role: Role } | null {
  const h = req.headers.get('authorization') || '';
  if (!h.startsWith('Bearer ')) return null;
  try { return jwt.verify(h.slice(7), secret()) as { id: string; role: Role }; } catch { return null; }
}

export default async (req: Request) => {
  try {
    const url = new URL(req.url); 
    const path = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
    const db = await getDb();
    
    if (!db) return response({ message: 'Database connection missing. Configure MONGODB_URI.' }, 500);
    await ensureSeed(db);

    if (path === '/auth/login' && req.method === 'POST') {
      const b = await req.json();
      const u = await db.collection<UserDoc>('users').findOne({ id: String(b.userId || '').toLowerCase() });
      if (!u || u.status !== 'Active' || u.role !== b.role || !(await bcrypt.compare(String(b.password || ''), u.passwordHash))) {
        return response({ message: 'Invalid credentials or suspended account.' }, 401);
      }
      const mfaToken = jwt.sign({ type: 'mfa', id: u.id, role: u.role }, secret(), { expiresIn: '5m' });
      const { passwordHash, ...safeUser } = u;
      return response({ mfaToken, user: safeUser, otpDemo: '123456', expiresInSeconds: 300 });
    }

    if (path === '/auth/mfa' && req.method === 'POST') {
      const b = await req.json();
      if (String(b.otp) !== '123456') return response({ message: 'Invalid demo OTP.' }, 401);
      try {
        const p = jwt.verify(String(b.mfaToken), secret()) as { type: string; id: string; role: Role };
        const u = await db.collection<UserDoc>('users').findOne({ id: p.id });
        if (!u || u.status !== 'Active') throw new Error();
        const token = jwt.sign({ id: u.id, role: u.role }, secret(), { expiresIn: '2h' });
        const { passwordHash, ...safeUser } = u;
        return response({ token, user: safeUser });
      } catch {
        return response({ message: 'MFA session expired.' }, 401);
      }
    }

    const auth = authToken(req);
    if (!auth) return response({ message: 'Unauthorized' }, 401);

    if (path === '/candidates' && req.method === 'GET') {
      const candidates = await db.collection<Candidate>('candidates').find().sort({ id: 1 }).toArray();
      return response(candidates.map(c => ({
        ...c,
        aadhaar: auth.role === 'Admin' ? c.aadhaar : '[Aadhaar Redacted]',
        phone: auth.role === 'Admin' ? c.phone : 'XXX-XXX-' + c.phone.slice(-4)
      })));
    }

    if (path === '/records' && req.method === 'GET') {
      const records = await db.collection<RecordDoc>('records').find().sort({ id: 1 }).toArray();
      return response(records.map(r => 
        auth.role === 'Admin' ? { ...r, status: 'Decrypted' } : 
        r.level === 'Confidential' ? { ...r, title: '████████ [ENCRYPTED]', status: 'Locked', size: '---' } : r
      ));
    }

    const stageMatch = path.match(/^\/candidates\/([^/]+)\/stage$/);
    if (stageMatch && req.method === 'PUT') {
      if (auth.role !== 'Admin') return response({ message: 'Admin access required.' }, 403);
      const b = await req.json();
      await db.collection('candidates').updateOne({ id: stageMatch[1] }, { $set: { stage: Number(b.stage) } });
      return response({ ok: true });
    }

    if (path === '/audit/stream' && req.method === 'GET') {
      if (auth.role !== 'Admin') return response({ message: 'Admin access required.' }, 403);
      const events = ['AUTH_SUCCESS', 'DATA_READ', 'AUTH_FAIL', 'FIREWALL_BLOCK'];
      const out = [];
      const base = Date.UTC(2026, 9, 1);
      for (let i = 0; i < 10000; i++) {
        out.push({
          i, time: new Date(base + i * 37000).toISOString().replace('T', ' ').slice(0, 19),
          evt: events[i % events.length], user: 'admin', ip: '192.168.1.104'
        });
      }
      return response(out);
    }

    if (path === '/users' && req.method === 'GET') {
      if (auth.role !== 'Admin') return response({ message: 'Admin access required.' }, 403);
      const usersList = await db.collection<UserDoc>('users').find({}, { projection: { passwordHash: 0 } }).sort({ id: 1 }).toArray();
      return response(usersList);
    }

    return response({ message: 'Not found' }, 404);
  } catch (e) {
    return response({ message: 'Server error.', error: String(e) }, 500);
  }
};
