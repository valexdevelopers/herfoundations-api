export const calculateBMI = (weightKg: number, heightCm: number): number =>{
  const heightM = heightCm / 100;
  return +(weightKg / (heightM * heightM)).toFixed(1); // returns BMI rounded to 1 decimal place
}