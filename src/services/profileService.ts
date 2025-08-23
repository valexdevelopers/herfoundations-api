import { PhaseLogDto } from "../utils/dtos/cycle/create-cycle.dto";
import { PatientOnboardingDto, UpdatePatientDto, UpdateUserDto } from "../utils/dtos/user/update-user.dto";
import { calculateBMI } from "../utils/functions/bmi-calculator";
import { IAuthRepository, IPatientRepository } from "../utils/interfaces/account.interface";


export class ProfileService{
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


            const menstrualPhaseEnd =  new Date(new Date(data.periodStartDate).getTime() + (data.lengthOfPeriod * 24 * 60 * 60 * 1000))
            const menstrualPhaseStart = new Date(data.periodStartDate)
            const follicularPhaseStart = new Date(menstrualPhaseEnd.getTime() + 24 *60 *60 * 1000) // starts next day
            const follicularPhaseEnd = new Date(menstrualPhaseEnd.getTime() + 24 *60 *60 * 1000) // starts next day
            const ovulationDay = new Date()
            const phase1StartDate = data.periodStartDate
            const currentPhase = 

            const lutealPhase
            const cyclePhases: PhaseLogDto[] = [
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
            // create first cycle,phase and hormonal log from provided details 
            
        } catch (error) {
            
        }

    }

}