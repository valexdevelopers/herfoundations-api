import { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand, DescribeLogStreamsCommand, DescribeLogGroupsCommand, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";


export default class Logger {
    #LogGroupName: string;
    #LogName = process.env.APPNAME || "HerFoundationsApi"
    static #client: CloudWatchLogsClient

    constructor(
        logGroupName: string,
        
    ){
        this.#LogGroupName = logGroupName
        
    }

    static #getclient() {
        if(!this.#client){
            this.#client = new CloudWatchLogsClient({
                region: process.env.AWS_REGION, // Replace with your actual region
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
                    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY ?? "",
                },
            })  
        }
        return this.#client
    }
    async #createLogGroup(logGroupName: string){
        try {
            const command = new CreateLogGroupCommand({
                logGroupName,
                logGroupClass:"STANDARD", // or "INFREQUENT_ACCESS"
            });
            const logGroup = await Logger.#client.send(command)
            return logGroup;
        } catch (error: any) {
             if(error.code !== 'ResourceAlreadyExistsException'){
                console.warn(`Log group ${logGroupName} failed to create : ${error}`) 
                
            }
            throw error
        }
    }

    async #findOrCreateLogGroup(logGroupName: string){
        try {
            logGroupName = `${this.#LogName}/${process.env.NODE_ENV}/${logGroupName}`
            const command = new DescribeLogGroupsCommand({logGroupNamePrefix: logGroupName}) 
            const existingLogGroup = await Logger.#client.send(command);
            if(existingLogGroup.logGroups!.length < 1){
                const createLogGroup = await this.#createLogGroup(logGroupName);
                logGroupName = createLogGroup.$metadata.httpStatusCode == 200 ? logGroupName : ""
                return logGroupName;
            }
            logGroupName = existingLogGroup.logGroups![0].logGroupName as string
            return logGroupName;
        } catch (error) {
            console.warn(`Could not find a log group : ${error}`) 
            throw error
        }
    }

    async #createLogStream(logGroupName: string, logStreamName: string){
        try {
            const command = new CreateLogStreamCommand({
                logGroupName,
                logStreamName
            });
            await Logger.#client.send(command)
            return logStreamName;
        } catch (error: any) {
            if(error.code !== 'ResourceAlreadyExistsException'){
                console.warn(`Log stream ${logStreamName} for the group ${logGroupName} failed to create : ${error}`) 
                
            }
           throw error
        }
    }

    async #findOrCreateLogStreams(logGroupName: string, logStreamName: string){
        try {
            const command = new DescribeLogStreamsCommand({logGroupName, logStreamNamePrefix: logStreamName}) 
            const existingLogStream = await Logger.#client.send(command);
            if(existingLogStream.logStreams!.length < 1){
                await this.#createLogStream(logGroupName, logStreamName);
            }
            return logStreamName;
        } catch (error) {
            console.warn(`Could not find a log stream : ${error}`) 
            throw error
        }
    }


    async #getSequenceToken(logGroupName: string, logStreamName: string) {
        try {
            const command = new DescribeLogStreamsCommand({
                logGroupName,
                logStreamNamePrefix: logStreamName,
            })
            const sequence = await Logger.#client.send(command);
            return sequence
        } catch (error) {
            console.warn(`Could not get upload sequence for stream ${logStreamName} and group ${logGroupName} : ${error} `)
            throw error
        }
    }

    async #log(logLevel: string, logData: string, logStreamName: string) {
        Logger.#getclient()
        try {
            const logGroupName = await this.#findOrCreateLogGroup(this.#LogGroupName)
            logStreamName = await this.#findOrCreateLogStreams(logGroupName, logStreamName)
            const sequence =await this.#getSequenceToken(logGroupName, logStreamName)
            const uploadSequenceToken = sequence.logStreams?.find((x)=>x.logStreamName === logStreamName)
            const command = new PutLogEventsCommand({
                logGroupName,
                logStreamName,
                logEvents: [
                    {
                    message: `[${logLevel}]:${logData}`,
                    timestamp: Date.now()
                    }
                ],
                ...(uploadSequenceToken?.uploadSequenceToken && {sequenceToken: uploadSequenceToken?.uploadSequenceToken})
            })
            await Logger.#client.send(command); 
            console.info(`Logs were sent to cloudwatch`)
        } catch (error) {
            console.warn(`Logs were not sent to cloudwatch`)
            throw error
        }
        
      
    }

    public async info(logStreamName: string, data: string){
        try {
            await this.#log("INFO", data, logStreamName)
        } catch (error:any) {
            const errorType = error?.name || error?.__type;
            switch (errorType) {
                case 'UnrecognizedClientException':
                    console.error('Your aws credentials are either invalid or misconfigured')
                    break;
            
                default:
                    console.warn(error)
                    throw error
            }
        }
    }

    public async warn(logStreamName: string, data: string){
        try {
            await this.#log("WARNING", data, logStreamName)
        } catch (error:any) {
            const errorType = error?.name || error?.__type;
            switch (errorType) {
                case 'UnrecognizedClientException':
                    console.error('Your aws credentials are either invalid or misconfigured')
                    break;
            
                default:
                    console.warn(error)
                    throw error
            }
        }
    }

    public async error(logStreamName: string, data: string){
        try {
            await this.#log("ERROR", data, logStreamName)
        } catch (error:any) {
            const errorType = error?.name || error?.__type;
            switch (errorType) {
                case 'UnrecognizedClientException':
                    console.error('Your aws credentials are either invalid or misconfigured')
                    break;
            
                default:
                    console.warn(error)
                    throw error
            }
        }
    }


    public async alarm(logStreamName: string, data: string){
        try {
            await this.#log("ALARM!!!", data, logStreamName)
        } catch (error:any) {
            const errorType = error?.name || error?.__type;
            switch (errorType) {
                case 'UnrecognizedClientException':
                    console.error('Your aws credentials are either invalid or misconfigured')
                    break;
            
                default:
                    console.warn(error)
                    throw error
            }
        }
    }
}