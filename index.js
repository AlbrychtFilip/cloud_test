#!/usr/bin/env node

require('dotenv').config();
const AWS = require('aws-sdk');
const yargs = require('yargs');
const fs = require('fs');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
const s3 = new AWS.S3();

const listFiles = async (bucket) => {
    try {
        const params = { Bucket: bucket };
        const data = await s3.listObjectsV2(params).promise();
        data.Contents.forEach(file => console.log(file.Key));
    } catch (error) {
        console.error('Error listing files:', error);
    }
};

const uploadFile = async (bucket, filePath, destinationKey) => {
    try {
        const fileContent = fs.readFileSync(filePath);
        const params = {
            Bucket: bucket,
            Key: destinationKey,
            Body: fileContent
        };
        await s3.upload(params).promise();
        console.log(`File uploaded successfully to ${bucket}/${destinationKey}`);
    } catch (error) {
        console.error('Error uploading file:', error);
    }
};

const listFilesWithFilter = async (bucket, regex) => {
    try {
        const params = { Bucket: bucket };
        const data = await s3.listObjectsV2(params).promise();
        const filteredFiles = data.Contents.filter(file => file.Key.match(new RegExp(regex)));
        filteredFiles.forEach(file => console.log(file.Key));
    } catch (error) {
        console.error('Error listing files with filter:', error);
    }
};

const deleteFilesWithFilter = async (bucket, regex) => {
    try {
        const params = { Bucket: bucket };
        const data = await s3.listObjectsV2(params).promise();
        const filesToDelete = data.Contents.filter(file => file.Key.match(new RegExp(regex))).map(file => ({ Key: file.Key }));

        if (filesToDelete.length === 0) {
            console.log('No files to delete');
            return;
        }

        const deleteParams = {
            Bucket: bucket,
            Delete: { Objects: filesToDelete }
        };
        await s3.deleteObjects(deleteParams).promise();
        console.log(`Deleted ${filesToDelete.length} files`);
    } catch (error) {
        console.error('Error deleting files:', error);
    }
};

yargs
    .command('list <bucket>', 'List all files in an S3 bucket', {}, argv => {
        listFiles(argv.bucket);
    })
    .command('upload <bucket> <filePath> <destinationKey>', 'Upload a local file to a defined location in the bucket', {}, argv => {
        uploadFile(argv.bucket, argv.filePath, argv.destinationKey);
    })
    .command('list-filter <bucket> <regex>', 'List files in a bucket that match a regex', {}, argv => {
        listFilesWithFilter(argv.bucket, argv.regex);
    })
    .command('delete-filter <bucket> <regex>', 'Delete files in a bucket that match a regex', {}, argv => {
        deleteFilesWithFilter(argv.bucket, argv.regex);
    })
    .demandCommand(1, 'You need to specify a command')
    .help()
    .argv;
