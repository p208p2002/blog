from typing import Union

from fastapi import FastAPI,HTTPException
import os
from fastapi.responses import FileResponse, PlainTextResponse
import mimetypes
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 加入 CORS middleware，允許所有來源
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

@app.get("/docs")
def list_docs():
    docs = os.listdir("public/docs")
    return {"docs": docs}

@app.get("/docs/{doc_name}")
def list_doc(doc_name: str):
    dir_path = f"public/docs/{doc_name}"
    files = os.listdir(dir_path)
    return {"files": files}

@app.get("/docs/{doc_name}/{file_name}")
def get_doc_file(doc_name: str, file_name: str):
    file_path = f"public/docs/{doc_name}/{file_name}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type and mime_type.startswith("text"):
        with open(file_path, 'r', encoding="utf-8") as file:
            content = file.read()
        return PlainTextResponse(content)
    else:
        return FileResponse(file_path, media_type=mime_type)

@app.post("/docs/{doc_name}/document.md")
def create_doc_file(doc_name: str, content: str):
    dir_path = f"public/docs/{doc_name}"
    assert os.path.exists(dir_path), "Directory does not exist"
    
    file_path = os.path.join(dir_path, "document.md")
    with open(file_path, 'w', encoding="utf-8") as file:
        file.write(content)
    
    return {"message": "File created successfully", "file_path": file_path}
