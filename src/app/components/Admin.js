'use client'

import { useState, useEffect } from "react";

export default function Admin() {
    const [userInfo, setUserInfo] = useState(null);
    useEffect(()=>{
        const email = sessionStorage.getItem("email")
        const session = sessionStorage.getItem("sessionToken")
        const getInfo = async()=>{
            try{
                const response = await fetch("/api/admin", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({email, session})
                })

                if (!response.ok) throw new Error("Failed to fetch data");

                const data = await response.json();
                
                setUserInfo(data.map((user, index) => (
                    <li key={index}>{user.email} - Calls: {user.numcalls}</li>
                )));
            } catch(error){
                console.log(error);
            }
        }
        getInfo();
    }, []);
    
    return(
        <>
        <p>Your users report:</p>
        <ul>
        {userInfo}
        </ul>
        </>
    )
}
