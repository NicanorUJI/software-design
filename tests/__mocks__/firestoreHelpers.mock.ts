type Doc = Record<string, any> & { id?: string };
type ColName = string;

const db: Record<ColName, Record<string, Doc>> = {};

function ensureCol(name: string) {
  if (!db[name]) db[name] = {};
  return db[name];
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// Firestore references
export const collection = (_db: any, name: string) => ({ __type: 'collection', name });
export const doc = (_db: any, name: string, id: string) => ({ __type: 'doc', name, id });

export const col = (name: string) => collection(null, name);
export const ref = (name: string, id: string) => doc(null, name, id);

// query helpers
export const orderBy = (field: string, dir: 'asc' | 'desc' = 'asc') => ({ __orderBy: { field, dir } });
export const limit = (n: number) => ({ __limit: n });
export const query = (c: any, ...ops: any[]) => ({ __type: 'query', col: c, ops });

export const addDoc = async (c: any, data: Doc) => {
  const id = genId();
  const colStore = ensureCol(c.name);
  colStore[id] = { ...data, id };
  return { id };
};

export const getDocs = async (q: any) => {
  const c = q.__type === 'query' ? q.col : q;
  const colStore = Object.values(ensureCol(c.name));

  // apply orderBy
  let rows = [...colStore];
  const opOrder = q.__type === 'query' ? q.ops.find((o: any) => o.__orderBy) : null;
  if (opOrder) {
    const { field, dir } = opOrder.__orderBy;
    rows.sort((a: any, b: any) => {
      const va = a[field]; const vb = b[field];
      return (va === vb ? 0 : va < vb ? -1 : 1) * (dir === 'asc' ? 1 : -1);
    });
  }
  const opLimit = q.__type === 'query' ? q.ops.find((o: any) => o.__limit !== undefined) : null;
  if (opLimit) rows = rows.slice(0, opLimit.__limit);

  return {
    docs: rows.map((d: any) => ({ id: d.id, data: () => ({ ...d }) })),
  };
};

export const deleteDoc = async (r: any) => {
  const colStore = ensureCol(r.name);
  delete colStore[r.id];
};

export const updateDoc = async (r: any, patch: Doc) => {
  const colStore = ensureCol(r.name);
  colStore[r.id] = { ...(colStore[r.id] || {}), ...patch };
};

export const setDoc = async (r: any, data: Doc) => {
  const colStore = ensureCol(r.name);
  colStore[r.id] = { ...data, id: r.id };
};

export const getDoc = async (r: any) => {
  const colStore = ensureCol(r.name);
  const row = colStore[r.id];
  return {
    exists: () => !!row,
    data: () => ({ ...row }),
    id: r.id,
  };
};

export const nowServer = () => Date.now();
export const addDocAlias = addDoc;
