'use client'

import { useState, useEffect } from "react";

export default function Dashboard() {
    const [numCalls, setNumCalls] = useState(null);
    useEffect(() => {
        const email = sessionStorage.getItem("email")
        const session = sessionStorage.getItem("sessionToken")
    
        const getCalls = async () =>{
            try{
                const response = await fetch("/api/dashboard", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({email, session}),
                })

                if (!response.ok) throw new Error("Failed to fetch data");

                const data = await response.json();
                setNumCalls(data.numcalls);

            } catch(error){
                console.log(error);
            }
        }
        getCalls();
    }, []);
    return(
        <>
        <h1>Dashboard</h1>
        <p>Welcome to your dashboard!</p>
        <p>Tokens:{numCalls}/20</p>
        </>
    )
}
