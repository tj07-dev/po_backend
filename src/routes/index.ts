import express, { Request, Response } from 'express';
import {
  EvDataCreate,
  getAllPO,
  getDetails,
  getEvFiles,
  podetails,
  updateDetails,
  xlDataInsert,
  xlDownloadAllData,
} from '../controllers';
import { upload } from '../utils/uploadPdf';
const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.send('Backend Server is running...');
});

//routes for Home Page in frontend

//insert Po details
router.post('/poDetails', upload, podetails);

//routes for RaiseDMR
router.get('/getAllItems', getAllPO);

router.get('/getdetails/:id', getDetails);

router.patch('/poDetails/:id', updateDetails);

//routes for EVC
router.get('/getEvFiles', getEvFiles);

router.get('/xlData/:data', xlDownloadAllData);

router.post('/xlData', xlDataInsert);

router.post('/evDataCreate', upload, EvDataCreate);

export { router };
