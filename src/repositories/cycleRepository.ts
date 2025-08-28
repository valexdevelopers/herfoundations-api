import { $Enums, CyclePattern, Prisma, PrismaClient } from "../../@prisma/client";
import { Cycle } from "../../@prisma/client";
import { CycleDto } from "../utils/dtos/cycle/create-cycle.dto";
import { ICacheHandler } from "../utils/interfaces/base.interfaces";
import Logger from "../utils/log";
import BaseRepository from "./baseRepository";

export class CycleRepository extends BaseRepository<Cycle, Prisma.CycleCreateInput, Prisma.CycleFindUniqueArgs, Prisma.CycleUpdateInput, Prisma.CycleUpsertArgs> {
    #logHandler: Logger;

    constructor(
             redis: ICacheHandler,
             logHandler: Logger,
             superLogHandler: Logger,
             model: string,
             databaseService: PrismaClient
         ) {
             super(redis, superLogHandler, model, databaseService);
             this.#logHandler = logHandler;
         }
    
    
    public async createCycle(data: CycleDto){
        try {
            const createCycleInput: Prisma.CycleCreateInput = {
                ...data,
                patient: {
                    connect: {
                        id: data.patientId
                    }
                },
                pattern: CyclePattern.unknown,
                phases: {
                    createMany: {
                        data: data.phases!.map((phase) => {
                        return {
                            phase: phase.phase,
                            startDate: phase.startDate, // the first phase starts on the first day of the cycle
                            endDate: phase.startDate,
                            hormoneLogs: phase.hormoneLogs
                    }})}
                }

            }

            return await super.create(createCycleInput)
 
        } catch (error) {
            this.#logHandler.error("CycleRepository/createCycle", JSON.stringify(`Could not create menstrual cycle with data: ${data}`))
            throw error
        }


    }
}