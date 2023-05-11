import { Request, Response } from 'express';
import {
  getAllPOItems,
  getDetailsWithID,
  insert,
  updatePOData,
} from '../services';
import { WorkBook } from 'sheetjs-style';
import { UpdateDetails } from '../types';
import {
  getEvFile,
  insertXlSData,
  nevEVCreate,
  xldownload,
} from '../services/EVCal';

export const podetails = async (req: Request, res: Response) => {
  try {
    const details = JSON.parse(req.body.details);
    if (req.file) {
      // console.log("yo",details)

      insert(details, req.file);
      res.status(200).json({ msg: 'Created Successfully' });
    } else {
      res.status(404).json({ msg: 'Not Created' });
    }
  } catch (err) {
    // console.log(err, 'Podetails Function');
    const error = (err as Error).message;
    res.json(error);
  }
};

export const getAllPO = async (req: Request, res: Response) => {
  try {
    const data = await getAllPOItems();
    // console.log(req, 'event');

    if (data) {
      res.status(200).send(data.Items);
    } else {
      res.status(404);
    }
  } catch (err) {
    console.log(err, 'Podetails Function');
    res.send({ msg: 'something went wrong' });
  }
};

export const getDetails = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id;
    const data = await getDetailsWithID(id);
    if (data) {
      res.status(200).send(data.Item);
    } else {
      res.status(404);
    }
  } catch (err) {
    res.send({ msg: 'something went wrong' });
  }
};

export const getEvFiles = async (req: Request, res: Response) => {
  try {
    const data = (await getEvFile()) as string[];
    // res.send(data);
    if ((data.length as number) > 0) {
      res.status(200).send(data);
    } else {
      res.status(404).send({ message: 'No project file found!' });
    }
  } catch (error) {
    console.log('Error getting directory information:', error);
    res.send({ message: `Error getting directory information. ${error}` });
  }
};

export const updateDetails = async (req: Request, res: Response) => {
  try {
    const id: string = req.params.id;
    const data: UpdateDetails[] = req.body;
    updatePOData(id, data);
    res.status(200).send('Updated successfully.');
  } catch (err) {
    res.status(404).json({ msg: 'something went wrong' });
  }
};
//EVCal
export const xlDownloadAllData = async (req: Request, res: Response) => {
  try {
    const projectName: string = req.params.data;

    const data = await xldownload(projectName);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${projectName}.xlsx`,
    );
    res.setHeader(
      'Content-type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(data.Body);
    res.status(200);
  } catch (err) {
    res.json({ msg: 'File Not Found' });
  }
};

export const xlDataInsert = async (req: Request, res: Response) => {
  try {
    const data = req.body.data;
    const projectName: string = req.body.project;
    await insertXlSData(data, projectName);
    res.status(200).send('EV Data inserted successfully.');
  } catch (err) {
    console.log(err);
    res.json({ msg: 'File Not Found' });
  }
};
export const EvDataCreate = async (req: Request, res: Response) => {
  try {
    console.log(req.body.project);
    const project = req.body.project;
    if (req.file) {
      // console.log("yo",details)

      nevEVCreate(req.file, project);
      res.status(200).send('EV Data Created successfully.');
    }

    // console.log(req.body);
  } catch (err) {
    console.log(err);
    res.json({ msg: 'EV data file not created.' });
  }
};
