"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState, useRef } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"

export default function ChatPage() {
    const [connectionStatus, setConnectionStatus] = useState("Disconnected")
    const [sender, setSender] = useState("")
    const [text, setText] = useState("")
    const [messages, setMessages] = useState<{ sender: string, text: string }[]>([])
    const clientRef = useRef<Client | null>(null)
    const messagesEndRef = useRef<HTMLDivElement | null>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
            debug: (str) => console.log(new Date(), str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        })

        client.onConnect = (frame) => {
            setConnectionStatus("Connected")
            client.subscribe("/topic/public", (message) => {
                const receivedMessage = JSON.parse(message.body)
                setMessages((prevMessages) => [...prevMessages, receivedMessage])
            })
        }

        client.onStompError = (frame) => {
            console.error("Broker reported error: " + frame.headers["message"])
            console.error("Additional details: " + frame.body)
            setConnectionStatus("Error")
        }

        client.onDisconnect = () => {
            setConnectionStatus("Disconnected")
        }

        client.activate()
        clientRef.current = client

        return () => {
            client.deactivate()
        }
    }, [])

    const sendMessage = () => {
        if (clientRef.current && clientRef.current.connected && text.trim() !== "" && sender.trim() !== "") {
            const message = { sender, text }
            clientRef.current.publish({
                destination: "/app/chat.sendMessage",
                body: JSON.stringify(message),
            })
            setText("")
        } else if (!sender.trim()){
            alert("Please enter a sender name.")
        } else if (!clientRef.current || !clientRef.current.connected) {
            alert("STOMP client is not connected.")
        }
    }

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-2xl h-[90vh] flex flex-col">
                <CardHeader>
                    <CardTitle>STOMP Chat</CardTitle>
                    <CardDescription>Connection Status: {connectionStatus}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto p-4">
                    <div className="flex flex-col gap-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === sender ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-2 rounded-lg ${msg.sender === sender ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                    <strong>{msg.sender}:</strong> {msg.text}
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
                                onChange={(e) => setSender(e.target.value)}
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
