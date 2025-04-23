import { z } from "zod";

export const UserSchema = {
    firstname: z.string().min(3).max(20),
    lastname: z.string().min(3).max(20),
    username: z.string().min(3).max(20),
    email: z.string().email(),
    created_at: z.date(),
}