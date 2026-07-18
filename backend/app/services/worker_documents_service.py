from app.schemas.worker_documents_schema import (
    WorkerDocumentResponse,
    WorkerDocumentsResponse,
    WorkerDocumentsSummaryResponse,
)


class WorkerDocumentsService:
    def get_documents(
        self,
        worker_id: int,
    ) -> WorkerDocumentsResponse:
        documents = [
            WorkerDocumentResponse(
                id=1,
                title="Cartão de Cidadão",
                category="Identificação",
                status="valid",
                expiry_date="18/09/2029",
                description=(
                    "Documento de identificação "
                    "validado."
                ),
            ),
            WorkerDocumentResponse(
                id=2,
                title=(
                    "Seguro de acidentes "
                    "de trabalho"
                ),
                category="Seguro",
                status="expiring",
                expiry_date="22/08/2026",
                description=(
                    "Renovação necessária antes "
                    "da data de validade."
                ),
            ),
            WorkerDocumentResponse(
                id=3,
                title="Certificado de segurança",
                category="Formação",
                status="valid",
                expiry_date="10/04/2028",
                description=(
                    "Formação de segurança "
                    "em obra concluída."
                ),
            ),
            WorkerDocumentResponse(
                id=4,
                title="Contrato de trabalho",
                category="Contrato",
                status="pending",
                expiry_date=None,
                description=(
                    "A aguardar assinatura "
                    "da empresa."
                ),
            ),
        ]

        valid_documents = sum(
            document.status == "valid"
            for document in documents
        )

        expiring_documents = sum(
            document.status == "expiring"
            for document in documents
        )

        pending_documents = sum(
            document.status == "pending"
            for document in documents
        )

        total_documents = len(documents)

        completion_percentage = (
            round(
                (
                    valid_documents
                    / total_documents
                )
                * 100
            )
            if total_documents
            else 0
        )

        summary = (
            WorkerDocumentsSummaryResponse(
                completion_percentage=(
                    completion_percentage
                ),
                total_documents=total_documents,
                valid_documents=valid_documents,
                expiring_documents=(
                    expiring_documents
                ),
                pending_documents=(
                    pending_documents
                ),
            )
        )

        return WorkerDocumentsResponse(
            summary=summary,
            documents=documents,
        )