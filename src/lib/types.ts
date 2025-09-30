export type LoginResponse = {
    ok: boolean,
    data: {
        user: {
            id: number,
            userId: string,
            socialId: string,
            name: string,
            email: string,
            role: string,
            digitalLevel: number,
            createdAt: string
        }
    }
};

export type Message = {
    sender: string,
    content: string
};

export type LoadLastMessagesResponse = {
    code: number,
    message: string,
    data: Message[]
};