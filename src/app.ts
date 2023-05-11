import express, { Express } from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { router as routes } from './routes/index';

import dotenv from 'dotenv';

dotenv.config();
const app: Express = express();
const port = process.env.PORT || 8001;

app.use(express.json());
app.use(cors());
app.use('/', routes);

// Start the servern
app.listen(port, (): void => {
  console.log(`App running on port ${port}!`);
});
module.exports.handler = serverless(app);
