import dotenv from 'dotenv';
import { app } from './app.js';
import { store } from './store.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`=================================================================`);
  console.log(`  🌱 TerraSub & Solar-Da v3 Platform API Server Running on port ${PORT}`);
  console.log(`  Mode: ${store.mode} | Safety Interlocks: ACTIVE | E-Stop: ${store.eStopActive}`);
  console.log(`=================================================================`);
});
