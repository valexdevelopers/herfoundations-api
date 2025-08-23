import { $Enums, CyclePattern, Prisma } from "../../@prisma/client";
import { Cycle } from "../../@prisma/client";
import { CycleDto } from "../utils/dtos/cycle/create-cycle.dto";
import BaseRepository from "./baseRepository";

export class CycleRepository extends BaseRepository<Cycle, Prisma.CycleCreateInput, Prisma.CycleFindUniqueArgs, Prisma.CycleUpdateInput, Prisma.CycleUpsertArgs> {
    public async createCycle(data: CycleDto){
        const currentphase 
        const cyclePhases: Prisma.PhaseLogCreateInput[] = [
            {
                phase: $Enums.CyclePhase.menstrual,
                startDate: data.startDate, // the first phase starts on the first day of the cycle
                endDate: data.startDate,
                hormoneLogs: {
                    create: {

                    }
                }
            },
            
        ];
        const createCycleInput: Prisma.CycleCreateInput = {
            ...data,
            patient: {
                connect: {
                    id: data.patientId
                }
            },
            pattern: CyclePattern.unknown,
            phases: {
                createMany: {data: cyclePhases}
            }

        }
    }
}