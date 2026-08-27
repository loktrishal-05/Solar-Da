import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes.js';
import { store } from './store.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api', router);

app.listen(PORT, () => {
  console.log(`=================================================================`);
  console.log(`  🌱 TerraSub & Solar-Da v3 Platform API Server Running on port ${PORT}`);
  console.log(`  Mode: ${store.mode} | Safety Interlocks: ACTIVE | E-Stop: ${store.eStopActive}`);
  console.log(`=================================================================`);
});
