import React, { createContext, useEffect, useState } from "react";

type userContextType = {
    name: string,
    avatar: string,
    user_id: string
}

const userContext = createContext<userContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }){
    const [ user, setUser ] = useState<userContextType | null>(null);

    useEffect(() => {
        
    }, [user, setUser])

}