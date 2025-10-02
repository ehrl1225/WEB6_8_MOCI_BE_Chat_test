"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { use, useState } from "react"
import { toast } from "sonner"

export default function LoginPage({login}: {login: (id:string, password:string) => Promise<boolean>}) {
    const [id, setId] = useState("")
    const [password, setPassword] = useState("")

    const handleLogin = async () => {
        const success = await login(id, password);
        if (!success) {
            return;
        }
        setId("");
        setPassword("");
        toast.success("Login successful!");
    }

    return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <Card className="w-96" >
            <CardHeader>
                <p className="text-xl">Login Page</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="id">ID</Label>
                    <Input id="id" type="text" placeholder="ID를 입력해 주세요." value={id} onChange={(e) => setId(e.target.value)}></Input>
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="비밀번호를 입력해 주세요." value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e)=>e.key === "Enter" && handleLogin()}></Input>
                </div>
                <div>
                    <Button id="login" onClick={handleLogin}>로그인</Button>
                </div>
            </CardContent>
        </Card>

    </div>
}