import express from 'express';
import cors from 'cors';
import { router } from './routes.js';
import { agentRouter } from './agent_routes.js';

export const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api', router);
app.use('/api', agentRouter);
