"use client"

import {useForm} from "react-hook-form"
import { useSignUp } from "@clerk/nextjs"
import {z} from "zod"


import { signUpSchema } from "@/schemas/signUpSchema"
import React, { useState } from "react"
import {zodResolver} from "@hookform/resolvers/zod"
import { log } from "node:console"
import { useRouter } from "next/navigation"
import {Card, CardBody , CardHeader} from "@heroui/card";


export default function signUpForm(){
    const router = useRouter()
    const {signUp ,isLoaded , setActive } = useSignUp()
    const [isSubmitting , setIsSubmiting] = useState(false)
    const [verificationCode , setVerificationCode] = useState("")
    const [authError , serAuthError] = useState<string | null>(null)
    const [verificationError , setVerificationError] = useState<string | null>(null)
    const [verifying , setVerifying] = useState(false);
    const {
        register ,
        handleSubmit,
        formState: {errors},
    } = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            email: "",
            password: "",
            passwordConfirmation: "",
        },
    });
   

    const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
        if(!isLoaded) return;
        setIsSubmiting(true)
        serAuthError(null)

        try {
            signUp.create({
                emailAddress: data.email,
                password: data.password
            })

            await signUp.prepareEmailAddressVerification({
                strategy:"email_code"
            })

            setVerifying(true)
        } catch (error: any) {
            console.error("Signup error: ",error);
            serAuthError(
                error.errors?.[0]?.message || "An error occured during the signup. please try again"
            )
        } finally{
            setIsSubmiting(false)
        }
    };


    const handleVerificationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if(!isLoaded || !signUp) return;
        setIsSubmiting(true)
        serAuthError(null)

        try {
            const result = await signUp.attemptEmailAddressVerification({
                code: verificationCode
            })

            console.log(result);
            
            if(result.status === "complete"){
                await setActive({session: result.createdSessionId})
                router.push("/dashboard")
            }
            else{
                console.error("Verification incomplete",result);
                setVerificationError(
                     "Not Verified"
                );
                
            }
        } catch (error : any) {
            setVerificationError(
            error.errors?.[0]?.message || "An error occured during the signup. please try again")
        }
        finally{
            setIsSubmiting(false)
        }

    };

    if(verifying){
        return (
            <Card className="w-full max-w-md border border-default-200 bg-default-50 shadow-xl" >
                <CardHeader className="flex flex-col gap-1 items-center pb-2">
                    <h1 className="text-2xl font-bold text-default-900">
                        Verify Your Email
                    </h1>

                    <p className="text-default-500 text-center">We've sent a verification code to your email</p>
                </CardHeader>


            </Card>
        )
    }

   return <h1>signUp form with email and other fields</h1>
    
   

}