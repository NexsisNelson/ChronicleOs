"""Local fallback storage helpers for ChronicleOS demo mode."""

from __future__ import annotations

import json
import mimetypes
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus, unquote_plus


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[4]


def memwal_store_dir() -> Path:
    return _repo_root() / "memwal_data"


def walrus_store_dir() -> Path:
    return _repo_root() / "walrus_data" / "blobs"


def encode_key(value: str) -> str:
    return quote_plus(value, safe="")


def decode_key(value: str) -> str:
    return unquote_plus(Path(value).stem)


def _ensure_directory(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_memwal_entry(key: str, data: Dict[str, Any], metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    agent = key.split(":", 1)[0] if ":" in key else "local"
    timestamp = datetime.utcnow().isoformat() + "Z"
    payload = {
        "key": key,
        "data": data,
        "metadata": metadata or {},
        "agent": agent,
        "timestamp": timestamp,
        "saved_at": timestamp,
        "proof": f"local:{encode_key(key)}",
    }
    target = _ensure_directory(memwal_store_dir()) / f"{encode_key(key)}.json"
    target.write_text(json.dumps(payload, indent=2, ensure_ascii=True), encoding="utf-8")
    return payload


def read_memwal_entry(key: str) -> Dict[str, Any]:
    target = memwal_store_dir() / f"{encode_key(key)}.json"
    if not target.exists():
        return {}
    return json.loads(target.read_text(encoding="utf-8"))


def list_memwal_keys(prefix: Optional[str] = None) -> List[str]:
    store = memwal_store_dir()
    if not store.exists():
        return []

    keys = [decode_key(path.name) for path in store.glob("*.json") if path.is_file()]
    if prefix:
        keys = [key for key in keys if key.startswith(prefix)]
    return sorted(keys)


def save_walrus_blob(filename: str, data: bytes, content_type: str) -> str:
    blob_name = Path(filename).name
    store = _ensure_directory(walrus_store_dir())
    blob_path = store / blob_name
    blob_path.write_bytes(data)

    metadata_path = store / f"{blob_name}.meta.json"
    metadata_path.write_text(
        json.dumps(
            {
                "cid": f"local://{blob_name}",
                "name": blob_name,
                "size": len(data),
                "mimeType": content_type or mimetypes.guess_type(blob_name)[0] or "application/octet-stream",
                "createdAt": datetime.utcnow().isoformat() + "Z",
            },
            indent=2,
            ensure_ascii=True,
        ),
        encoding="utf-8",
    )
    return f"local://{blob_name}"


def read_walrus_blob(cid: str) -> bytes:
    blob_name = Path(cid.replace("local://", "", 1)).name
    blob_path = walrus_store_dir() / blob_name
    return blob_path.read_bytes()
