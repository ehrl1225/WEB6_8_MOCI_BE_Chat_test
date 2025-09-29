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

const NO_ATTACHMENT = 0

export default function ChatPage({sender}: {sender: string}) {
    const [connectionStatus, setConnectionStatus] = useState("Disconnected")
    const [roomId, setRoomId] = useState("1") // Room ID 상태 추가
    const [text, setText] = useState("")
    const [messages, setMessages] = useState<{ sender: string, content: string }[]>([])
    const clientRef = useRef<Client | null>(null)
    const messagesEndRef = useRef<HTMLDivElement | null>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // 컴포넌트 언마운트 시 연결 해제
    useEffect(() => {
        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate()
            }
        }
    }, [])

    const connect = () => {
        if (!roomId.trim()) {
            toast.warning("Please enter a Room ID.")
            return
        }
        setConnectionStatus("Connecting...")
        toast.info("Connecting to the server...")
        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8080/api/v1/ws"),
            debug: (str) => console.log(new Date(), str),
            reconnectDelay: 0, // 자동 재연결 방지
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            connectHeaders: {
                roomId: roomId // 상태에서 Room ID 사용
            }
        })

        client.onConnect = (frame) => {
            setConnectionStatus("Connected")
            toast.success(`Connected to room ${roomId}!`)
            // 상태에서 Room ID를 사용하여 토픽 구독
            client.subscribe(`/api/v1/chat/topic/${roomId}`, (message) => {
                const receivedMessage = JSON.parse(message.body)
                setMessages((prevMessages) => [...prevMessages, receivedMessage])
            })
        }

        client.onStompError = (frame) => {
            const errorMessage = frame.headers["message"]
            console.error("Broker reported error: " + errorMessage)
            console.error("Additional details: " + frame.body)
            setConnectionStatus("Error")
            toast.error(`Connection Error: ${errorMessage}`)
        }

        client.onDisconnect = () => {
            setConnectionStatus(prevStatus => {
                if (prevStatus === 'Connected') {
                    toast.info("Disconnected from the server.");
                    setConnectionStatus('Disconnected'); // 상태를 즉시 리셋
                }
                clientRef.current?.deactivate();
                return 'Disconnected';
            });
        }

        client.activate()
        clientRef.current = client
    }

    const disconnect = () => {
        if (clientRef.current) {
            if (connectionStatus === 'Connecting...') {
                toast.info("Connection attempt cancelled.");
                setConnectionStatus('Disconnected'); // 상태를 즉시 리셋
            }
            clientRef.current.deactivate()
        }
    }

    const sendMessage = () => {
        if (clientRef.current && clientRef.current.connected && text !== "" && sender !== "") {
            const message = {  
                content:text,
                attachmentId:NO_ATTACHMENT
            }
            // 상태에서 Room ID를 사용하여 메시지 전송
            clientRef.current.publish({
                destination: `/api/v1/chat/app/send/${roomId}`,
                body: JSON.stringify(message),
            })
            setText("")
        } else if (!sender.trim()){
            toast.warning("Please enter a sender name.")
        } else if (!clientRef.current || !clientRef.current.connected) {
            toast.error("STOMP client is not connected.")
            setConnectionStatus("Disconnected")
            clientRef.current?.deactivate()
        }
    }

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 px-4">
            <div className="w-full max-w-2xl mb-4">
                <Link href="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:underline">
                    <ChevronLeft className="h-4 w-4" />
                    로그인으로 돌아가기
                </Link>
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
                            <Button onClick={connect} disabled={['Connected', 'Connecting...'].includes(connectionStatus)}>Connect</Button>
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
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                className="w-full"
                            />
                        </div>
                        <Button onClick={sendMessage} className="self-end">Send</Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}