import AWS, { S3 } from 'aws-sdk';

import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import dotenv from 'dotenv';
dotenv.config();
// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// const docClient = new AWS.DynamoDB.DocumentClient();
const docClient = new DocumentClient();

const s3bucket = new AWS.S3();
export { docClient, s3bucket };
