"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState, useRef } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { toast } from "sonner"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import useChat from "@/lib/useChat"

const NO_ATTACHMENT = 0

export default function ChatPage({sender, setLoggedIn}: {sender: string, setLoggedIn: (loggedIn: boolean) => void}) {
    const [roomId, setRoomId] = useState("1") // Room ID 상태 추가
    const [text, setText] = useState("")
    const messagesEndRef = useRef<HTMLDivElement | null>(null)
    const {messages, connect, disconnect, sendMessage, clientRef, connectionStatus} = useChat();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // 컴포넌트 언마운트 시 연결 해제
    useEffect(() => {
        if (clientRef.current) {
            clientRef.current.deactivate()
        }
    }, [])

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 px-4">
            <div className="w-full max-w-2xl mb-4">
                <Button variant={"ghost"} className="flex items-center gap-1 text-sm text-muted-foreground hover:underline" onClick={() => setLoggedIn(false)}>
                    <ChevronLeft className="h-4 w-4" />
                    로그인으로 돌아가기
                </Button>
            </div>
            <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
                <CardHeader>
                    <CardTitle>STOMP Chat</CardTitle>
                    <div className="grid gap-1.5 mt-4">
                        <Label htmlFor="roomId">Room ID</Label>
                        <Input
                            id="roomId"
                            type="number"
                            placeholder="Enter Room ID"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            disabled={['Connected', 'Connecting...'].includes(connectionStatus)}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <CardDescription>Connection Status: {connectionStatus}</CardDescription>
                        <div className="flex gap-2">
                            <Button onClick={() => connect(roomId)} disabled={['Connected', 'Connecting...'].includes(connectionStatus)}>Connect</Button>
                            <Button onClick={disconnect} disabled={['Disconnected', 'Error'].includes(connectionStatus)} variant="destructive">Disconnect</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto p-4">
                    <div className="flex flex-col gap-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === sender ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-2 rounded-lg ${msg.sender === sender ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                    <strong>{msg.sender}:</strong> {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </CardContent>
                <CardFooter className="p-4 border-t">
                    <div className="flex w-full items-start gap-4">
                        <div className="grid gap-1.5 flex-grow">
                            <Label htmlFor="sender" className="sr-only">Sender</Label>
                            <Input
                                id="sender"
                                placeholder="Your Name"
                                value={sender}
                                disabled={true}
                                className="w-full"
                            />
                             <Label htmlFor="message" className="sr-only">Message</Label>
                            <Input
                                id="message"
                                placeholder="Type your message..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage(text, roomId)}
                                className="w-full"
                            />
                        </div>
                        <Button onClick={() => sendMessage(text, roomId)} className="self-end">Send</Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}