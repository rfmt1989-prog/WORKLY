from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    content = target.read_text(encoding="utf-8")
    if old not in content:
        raise SystemExit(f"Pattern not found in {path}: {old[:120]!r}")
    target.write_text(content.replace(old, new, 1), encoding="utf-8")


# ----------------------------- PostgreSQL file store -----------------------------
replace_once(
    "backend/app/persistence.py",
    '''        self._memory_memberships: dict[tuple[str, str], dict[str, Any]] = {}\n        self._memory_invitations: dict[str, dict[str, Any]] = {}\n''',
    '''        self._memory_memberships: dict[tuple[str, str], dict[str, Any]] = {}\n        self._memory_invitations: dict[str, dict[str, Any]] = {}\n        self._memory_files: dict[str, dict[str, Any]] = {}\n''',
)

replace_once(
    "backend/app/persistence.py",
    '''        conn.execute(\n            """\n            CREATE TABLE IF NOT EXISTS workly_company_memberships (\n''',
    '''        conn.execute(\n            """\n            CREATE TABLE IF NOT EXISTS workly_files (\n                id TEXT PRIMARY KEY,\n                company_id TEXT,\n                owner_type TEXT NOT NULL,\n                owner_id TEXT NOT NULL,\n                file_name TEXT NOT NULL,\n                content_type TEXT NOT NULL,\n                size_bytes INTEGER NOT NULL,\n                content BYTEA NOT NULL,\n                created_by TEXT NOT NULL,\n                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n            )\n            """\n        )\n        conn.execute(\n            """\n            CREATE INDEX IF NOT EXISTS idx_workly_files_owner\n            ON workly_files (owner_type, owner_id, created_at DESC)\n            """\n        )\n        conn.execute(\n            """\n            CREATE TABLE IF NOT EXISTS workly_company_memberships (\n''',
)

replace_once(
    "backend/app/persistence.py",
    '''        if not self.enabled:\n            self._memory_memberships.clear()\n            self._memory_invitations.clear()\n\n    def upsert_membership''',
    '''        if not self.enabled:\n            self._memory_memberships.clear()\n            self._memory_invitations.clear()\n            self._memory_files.clear()\n\n    def save_file(self, record: dict[str, Any], content: bytes) -> bool:\n        stored = {**deepcopy(record), "content": bytes(content)}\n        self._memory_files[str(record["id"])] = stored\n        if not self.enabled:\n            return True\n        try:\n            with self._connect() as conn:\n                self._ensure_schema(conn)\n                conn.execute(\n                    """\n                    INSERT INTO workly_files\n                        (id, company_id, owner_type, owner_id, file_name, content_type,\n                         size_bytes, content, created_by, created_at)\n                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())\n                    ON CONFLICT (id) DO UPDATE SET\n                        company_id = EXCLUDED.company_id,\n                        owner_type = EXCLUDED.owner_type,\n                        owner_id = EXCLUDED.owner_id,\n                        file_name = EXCLUDED.file_name,\n                        content_type = EXCLUDED.content_type,\n                        size_bytes = EXCLUDED.size_bytes,\n                        content = EXCLUDED.content,\n                        created_by = EXCLUDED.created_by\n                    """,\n                    (\n                        record["id"],\n                        record.get("company_id"),\n                        record["owner_type"],\n                        record["owner_id"],\n                        record["file_name"],\n                        record["content_type"],\n                        record["size_bytes"],\n                        bytes(content),\n                        record["created_by"],\n                    ),\n                )\n                conn.commit()\n            self.connected = True\n            self.last_error = None\n            return True\n        except Exception as exc:\n            self.connected = False\n            self.last_error = type(exc).__name__\n            return False\n\n    def get_file(self, file_id: str) -> dict[str, Any] | None:\n        if not self.enabled:\n            value = self._memory_files.get(file_id)\n            return deepcopy(value) if value else None\n        try:\n            with self._connect() as conn:\n                self._ensure_schema(conn)\n                row = conn.execute(\n                    """\n                    SELECT id, company_id, owner_type, owner_id, file_name, content_type,\n                           size_bytes, content, created_by\n                    FROM workly_files WHERE id = %s\n                    """,\n                    (file_id,),\n                ).fetchone()\n            self.connected = True\n            self.last_error = None\n            if not row:\n                return None\n            fields = (\n                "id", "company_id", "owner_type", "owner_id", "file_name",\n                "content_type", "size_bytes", "content", "created_by"\n            )\n            value = dict(zip(fields, row))\n            value["content"] = bytes(value["content"])\n            self._memory_files[file_id] = deepcopy(value)\n            return value\n        except Exception as exc:\n            self.connected = False\n            self.last_error = type(exc).__name__\n            value = self._memory_files.get(file_id)\n            return deepcopy(value) if value else None\n\n    def delete_file(self, file_id: str) -> bool:\n        self._memory_files.pop(file_id, None)\n        if not self.enabled:\n            return True\n        try:\n            with self._connect() as conn:\n                self._ensure_schema(conn)\n                conn.execute("DELETE FROM workly_files WHERE id = %s", (file_id,))\n                conn.commit()\n            self.connected = True\n            self.last_error = None\n            return True\n        except Exception as exc:\n            self.connected = False\n            self.last_error = type(exc).__name__\n            return False\n\n    def upsert_membership''',
)

# ----------------------------- API contract + routes -----------------------------
replace_once(
    "backend/app/main.py",
    '''import base64\nimport hashlib\n''',
    '''import base64\nimport binascii\nimport hashlib\n''',
)

replace_once(
    "backend/app/main.py",
    '''GEOFENCE_RADIUS_M = 250.0\nTOKEN_SECRET = os.getenv(\n''',
    '''GEOFENCE_RADIUS_M = 250.0\nMAX_DOCUMENT_BYTES = 2 * 1024 * 1024\nALLOWED_DOCUMENT_CONTENT_TYPES = {\n    "application/pdf", "image/jpeg", "image/png", "image/webp"\n}\nALLOWED_DOCUMENT_CATEGORIES = {\n    "identity", "insurance", "medical", "safety", "technical",\n    "planning", "legal", "license", "other"\n}\nTOKEN_SECRET = os.getenv(\n''',
)

replace_once(
    "backend/app/main.py",
    '''class CompanyMemberPatch(BaseModel):\n    access_role: str = Field(max_length=30)\n\n\ndef _b64encode''',
    '''class CompanyMemberPatch(BaseModel):\n    access_role: str = Field(max_length=30)\n\n\nclass FileUploadInput(BaseModel):\n    owner_type: str = Field(max_length=20)\n    owner_id: str = Field(min_length=1, max_length=100)\n    title: str = Field(min_length=1, max_length=180)\n    category: str = Field(default="other", max_length=40)\n    expires_at: str | None = Field(default=None, max_length=40)\n    file_name: str = Field(min_length=1, max_length=180)\n    content_type: str = Field(max_length=100)\n    content_base64: str = Field(min_length=1)\n\n\ndef _b64encode''',
)

replace_once(
    "backend/app/main.py",
    '''    if path.startswith(f"{API_PREFIX}/documents") or path.startswith(f"{API_PREFIX}/certificates"):\n        return "documents.manage" if method in {"POST", "PATCH", "DELETE"} else "documents.read"\n''',
    '''    if path.startswith(f"{API_PREFIX}/files"):\n        return "documents.manage" if method in {"POST", "PATCH", "DELETE"} else "documents.read"\n    if path.startswith(f"{API_PREFIX}/documents") or path.startswith(f"{API_PREFIX}/certificates"):\n        return "documents.manage" if method in {"POST", "PATCH", "DELETE"} else "documents.read"\n''',
)

# Add file authorization helpers before get_current_user.
replace_once(
    "backend/app/main.py",
    '''def get_current_user(\n    authorization: Annotated[str | None, Header()] = None,\n) -> dict[str, Any]:\n''',
    '''def _file_owner_company_id(owner_type: str, owner_id: str) -> str | None:\n    if owner_type == "company":\n        return owner_id\n    if owner_type == "project":\n        project = next((item for item in _state["projects"] if item.get("id") == owner_id), None)\n        return str(project.get("company_id")) if project and project.get("company_id") else None\n    worker = next((item for item in _state["workers"] if item.get("id") == owner_id), None)\n    if worker and worker.get("company_id"):\n        return str(worker.get("company_id"))\n    companies = _company_ids_for_worker(owner_id)\n    return sorted(companies)[0] if companies else None\n\n\ndef _authorize_file_owner(\n    user: dict[str, Any], owner_type: str, owner_id: str, *, manage: bool\n) -> None:\n    if owner_type not in {"worker", "company", "project"}:\n        raise HTTPException(status_code=422, detail="Destino documental inválido.")\n    if user["role"] == "worker":\n        if owner_type == "worker" and owner_id == user["sub"]:\n            return\n        if not manage and owner_type == "project":\n            project = _find("projects", owner_id)\n            _assert_project_visible(user, project)\n            return\n        raise HTTPException(status_code=403, detail="Documento não autorizado.")\n\n    _require_company_permission(user, "documents.manage" if manage else "documents.read")\n    company_id = str(user.get("company_id") or "")\n    if owner_type == "company":\n        if owner_id != company_id:\n            raise HTTPException(status_code=403, detail="Documento de outra empresa.")\n        return\n    if owner_type == "project":\n        project = _find("projects", owner_id)\n        if project.get("company_id") != company_id:\n            raise HTTPException(status_code=403, detail="Documento de outra empresa.")\n        return\n    if owner_id not in _company_worker_ids(company_id):\n        raise HTTPException(status_code=403, detail="Documento de outro trabalhador.")\n\n\ndef _owner_document_list(owner_type: str, owner_id: str) -> list[dict[str, Any]]:\n    collection = "workers" if owner_type == "worker" else "companies" if owner_type == "company" else "projects"\n    entity = _find(collection, owner_id)\n    return entity.setdefault("documents", [])\n\n\ndef _find_document_by_file_id(file_id: str) -> tuple[list[dict[str, Any]], dict[str, Any]] | None:\n    for collection in ("workers", "companies", "projects"):\n        for entity in _state.get(collection, []):\n            documents = entity.get("documents") or []\n            for document in documents:\n                if document.get("file_id") == file_id:\n                    return documents, document\n    return None\n\n\ndef get_current_user(\n    authorization: Annotated[str | None, Header()] = None,\n) -> dict[str, Any]:\n''',
)

# Insert actual file endpoints before /documents.
replace_once(
    "backend/app/main.py",
    '''@app.get(f"{API_PREFIX}/documents", tags=["Documents"])\ndef list_documents(\n''',
    '''@app.post(f"{API_PREFIX}/files", tags=["Documents"])\ndef upload_document_file(\n    data: FileUploadInput,\n    user: Annotated[dict[str, Any], Depends(get_current_user)],\n) -> dict[str, Any]:\n    owner_type = data.owner_type.strip().lower()\n    owner_id = data.owner_id.strip()\n    category = data.category.strip().lower() or "other"\n    _authorize_file_owner(user, owner_type, owner_id, manage=True)\n    if category not in ALLOWED_DOCUMENT_CATEGORIES:\n        raise HTTPException(status_code=422, detail="Categoria documental inválida.")\n    content_type = data.content_type.split(";", 1)[0].strip().lower()\n    if content_type not in ALLOWED_DOCUMENT_CONTENT_TYPES:\n        raise HTTPException(status_code=415, detail="Formato não suportado. Utilize PDF, JPG, PNG ou WEBP.")\n    try:\n        content = base64.b64decode(data.content_base64, validate=True)\n    except (ValueError, binascii.Error) as exc:\n        raise HTTPException(status_code=422, detail="Conteúdo do ficheiro inválido.") from exc\n    if not content or len(content) > MAX_DOCUMENT_BYTES:\n        raise HTTPException(status_code=413, detail="O ficheiro deve ter no máximo 2 MB.")\n    expires_at = (data.expires_at or "").strip()\n    if expires_at:\n        try:\n            datetime.fromisoformat(expires_at[:10])\n        except ValueError as exc:\n            raise HTTPException(status_code=422, detail="Data de validade inválida.") from exc\n    safe_name = "".join(\n        char if char.isalnum() or char in {".", "-", "_"} else "-"\n        for char in data.file_name.strip()\n    )[-140:] or "workly-file"\n    file_id = f"file-{uuid.uuid4().hex}"\n    company_id = _file_owner_company_id(owner_type, owner_id)\n    file_record = {\n        "id": file_id,\n        "company_id": company_id,\n        "owner_type": owner_type,\n        "owner_id": owner_id,\n        "file_name": safe_name,\n        "content_type": content_type,\n        "size_bytes": len(content),\n        "created_by": user["sub"],\n    }\n    if not _persistence.save_file(file_record, content):\n        raise HTTPException(status_code=503, detail="Armazenamento documental indisponível.")\n    document = {\n        "id": f"doc-{uuid.uuid4().hex[:16]}",\n        "owner_type": owner_type,\n        "owner_id": owner_id,\n        "title": data.title.strip(),\n        "category": category,\n        "file_name": safe_name,\n        "status": "valid",\n        "updated_at": _now_iso(),\n        "demo_content": "Ficheiro real armazenado de forma autenticada na WORKLY.",\n        "file_id": file_id,\n        "content_type": content_type,\n        "size_bytes": len(content),\n    }\n    if expires_at:\n        document["expires_at"] = expires_at[:10]\n    with _state_lock:\n        _owner_document_list(owner_type, owner_id).insert(0, document)\n    return {"document": deepcopy(document)}\n\n\n@app.get(f"{API_PREFIX}/files/{{file_id}}/content", tags=["Documents"])\ndef get_document_file_content(\n    file_id: str,\n    user: Annotated[dict[str, Any], Depends(get_current_user)],\n) -> dict[str, Any]:\n    stored = _persistence.get_file(file_id)\n    if not stored:\n        raise HTTPException(status_code=404, detail="Ficheiro não encontrado.")\n    _authorize_file_owner(\n        user, str(stored["owner_type"]), str(stored["owner_id"]), manage=False\n    )\n    content = bytes(stored["content"])\n    return {\n        "file_id": stored["id"],\n        "file_name": stored["file_name"],\n        "content_type": stored["content_type"],\n        "size_bytes": stored["size_bytes"],\n        "content_base64": base64.b64encode(content).decode("ascii"),\n    }\n\n\n@app.delete(f"{API_PREFIX}/files/{{file_id}}", tags=["Documents"])\ndef delete_document_file(\n    file_id: str,\n    user: Annotated[dict[str, Any], Depends(get_current_user)],\n) -> dict[str, bool]:\n    stored = _persistence.get_file(file_id)\n    if not stored:\n        raise HTTPException(status_code=404, detail="Ficheiro não encontrado.")\n    _authorize_file_owner(\n        user, str(stored["owner_type"]), str(stored["owner_id"]), manage=True\n    )\n    if not _persistence.delete_file(file_id):\n        raise HTTPException(status_code=503, detail="Não foi possível remover o ficheiro.")\n    with _state_lock:\n        found = _find_document_by_file_id(file_id)\n        if found:\n            documents, document = found\n            documents.remove(document)\n    return {"ok": True}\n\n\n@app.get(f"{API_PREFIX}/documents", tags=["Documents"])\ndef list_documents(\n''',
)

# ----------------------------- Frontend metadata + UX -----------------------------
replace_once(
    "frontend/src/demo/types.ts",
    '''  demo_content: string;\n};\n''',
    '''  demo_content: string;\n  file_id?: string;\n  content_type?: string;\n  size_bytes?: number;\n  expires_at?: string;\n};\n''',
)

replace_once(
    "frontend/src/components/workspace/DocumentsView.tsx",
    '''import Ionicons from "@expo/vector-icons/Ionicons";\n\nimport { useAuth } from "@/src/context/AuthContext";\n''',
    '''import Ionicons from "@expo/vector-icons/Ionicons";\n\nimport { openWorklyFile } from "@/src/api/documentFiles";\nimport { useAuth } from "@/src/context/AuthContext";\n''',
)
replace_once(
    "frontend/src/components/workspace/DocumentsView.tsx",
    '''import {\n  Button,\n''',
    '''import { DocumentUploadButton } from "./DocumentUploadButton";\n\nimport {\n  Button,\n''',
)
replace_once(
    "frontend/src/components/workspace/DocumentsView.tsx",
    '''  meta: string[];\n};\n''',
    '''  meta: string[];\n  fileId?: string;\n  realFile?: boolean;\n};\n''',
)
replace_once(
    "frontend/src/components/workspace/DocumentsView.tsx",
    '''      meta: [\n        ownerName,\n        categoryLabel(document.category, language),\n        `${uiText(language, "Atualizado", "Updated")} ${document.updated_at.slice(0, 10)}`,\n      ],\n    });\n''',
    '''      meta: [\n        ownerName,\n        categoryLabel(document.category, language),\n        `${uiText(language, "Atualizado", "Updated")} ${document.updated_at.slice(0, 10)}`,\n        ...(document.size_bytes ? [`${Math.ceil(document.size_bytes / 1024)} KB`] : []),\n      ],\n      fileId: document.file_id,\n      realFile: Boolean(document.file_id),\n    });\n''',
)

# Upload controls next to each active entity.
replace_once(
    "frontend/src/components/workspace/DocumentsView.tsx",
    '''                      <View style={styles.documentList}>\n                        {activeWorker.documents.length ? (\n''',
    '''                      {(user.role === "worker" && activeWorker.id === user.id) ||\n                      (user.role === "company" && user.permissions?.includes("documents.manage")) ? (\n                        <View style={styles.uploadRow}>\n                          <DocumentUploadButton\n                            ownerType="worker"\n                            ownerId={activeWorker.id}\n                            language={language}\n                            accent={accent}\n                          />\n                        </View>\n                      ) : null}\n                      <View style={styles.documentList}>\n                        {activeWorker.documents.length ? (\n''',
)
replace_once(
    "frontend/src/components/workspace/DocumentsView.tsx",
    '''                      <View style={styles.documentList}>\n                        {projectDocuments(activeProject, language).map((document) => (\n''',
    '''                      {user.role === "company" && user.permissions?.includes("documents.manage") ? (\n                        <View style={styles.uploadRow}>\n                          <DocumentUploadButton\n                            ownerType="project"\n                            ownerId={activeProject.id}\n                            language={language}\n                            accent={accent}\n                          />\n                        </View>\n                      ) : null}\n                      <View style={styles.documentList}>\n                        {projectDocuments(activeProject, language).map((document) => (\n''',
)
replace_once(
    "frontend/src/components/workspace/DocumentsView.tsx",
    '''                <View style={styles.documentList}>\n                  {companyDocuments.length ? (\n''',
    '''                {company && user.permissions?.includes("documents.manage") ? (\n                  <View style={styles.uploadRow}>\n                    <DocumentUploadButton\n                      ownerType="company"\n                      ownerId={company.id}\n                      language={language}\n                      accent={accent}\n                    />\n                  </View>\n                ) : null}\n                <View style={styles.documentList}>\n                  {companyDocuments.length ? (\n''',
)

# Real-file action + notice in viewer.
replace_once(
    "frontend/src/components/workspace/DocumentsView.tsx",
    '''        footer={<Button label={t.close} variant="secondary" onPress={() => setViewer(null)} />}\n''',
    '''        footer={\n          <>\n            {viewer?.fileId ? (\n              <Button\n                label={uiText(language, "Abrir ficheiro", "Open file")}\n                icon="open-outline"\n                accent={accent}\n                onPress={() => void openWorklyFile(viewer.fileId!)}\n              />\n            ) : null}\n            <Button label={t.close} variant="secondary" onPress={() => setViewer(null)} />\n          </>\n        }\n''',
)
replace_once(
    "frontend/src/components/workspace/DocumentsView.tsx",
    '''          <View style={styles.demoNotice}>\n            <Ionicons name="information-circle-outline" size={18} color={workspaceColors.yellow} />\n            <Text style={styles.demoNoticeText}>\n              {uiText(language, "Conteúdo fictício criado exclusivamente para a demonstração WORKLY. Sem validade legal.", "Fictitious content created exclusively for the WORKLY demo. No legal validity.")}\n            </Text>\n          </View>\n''',
    '''          <View style={styles.demoNotice}>\n            <Ionicons\n              name={viewer?.realFile ? "shield-checkmark-outline" : "information-circle-outline"}\n              size={18}\n              color={viewer?.realFile ? workspaceColors.green : workspaceColors.yellow}\n            />\n            <Text style={styles.demoNoticeText}>\n              {viewer?.realFile\n                ? uiText(language, "Ficheiro real armazenado na WORKLY e protegido pela autenticação da conta.", "Real file stored in WORKLY and protected by account authentication.")\n                : uiText(language, "Conteúdo fictício criado exclusivamente para a demonstração WORKLY. Sem validade legal.", "Fictitious content created exclusively for the WORKLY demo. No legal validity.")}\n            </Text>\n          </View>\n''',
)
replace_once(
    "frontend/src/components/workspace/DocumentsView.tsx",
    '''  documentList: {\n''',
    '''  uploadRow: {\n    flexDirection: "row",\n    justifyContent: "flex-end",\n    marginTop: 12,\n  },\n  documentList: {\n''',
)

print("Real document storage integration applied")
