import { z } from 'zod';
export declare const daysOfWeekSchema: z.ZodArray<z.ZodEnum<{
    monday: "monday";
    tuesday: "tuesday";
    wednesday: "wednesday";
    thursday: "thursday";
    friday: "friday";
    saturday: "saturday";
    sunday: "sunday";
}>>;
export declare const timeSchema: z.ZodString;
export declare function validateShiftTimes(startTime: string, endTime: string): {
    isValid: boolean;
    error?: string;
};
export declare const staffCategorySchema: z.ZodEnum<{
    REGULAR: "REGULAR";
    RELIEF: "RELIEF";
    SUPERVISOR: "SUPERVISOR";
}>;
export declare const overrideTypeSchema: z.ZodEnum<{
    TEMPORARY_ALLOCATION: "TEMPORARY_ALLOCATION";
    ABSENCE: "ABSENCE";
}>;
export declare const scheduleTypeSchema: z.ZodEnum<{
    DAILY: "DAILY";
    SHIFT_CYCLE: "SHIFT_CYCLE";
}>;
export declare const positiveIntSchema: z.ZodNumber;
export declare const nonEmptyStringSchema: z.ZodString;
export declare const optionalPositiveIntSchema: z.ZodOptional<z.ZodNumber>;
export declare const optionalNonNegativeIntSchema: z.ZodOptional<z.ZodNumber>;
export declare const zeroStartDateIdSchema: z.ZodString;
//# sourceMappingURL=schemas.d.ts.map