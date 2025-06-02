import { PrismaClient } from "@prisma/client";

export interface ICacheHandler{
    set(key: string, value: any, secondsToken: "EX", seconds: number | string,): Promise<"OK">;
    get(key: string): Promise<string | null>
    del(...args: [...keys: string[]]): Promise<number>
}

export interface IDATABASE extends PrismaClient{}