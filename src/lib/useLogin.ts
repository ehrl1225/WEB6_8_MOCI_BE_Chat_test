import { useState } from "react";
import { toast } from "sonner";
import { LoginResponse } from "./types";

export default function useLogin(){
  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState("");
  
  const onLoginSuccess = (name:string) => {
    setLoggedIn(true);
    setName(name);
  }

  const login = async (id:string, password:string) => {
        console.log({id, password});
        const response = await fetch("http://localhost:8080/api/v1/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                loginType: "PHONE",
                userId:id,
                password:password
            }),
            credentials: "include"
        });
        if (!response.ok) {
            toast.error("Login failed. Please check your ID and password.");
            return false;
        }
        const responseData: LoginResponse = await response.json();
        
        onLoginSuccess(responseData.data.user.name);
        return true;
    }

  return {loggedIn, setLoggedIn, name, login};
}