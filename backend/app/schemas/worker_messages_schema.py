from pydantic import BaseModel


class WorkerMessageResponse(BaseModel):
    id: int
    sender: str
    role: str
    preview: str
    time: str
    unread: int
    online: bool


class WorkerMessagesResponse(BaseModel):
    unread_total: int
    messages: list[WorkerMessageResponse]