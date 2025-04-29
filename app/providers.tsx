"use client"
import React from "react"
import type {ThemeProviderProps } from "next-themes";
import {ImageKitProvider} from "imagekitio-next";
export interface ProviderProps{
    children: React.ReactNode,
    themeProp?: ThemeProviderProps
}

const authenticator = async () => {
    try {
        const response = await fetch("/api/imagekit-auth");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Authentication error: ", error);
        throw error;
    }
}
export function Provider({children , themeProp} : ProviderProps){
    return(
        <h1>
            <ImageKitProvider
            authenticator={authenticator}
            publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ""}
            urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ""}
            >
            {children}
            </ImageKitProvider>  
        </h1>
        
    )
}