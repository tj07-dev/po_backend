import {
  WorkSheet,
  utils,
  writeFile,
  WorkBook,
  read,
  write,
} from 'sheetjs-style';
import {
  EmployeeData,
  TypeYearValueCalcutaion,
  TypeYearValueCalcutaion2,
} from '../types';
import path from 'path';
import fs from 'fs';
import { S3 } from 'aws-sdk';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();

export const nevEVCreate = (data: Express.Multer.File, projectName: string) => {
  const params = {
    Bucket: 'evdatafiles',
    Key: `${projectName}.xlsx`,
    Body: data.buffer,

    ContentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`File uploaded successfully to ${data.Location}`);
    }
  });
};

// export const nevEVCreate = (data: WorkBook, projectName: string) => {
//   const wb = utils.book_new();
//   Object.keys(data.Sheets).forEach((sheetName) => {
//     utils.book_append_sheet(wb, data.Sheets[sheetName], sheetName);
//   });

// writeFile(wb, `${path.join(__dirname, '..', 'resources')}/${projectName}.xlsx`);
// };

//services for EVC
export const xldownload = async (projectName: string) => {
  const s3Params = {
    Bucket: 'evdatafiles',
    Key: `${projectName}.xlsx`,
  };

  const data = await s3.getObject(s3Params).promise();
  return data;
};
// export const xldownload = async (projectName: string) => {
//   const wb: WorkBook = readFile(
//     `${path.join(__dirname, '..', 'resources')}/${projectName}.xlsx`,
//     {
//       cellFormula: true,
//       type: 'binary',
//       cellDates: true,
//       cellStyles: true,
//     },
//   );
//   return wb;
// };

export const getEvFile = async (): Promise<string[] | undefined> => {
  try {
    const s3Params: S3.ListObjectsV2Request = {
      Bucket: 'evdatafiles',
    };

    const files: S3.ListObjectsV2Output = await s3
      .listObjectsV2(s3Params)
      .promise();

    // console.log(Object.keys(files), typeof files.Contents );

    const evFiles: string[] = files.Contents?.filter((file) => {
      return file.Key?.endsWith('.xlsx') ?? false;
    }).map((file) => {
      return path.basename(file.Key!, '.xlsx');
    }) as string[];
    // console.log(evFiles);
    // console.log(typeof evFiles);
    return evFiles as string[];
  } catch (error) {
    console.log(error);
  }
};
//joining path of directory
// export const getEvFile = async () => {
//   const filep = path.join(__dirname, '..', 'resources');
//   console.log(__filename, 'file');
//   console.log(__dirname, 'dir');
//   const files = await fs.promises.readdir(filep);
//   const evFiles: string[] = files
//     .filter((file) => {
//       return file.endsWith('.xlsx');
//     })
//     .map((file) => {
//       return file.slice(0, -5);
//     });
//   return evFiles;
// };

export const insertXlSData = async (data: WorkSheet, projectName: string) => {
  console.log(`${projectName}.xlsx`);

  const Params = {
    Bucket: 'evdatafiles',
    Key: `${projectName}.xlsx`,
  };

  const s3Data = await s3.getObject(Params).promise();
  const wb = read(s3Data.Body, {
    type: 'buffer',
    cellFormula: true,
    cellStyles: true,
    cellDates: true,
  });
  // const wb: WorkBook = readFile(
  //   `${path.join(__dirname, '..', 'resources')}/${projectName}.xlsx`,
  //   {
  //     cellFormula: true,
  //     type: 'binary',
  //     cellDates: true,
  //     cellStyles: true,
  //   },
  // );
  const sheetname: string[] = wb.SheetNames;
  const ws: WorkSheet = wb.Sheets['JP-M'];
  const xls = utils.sheet_to_json(ws);
  const secondWorksheetData: WorkSheet = data;
  const mergedDataMap = new Map();
  [xls, secondWorksheetData].map((worksheetData) => {
    worksheetData.map((row: EmployeeData) => {
      const Resource = row['Resource'];
      if (mergedDataMap.has(Resource)) {
        const existingRow = mergedDataMap.get(Resource);
        mergedDataMap.set(Resource, Object.assign(existingRow, row));
      } else {
        mergedDataMap.set(Resource, row);
      }
    });
  });

  const mergedData = Array.from(mergedDataMap.values());
  const newWs: WorkSheet = utils.json_to_sheet(mergedData);
  const newwb: WorkBook = utils.book_new();
  utils.book_append_sheet(newwb, newWs, 'JP-M');
  sheetname.map((sheet) => {
    if (sheet !== 'JP-M') {
      const ws: WorkSheet = wb.Sheets[sheet];
      utils.book_append_sheet(newwb, ws, sheet);
    }
  });
  // writeFile(
  //   newwb,
  //   `${path.join(__dirname, '..', 'resources')}/${projectName}.xlsx`,
  //   {
  //     bookType: 'xlsx',
  //     bookSST: true,
  //     cellStyles: true,
  //   },
  // );
  xlsxSort(projectName, newwb);
};

const xlsxSort = (projectName, newwb) => {
  const workbook: WorkBook = newwb;
  // const workbook: WorkBook = readFile(
  //   `${path.join(__dirname, '..', 'resources')}/${projectName}.xlsx`,
  //   {
  //     cellFormula: true,
  //     type: 'binary',
  //     cellDates: true,
  //     cellStyles: true,
  //   },
  // );
  const sheetName = 'JP-M';

  const worksheet: WorkSheet = workbook.Sheets[sheetName];
  const data: EmployeeData[] = utils.sheet_to_json(worksheet);

  const offshoreSum: Record<string, number> = {};
  const onsiteSum: Record<string, number> = {};

  data.map((row: EmployeeData) => {
    Object.keys(row)
      .slice(2)
      .map((colName) => {
        const cellValue = row[colName];
        const cellValueNum = Number(cellValue);
        const offshore = row['Ofshore'];
        if (offshore === 'Y') {
          if (colName in offshoreSum) {
            offshoreSum[colName] += cellValueNum || 0;
          } else {
            offshoreSum[colName] = cellValueNum || 0;
          }
        } else if (offshore === 'N') {
          if (colName in onsiteSum) {
            onsiteSum[colName] += cellValueNum || 0;
          } else {
            onsiteSum[colName] = cellValueNum || 0;
          }
        }
      });
  });

  //Calculation Offshore
  const YearOffShore: TypeYearValueCalcutaion = {};
  const YearOffShore2: TypeYearValueCalcutaion2 = {};

  const month = Object.keys(offshoreSum);
  month.map((month: string) => {
    const year = month.split('-')[1];
    if (!isNaN(Number(year))) {
      if (!Object.prototype.hasOwnProperty.call(YearOffShore, year)) {
        YearOffShore[year] = [];
      }
      YearOffShore[year].push(`${offshoreSum[month]}`);
    }
  });

  Object.keys(YearOffShore).map((data: string) => {
    const sum = YearOffShore[data].reduce(
      (acc: number, val: string) => acc + parseFloat(val),
      0,
    );
    YearOffShore2[data] = sum;
  });

  Object.keys(YearOffShore2).map((key: string) => {
    const year = Number(`20${key}`);
    YearOffShore2[year] = YearOffShore2[key];
    delete YearOffShore2[key];
  });

  const YearOnShore: TypeYearValueCalcutaion = {};
  const YearOnShore2: TypeYearValueCalcutaion2 = {};

  const monthOnShore = Object.keys(onsiteSum);
  monthOnShore.map((monthOnShore) => {
    const year = monthOnShore.split('-')[1];
    if (!isNaN(Number(year))) {
      if (!Object.prototype.hasOwnProperty.call(YearOnShore, year)) {
        YearOnShore[year] = [];
      }
      YearOnShore[year].push(`${onsiteSum[monthOnShore]}`);
    }
  });

  //Yearly Onshore
  Object.keys(YearOnShore).map((data: string) => {
    const sum = YearOnShore[data].reduce(
      (acc: number, val: string) => acc + parseFloat(val),
      0,
    );
    YearOnShore2[data] = sum;
  });
  Object.keys(YearOnShore2).map((key) => {
    const year = Number(`20${key}`);
    YearOnShore2[year] = YearOnShore2[key];
    delete YearOnShore2[key];
  });

  //UPDATE EXCEL DATA
  dataUpdate(YearOffShore2, YearOnShore2, projectName, workbook);
};

const dataUpdate = (
  YearOffShore: TypeYearValueCalcutaion2,
  YearOnShore: TypeYearValueCalcutaion2,
  projectName: string,
  wb: WorkBook,
) => {
  const workbook: WorkBook = wb;
  // const workbook: WorkBook = readFile(
  //   `${path.join(__dirname, '..', 'resources')}/${projectName}.xlsx`,
  //   {
  //     cellFormula: true,
  //     type: 'binary',
  //     cellDates: true,
  //     cellStyles: true,
  //   },
  // );

  const sheetnames = workbook.SheetNames;

  const allYears: {
    [key: string]: {
      offshore: number;
      onshore: number;
      offRate: number;
      onRate: number;
    };
  } = {};
  //

  Object.keys(YearOffShore).map((year: string) => {
    if (Object.prototype.hasOwnProperty.call(YearOnShore, year)) {
      allYears[year] = {
        offshore: YearOffShore[year],
        onshore: YearOnShore[year],
        offRate: 3260,
        onRate: 11075,
      };
    }
  });

  const headers = ['Year', 'Type', 'Hours', 'Rate', 'Consumption'];
  const worksheet: WorkSheet = utils.json_to_sheet(
    Object.entries(allYears).flatMap(([year, values]) => [
      [
        year,
        'Offshore',
        values.offshore,
        values.offRate,
        values.offshore * values.offRate,
      ],
      [
        year,
        'Onsite',
        values.onshore,
        values.onRate,
        values.onshore * values.onRate,
      ],
    ]),
  );

  utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });

  const style = {
    fill: {
      patternType: 'solid',
      fgColor: {
        theme: 4,
        tint: 0.5999938962981048,
        rgb: 'B9CDE5',
      },
      bgColor: {
        indexed: 64,
      },
    },
    border: {
      top: {
        style: 'thin',
        color: 'FFFFFF',
      },
      bottom: {
        style: 'thin',
        color: 'FFFFFF',
      },
      left: {
        style: 'thin',
        color: 'FFFFFF',
      },
      right: {
        style: 'thin',
        color: 'FFFFFF',
      },
    },
  };

  let rowIndex = 2;
  const header = 1;

  Object.keys(allYears).map((year: string) => {
    const yearData = allYears[year];

    //Headers
    worksheet[`A${header}`] = { t: 's', v: 'Year', s: style };
    worksheet[`B${header}`] = { t: 's', v: 'Type', s: style };
    worksheet[`C${header}`] = { t: 's', v: 'Hours', s: style };
    worksheet[`D${header}`] = { t: 's', v: 'Rate (JPY)', s: style };
    worksheet[`E${header}`] = { t: 's', v: 'Consumption', s: style };

    //// Offshore

    worksheet[`C${rowIndex}`] = { t: 'n', v: yearData.offshore };
    worksheet[`D${rowIndex}`] = { t: 's', v: 'JPY 3260' };
    const consumptionFormula = `="JPY"&" "&ROUND(C${rowIndex}*REPLACE(D${rowIndex},1,4,0),2)`;
    worksheet[`E${rowIndex}`] = { t: 'n', f: consumptionFormula };
    rowIndex++;

    //// Onsite

    worksheet[`C${rowIndex}`] = { t: 'n', v: yearData.onshore };
    worksheet[`D${rowIndex}`] = { t: 's', v: 'JPY 11075' };
    const consumptionFormula2 = `="JPY"&" "&ROUND(C${rowIndex}*REPLACE(D${rowIndex},1,4,0),2)`;
    worksheet[`E${rowIndex}`] = { t: 'n', f: consumptionFormula2 };
    rowIndex++;
  });

  // console.log(worksheet, 'final sheet');

  const newwb: WorkBook = utils.book_new();
  worksheet['!cols'] = [
    { width: 7 },
    { width: 10 },
    { width: 12 },
    { width: 10 },
    { width: 20 },
  ];
  utils.book_append_sheet(newwb, worksheet, 'JP-EV');
  sheetnames.map((sheet: string) => {
    if (sheet !== 'JP-EV') {
      const ws = workbook.Sheets[sheet];
      utils.book_append_sheet(newwb, ws, sheet);
    }
  });

  //writng workbook to xlsx file
  writeFile(
    newwb,
    `${path.join(__dirname, '..', 'resources')}/${projectName}.xlsx`,
    {
      bookType: 'xlsx',
      type: 'file',
      bookSST: true,
      cellStyles: true,
    },
  );

  if (newwb) {
    // writeFile(newwb, `${projectName}.xlsx`, {
    //   bookType: 'xlsx',
    //   type: 'buffer',
    //   bookSST: true,
    //   cellStyles: true,
    // });
    // console.log(`${projectName}.xlsx`);
    const binaryString = write(newwb, { bookType: 'xlsx', type: 'binary' });
    const buffer = Buffer.from(binaryString, 'binary');
    const params = {
      Bucket: 'evdatafiles',
      Key: `${projectName}.xlsx`,
      Body: buffer,
      ContentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    s3.upload(params, (err, data) => {
      if (err) {
        console.error(err);
        return err;
      } else {
        console.log(`File uploaded successfully  `);
      }
    });
  } else {
    console.log('Error: Workbook is undefined.');
  }
  // const wbBuffer = write(newwb, {
  //   bookType: 'xlsx',
  //   bookSST: true,
  //   cellDates: true,
  //   cellStyles: true,
  // });

  // Construct the parameters object for the S3 PUT operation
};
