"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
class Logger {
    #LogGroupName;
    #LogName = process.env.APPNAME || "HerFoundationsApi";
    static #client;
    constructor(logGroupName) {
        this.#LogGroupName = logGroupName;
    }
    static #getclient() {
        if (!this.#client) {
            this.#client = new client_cloudwatch_logs_1.CloudWatchLogsClient({
                region: process.env.AWS_REGION, // Replace with your actual region
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
                },
            });
        }
        return this.#client;
    }
    async #createLogGroup(logGroupName) {
        try {
            const command = new client_cloudwatch_logs_1.CreateLogGroupCommand({
                logGroupName,
                logGroupClass: "STANDARD", // or "INFREQUENT_ACCESS"
            });
            const logGroup = await _a.#client.send(command);
            return logGroup;
        }
        catch (error) {
            if (error.code !== 'ResourceAlreadyExistsException') {
                console.warn(`Log group ${logGroupName} failed to create : ${error}`);
            }
            throw error;
        }
    }
    async #findOrCreateLogGroup(logGroupName) {
        try {
            logGroupName = `${this.#LogName}/${process.env.NODE_ENV}/${logGroupName}`;
            const command = new client_cloudwatch_logs_1.DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName });
            const existingLogGroup = await _a.#client.send(command);
            if (existingLogGroup.logGroups.length < 1) {
                const createLogGroup = await this.#createLogGroup(logGroupName);
                logGroupName = createLogGroup.$metadata.httpStatusCode == 200 ? logGroupName : "";
                return logGroupName;
            }
            logGroupName = existingLogGroup.logGroups[0].logGroupName;
            return logGroupName;
        }
        catch (error) {
            console.warn(`Could not find a log group : ${error}`);
            throw error;
        }
    }
    async #createLogStream(logGroupName, logStreamName) {
        try {
            const command = new client_cloudwatch_logs_1.CreateLogStreamCommand({
                logGroupName,
                logStreamName
            });
            await _a.#client.send(command);
            return logStreamName;
        }
        catch (error) {
            if (error.code !== 'ResourceAlreadyExistsException') {
                console.warn(`Log stream ${logStreamName} for the group ${logGroupName} failed to create : ${error}`);
            }
            throw error;
        }
    }
    async #findOrCreateLogStreams(logGroupName, logStreamName) {
        try {
            const command = new client_cloudwatch_logs_1.DescribeLogStreamsCommand({ logGroupName, logStreamNamePrefix: logStreamName });
            const existingLogStream = await _a.#client.send(command);
            if (existingLogStream.logStreams.length < 1) {
                await this.#createLogStream(logGroupName, logStreamName);
            }
            return logStreamName;
        }
        catch (error) {
            console.warn(`Could not find a log stream : ${error}`);
            throw error;
        }
    }
    async #getSequenceToken(logGroupName, logStreamName) {
        try {
            const command = new client_cloudwatch_logs_1.DescribeLogStreamsCommand({
                logGroupName,
                logStreamNamePrefix: logStreamName,
            });
            const sequence = await _a.#client.send(command);
            return sequence;
        }
        catch (error) {
            console.warn(`Could not get upload sequence for stream ${logStreamName} and group ${logGroupName} : ${error} `);
            throw error;
        }
    }
    async #log(logLevel, logData, logStreamName) {
        _a.#getclient();
        try {
            const logGroupName = await this.#findOrCreateLogGroup(this.#LogGroupName);
            logStreamName = await this.#findOrCreateLogStreams(logGroupName, logStreamName);
            const sequence = await this.#getSequenceToken(logGroupName, logStreamName);
            const uploadSequenceToken = sequence.logStreams?.find((x) => x.logStreamName === logStreamName);
            const command = new client_cloudwatch_logs_1.PutLogEventsCommand({
                logGroupName,
                logStreamName,
                logEvents: [
                    {
                        message: `[${logLevel}]:${logData}`,
                        timestamp: Date.now()
                    }
                ],
                ...(uploadSequenceToken?.uploadSequenceToken && { sequenceToken: uploadSequenceToken?.uploadSequenceToken })
            });
            await _a.#client.send(command);
            console.info(`Logs were sent to cloudwatch`);
        }
        catch (error) {
            console.warn(`Logs were not sent to cloudwatch`);
            throw error;
        }
    }
    async info(logStreamName, data) {
        try {
            await this.#log("INFO", data, logStreamName);
        }
        catch (error) {
            const errorType = error?.name || error?.__type;
            switch (errorType) {
                case 'UnrecognizedClientException':
                    console.error('Your aws credentials are either invalid or misconfigured');
                    break;
                default:
                    console.warn(error);
                    throw error;
            }
        }
    }
    async warn(logStreamName, data) {
        try {
            await this.#log("WARNING", data, logStreamName);
        }
        catch (error) {
            const errorType = error?.name || error?.__type;
            switch (errorType) {
                case 'UnrecognizedClientException':
                    console.error('Your aws credentials are either invalid or misconfigured');
                    break;
                default:
                    console.warn(error);
                    throw error;
            }
        }
    }
    async error(logStreamName, data) {
        try {
            await this.#log("ERROR", data, logStreamName);
        }
        catch (error) {
            const errorType = error?.name || error?.__type;
            switch (errorType) {
                case 'UnrecognizedClientException':
                    console.error('Your aws credentials are either invalid or misconfigured');
                    break;
                default:
                    console.warn(error);
                    throw error;
            }
        }
    }
    async alarm(logStreamName, data) {
        try {
            await this.#log("ALARM!!!", data, logStreamName);
        }
        catch (error) {
            const errorType = error?.name || error?.__type;
            switch (errorType) {
                case 'UnrecognizedClientException':
                    console.error('Your aws credentials are either invalid or misconfigured');
                    break;
                default:
                    console.warn(error);
                    throw error;
            }
        }
    }
}
_a = Logger;
exports.default = Logger;
