import { Router, Response } from 'express';
import mysql2, { PoolOptions } from 'mysql2/promise';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { decrypt } from '../middleware/crypto';
import Connection from '../models/Connection';

const router = Router();
router.use(authMiddleware);

async function getConnectionConfig(body: any, userId: string): Promise<PoolOptions> {
  if (body.connectionId) {
    const saved = await Connection.findOne({ _id: body.connectionId, userId });
    if (!saved) throw new Error('Connection not found');
    return {
      host: saved.host,
      port: saved.port,
      user: saved.user,
      password: decrypt(saved.password),
      database: body.database || saved.database || undefined,
      connectTimeout: 10000,
    };
  }
  return {
    host: body.host,
    port: body.port || 3306,
    user: body.user,
    password: body.password,
    database: body.database || undefined,
    connectTimeout: 10000,
  };
}

async function withConnection<T>(
  config: PoolOptions,
  fn: (conn: mysql2.Connection) => Promise<T>
): Promise<T> {
  const conn = await mysql2.createConnection(config);
  try {
    return await fn(conn);
  } finally {
    await conn.end().catch(() => {});
  }
}

router.post('/test', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await getConnectionConfig(req.body, req.userId!);
    await withConnection(config, async (conn) => {
      await conn.query('SELECT 1');
    });
    res.json({ success: true, message: 'Connection successful' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/databases', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await getConnectionConfig(req.body, req.userId!);
    config.database = undefined;
    const databases = await withConnection(config, async (conn) => {
      const [rows] = await conn.query('SHOW DATABASES');
      return (rows as any[]).map((r) => r.Database);
    });
    res.json({ databases });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/tables', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await getConnectionConfig(req.body, req.userId!);
    const database = req.body.database;
    if (!database) {
      res.status(400).json({ error: 'database is required' });
      return;
    }
    config.database = database;
    const tables = await withConnection(config, async (conn) => {
      const [rows] = await conn.query('SHOW TABLES');
      return (rows as any[]).map((r) => Object.values(r)[0] as string);
    });
    res.json({ tables });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/table-structure', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await getConnectionConfig(req.body, req.userId!);
    const { database, table } = req.body;
    if (!database || !table) {
      res.status(400).json({ error: 'database and table are required' });
      return;
    }
    config.database = database;
    const columns = await withConnection(config, async (conn) => {
      const [rows] = await conn.query(`DESCRIBE ${conn.escapeId(table)}`);
      return rows;
    });
    res.json({ columns });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/table-data', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await getConnectionConfig(req.body, req.userId!);
    const { database, table, filters, limit = 100, offset = 0 } = req.body;
    if (!database || !table) {
      res.status(400).json({ error: 'database and table are required' });
      return;
    }
    config.database = database;

    const result = await withConnection(config, async (conn) => {
      const whereParts: string[] = [];
      const values: any[] = [];
      if (filters && typeof filters === 'object') {
        for (const [col, val] of Object.entries(filters)) {
          if (val !== '' && val !== null && val !== undefined) {
            whereParts.push(`${conn.escapeId(col)} LIKE ?`);
            values.push(`%${val}%`);
          }
        }
      }
      const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
      const safeLimit = Math.min(Number(limit) || 100, 1000);
      const safeOffset = Number(offset) || 0;

      const [rows] = await conn.query(
        `SELECT * FROM ${conn.escapeId(table)} ${whereClause} LIMIT ? OFFSET ?`,
        [...values, safeLimit, safeOffset]
      );
      const [countResult] = await conn.query(
        `SELECT COUNT(*) as total FROM ${conn.escapeId(table)} ${whereClause}`,
        values
      );
      const total = (countResult as any[])[0].total;
      return { rows, total };
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/query', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await getConnectionConfig(req.body, req.userId!);
    const { database, sql } = req.body;
    if (!sql) {
      res.status(400).json({ error: 'sql is required' });
      return;
    }
    if (database) config.database = database;

    const startTime = Date.now();
    const result = await withConnection(config, async (conn) => {
      const [rows, fields] = await conn.query(sql);
      return { rows, fields };
    });
    const executionTime = Date.now() - startTime;

    if (Array.isArray(result.rows)) {
      res.json({
        rows: result.rows,
        fields: result.fields,
        rowCount: result.rows.length,
        executionTime,
      });
    } else {
      const info = result.rows as mysql2.ResultSetHeader;
      res.json({
        affectedRows: info.affectedRows,
        insertId: info.insertId,
        executionTime,
        message: `Query OK, ${info.affectedRows} row(s) affected`,
      });
    }
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
