"use client"
import ChatPage from "@/components/chatPage";
import LoginPage from "@/components/loginPage";
import Image from "next/image";
import { useState } from "react";

function useLogin(){
  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const onLoginSuccess = (name:string) => {
    setLoggedIn(true);
    setName(name);
  }
  return {loggedIn, onLoginSuccess, name};
}

export default function Home() {
  const {loggedIn, onLoginSuccess, name} = useLogin();
  return (
    <>
      { !loggedIn && <LoginPage onLoginSuccess={onLoginSuccess}></LoginPage>}
      { loggedIn && <ChatPage sender={name}></ChatPage>}
    </>
  );
}
