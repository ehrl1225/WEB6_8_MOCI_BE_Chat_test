"use client"
import ChatPage from "@/components/chatPage";
import LoginPage from "@/components/loginPage";
import useLogin from "@/lib/useLogin";
import Image from "next/image";
import { useState } from "react";


export default function Home() {
  const {loggedIn, login, name, setLoggedIn} = useLogin();
  return (
    <>
      { !loggedIn && <LoginPage login={login}></LoginPage>}
      { loggedIn && <ChatPage sender={name} setLoggedIn={setLoggedIn}></ChatPage>}
    </>
  );
}
