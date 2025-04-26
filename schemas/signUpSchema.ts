import { data } from "react-router-dom"
import * as z from "zod"

export const signUpSchema = z
    .object({
        email: z
                .string()
                .min(1 , {message : "Email is required"})
                .email({message: "Please enter a valid email"}),
        password: z
                    .string()
                    .min(1,{message:"Password is required"})
                    .min(8, {message: "password should be of minimum 8 charecters"}),
        passwordConfirmation : z
                                .string()
                                .min(1,{message:"please confirm your password"}),

    })

    .refine((data) => data.password === data.passwordConfirmation ,{
        message: "Password do not match",
        path: ["passwordConfirmation"],
    });