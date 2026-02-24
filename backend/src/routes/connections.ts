import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { encrypt, decrypt } from '../middleware/crypto';
import Connection from '../models/Connection';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const connections = await Connection.find({ userId: req.userId });
    const sanitized = connections.map((c) => ({
      id: c._id,
      name: c.name,
      host: c.host,
      port: c.port,
      user: c.user,
      database: c.database,
      createdAt: c.createdAt,
    }));
    res.json({ connections: sanitized });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, host, port, user, password, database } = req.body;
    if (!name || !host || !user || !password) {
      res.status(400).json({ error: 'name, host, user, and password are required' });
      return;
    }
    const conn = await Connection.create({
      userId: req.userId,
      name,
      host,
      port: port || 3306,
      user,
      password: encrypt(password),
      database: database || undefined,
    });
    res.status(201).json({
      connection: {
        id: conn._id,
        name: conn.name,
        host: conn.host,
        port: conn.port,
        user: conn.user,
        database: conn.database,
        createdAt: conn.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await Connection.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { decrypt };
export default router;
