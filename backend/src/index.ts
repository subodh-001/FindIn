import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth';
import reportRoutes from './routes/reports';
import commentRoutes from './routes/comments';
import { connectToDatabase } from './config/mongo';
import { backgroundJobService } from './services/backgroundJobs';
import verificationRoutes from './routes/verification';
import inviteRoutes from './routes/invites';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const corsOrigin = process.env.CORS_ORIGIN;

app.use(
  cors({
    origin: corsOrigin ? corsOrigin.split(',') : '*',
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.get('/', (_req, res) => {
  res.json({
    service: 'FindIn backend API',
    status: 'online',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      reports: '/api/reports',
      comments: '/api/comments',
    },
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/invites', inviteRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function bootstrap() {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI is not defined');
    }

    await connectToDatabase(uri);
    backgroundJobService.start();

    app.listen(port, () => {
      console.log(`[server] listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('[server] failed to start', error);
    process.exit(1);
  }
}

bootstrap();

