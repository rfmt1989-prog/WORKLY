from typing import Literal

from pydantic import BaseModel


DocumentStatus = Literal[
    "valid",
    "expiring",
    "pending",
]


class WorkerDocumentResponse(BaseModel):
    id: int
    title: str
    category: str
    status: DocumentStatus
    description: str
    expiry_date: str | None = None


class WorkerDocumentsSummaryResponse(BaseModel):
    completion_percentage: int
    total_documents: int
    valid_documents: int
    expiring_documents: int
    pending_documents: int


class WorkerDocumentsResponse(BaseModel):
    summary: WorkerDocumentsSummaryResponse
    documents: list[WorkerDocumentResponse]