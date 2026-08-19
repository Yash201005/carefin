import logging
import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.models import Document, InsurancePolicy, User
from app.schemas.security import DocumentUploadResponse, InsurancePolicyResponse

router = APIRouter()
logger = logging.getLogger(__name__)

# Security config
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".txt", ".docx"}
UPLOAD_DIR = "uploads"

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

def validate_magic_bytes(content: bytes) -> bool:
    """
    Validates file headers against executable magic bytes to reject dangerous uploads.
    """
    if len(content) < 4:
        return False
    # Reject common executable signatures:
    if content.startswith(b"MZ"):  # Windows EXE/DLL
        return False
    if content.startswith(b"\x7fELF"):  # Linux Executable
        return False
    return not content.startswith(b"\xca\xfe\xba\xbe")  # Java class

@router.get("", response_model=list[DocumentUploadResponse])
def get_user_documents(
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db)  # noqa: B008
):
    """
    Retrieves all documents belonging to the authenticated user.
    """
    return db.query(Document).filter(Document.owner_id == current_user.id).all()

@router.post("", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),  # noqa: B008
    document_type: str = Form(...),
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db)  # noqa: B008
):
    """
    Validates and stores an uploaded document in the vault.
    """
    # 1. Path traversal check & filename extraction
    raw_filename = file.filename
    if not raw_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing."
        )
    
    # Extract only the base name to prevent path traversal attack (e.g. ../../../etc/passwd)
    safe_filename = os.path.basename(raw_filename)
    
    # 2. Extension check
    _, ext = os.path.splitext(safe_filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extension {ext} is not supported. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 3. Read content and validate size & magic bytes
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the maximum limit of 10MB."
        )
        
    if not validate_magic_bytes(content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type is invalid or rejected as a security threat."
        )

    # 4. Save to secure uploads folder with UUID to prevent naming collision
    storage_name = f"{uuid.uuid4()}{ext}"
    storage_path = os.path.join(UPLOAD_DIR, storage_name)
    
    try:
        with open(storage_path, "wb") as f:  # noqa: ASYNC230
            f.write(content)
    except Exception as e:  # noqa: BLE001
        logger.error(f"Failed to write file to disk: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while saving the file."
        )

    # 5. Insert Document metadata record into DB
    doc_record = Document(
        filename=safe_filename,
        document_type=document_type,
        file_size=len(content),
        processing_status="PROCESSED",
        owner_id=current_user.id,
        source="USER UPLOAD",
        verification_status="UNVERIFIED",
        storage_path=storage_path
    )
    db.add(doc_record)
    db.commit()
    db.refresh(doc_record)
    return doc_record

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db)  # noqa: B008
):
    """
    Deletes a document from the vault after verifying ownership.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
        
    # Security check: User must own the document to delete it! (Prevents IDOR)
    if doc.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this document."
        )

    # Remove file from storage
    if os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
        except Exception as e:  # noqa: BLE001
            logger.error(f"Failed to delete file from disk: {e!s}")
            
    db.delete(doc)
    db.commit()
    return {"detail": "Document successfully deleted."}

@router.get("/policies", response_model=list[InsurancePolicyResponse])
def get_user_policies(
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db)  # noqa: B008
):
    """
    Retrieves all insurance policies belonging to the authenticated user.
    """
    return db.query(InsurancePolicy).filter(InsurancePolicy.owner_id == current_user.id).all()
