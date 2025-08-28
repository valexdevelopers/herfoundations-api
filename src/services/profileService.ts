import { $Enums } from "../../@prisma/client";
import { PhaseLogDto } from "../utils/dtos/cycle/create-cycle.dto";
import { PatientOnboardingDto, UpdatePatientDto, UpdateUserDto } from "../utils/dtos/user/update-user.dto";
import { calculateBMI } from "../utils/functions/bmi-calculator";
import { IAuthRepository, IPatientRepository } from "../utils/interfaces/account.interface";


export class ProfileService {
    #authRepository
    #patientRepository
    #cycleRepository
    #phaseLogRepository
    #hormoneLogRepository

    constructor(authRepository:IAuthRepository, patientRepository:IPatientRepository, cycleRepository, phaseLogRepository, hormoneLogRepository) {
        this.#authRepository = authRepository
        this.#patientRepository = patientRepository
        this.#cycleRepository = cycleRepository
        this.#phaseLogRepository = phaseLogRepository
        this.#hormoneLogRepository = hormoneLogRepository
    }

    public async patientOnboard(data: PatientOnboardingDto){

        try {
            const menstrualPhaseEnd =  new Date(new Date(data.periodStartDate).getTime() + (data.lengthOfPeriod * 24 * 60 * 60 * 1000))
            const menstrualPhaseStart = new Date(data.periodStartDate)
            const follicularPhaseStart = new Date(menstrualPhaseEnd.getTime() + 24 *60 *60 * 1000) // starts next day
            const follicularPhaseEnd = new Date(menstrualPhaseEnd.getTime() + 24 *60 *60 * 1000) // starts next day
            

            const nextPeriodStarts =  new Date(new Date(data.periodStartDate).getTime() + ((data.lenghtOfCircle ? data.lenghtOfCircle  : 31) * 24 * 60 * 60 * 1000))
            const lutealPhaseEnd =  new Date(new Date(data.periodStartDate).getTime() + ((data.lenghtOfCircle ? data.lenghtOfCircle  : 30) * 24 * 60 * 60 * 1000))
            const ovulationDay = new Date(nextPeriodStarts.getTime() - (14 * 24 * 60 * 60 * 1000)) 
            const lutealPhaseStart = new Date(ovulationDay.getTime() + 1 * 24 * 60 * 60 * 1000);
            const today = new Date()

            // update user and patient with neccessary details
            const updateUser:UpdateUserDto  = {
                firstName: data.firstName,
                middleName: data.middleName,
                lastName: data.lastName,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
            }
            
            const updatePatien:UpdatePatientDto  = {
                height: data.height,
                weight: data.weight,
                bmi: calculateBMI(data.weight, data.height ),
                averagePeriodLength: data.lengthOfPeriod,
                cyclePattern: { [`${data.periodStartDate}_${data.periodEndDate}`]: data.pattern },
            }

            const cyclePhases: PhaseLogDto[] = (today.getTime() -  menstrualPhaseStart.getTime() > 45) ? [
                {
                    phase: $Enums.CyclePhase.menstrual,
                    startDate: menstrualPhaseStart.toDateString(), // the first phase starts on the first day of the cycle
                    endDate: menstrualPhaseEnd.toDateString(),
                    hormoneLogs: []
                },
                {
                    phase: $Enums.CyclePhase.follicular,
                    startDate: follicularPhaseStart.toDateString(), // the first phase starts on the first day of the cycle
                    endDate: follicularPhaseEnd.toDateString(),
                    hormoneLogs: []
                },
                {
                    phase: $Enums.CyclePhase.ovulation,
                    startDate: ovulationDay.toDateString(), // the first phase starts on the first day of the cycle
                    endDate: ovulationDay.toDateString(),
                    hormoneLogs: []
                },
                {
                    phase: $Enums.CyclePhase.luteal,
                    startDate: lutealPhaseStart.toDateString(), // the first phase starts on the first day of the cycle
                    endDate: lutealPhaseEnd.toDateString(),
                    hormoneLogs: []
                },
                
            ] : [] // cycles longer than 45 days would need to manually track phases
    
            
        } catch (error) {
            
        }

    }

}