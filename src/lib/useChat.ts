"use client"
import { Client } from "@stomp/stompjs"
import { useRef, useState } from "react"
import SockJS from "sockjs-client"
import { toast } from "sonner"
import { LoadLastMessagesResponse, Message } from "./types"

const NO_ATTACHMENT = 0
const URL = "http://localhost:8080"

export default function useChat(){
    const [connectionStatus, setConnectionStatus] = useState("Disconnected");
    const clientRef = useRef<Client | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    const loadLastMessages = async (roomId: string)=>{
        const response = await fetch(`${URL}/api/v1/chat/mentor/message/${roomId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });
        if (!response.ok) {
            toast.error("Failed to load previous messages.");
            return;
        }
        const responseData:LoadLastMessagesResponse = await response.json();
        setMessages(responseData.data);
    }

    const connect = (roomId: string) => {
        if (!roomId.trim()) {
            toast.warning("Please enter a Room ID.");
            return;
        }
        setConnectionStatus("Connecting...");
        toast.info("Connecting to the server...");
        const client = new Client({
            webSocketFactory: () => new SockJS(`${URL}/api/v1/ws`),
            debug: (str) => console.log(new Date(), str),
            reconnectDelay: 0, // 자동 재연결 방지
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            connectHeaders: {
                roomId: roomId // 상태에서 Room ID 사용
            }
        });

        client.onConnect = (frame) => {
            setConnectionStatus("Connected");
            toast.success(`Connected to room ${roomId}!`);
            // 상태에서 Room ID를 사용하여 토픽 구독
            client.subscribe(`/api/v1/chat/topic/${roomId}`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                setMessages((prevMessages) => [...prevMessages, receivedMessage]);
            })
            loadLastMessages(roomId);
        }

        client.onStompError = (frame) => {
            const errorMessage = frame.headers["message"];
            setConnectionStatus("Error");
            toast.error(`Connection Error: ${errorMessage}`);
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

        client.activate();
        clientRef.current = client;
    }

    const disconnect = () => {
        if (clientRef.current) {
            if (connectionStatus === 'Connecting...') {
                toast.info("Connection attempt cancelled.");
                setConnectionStatus('Disconnected'); // 상태를 즉시 리셋
            }
            clientRef.current.deactivate();
        }
    }

    const sendMessage = (text:string,roomId:string) => {
        if (clientRef.current && clientRef.current.connected && text !== "") {
            const message = {  
                content:text,
                attachmentId:NO_ATTACHMENT
            };
            // 상태에서 Room ID를 사용하여 메시지 전송
            clientRef.current.publish({
                destination: `/api/v1/chat/app/send`,
                body: JSON.stringify(message),
                headers: { roomId: roomId }
            });
        } else if (!clientRef.current || !clientRef.current.connected) {
            toast.error("STOMP client is not connected.");
            setConnectionStatus("Disconnected");
            clientRef.current?.deactivate();
        }
    }

    return {connectionStatus, connect, disconnect, sendMessage, messages, clientRef};
}