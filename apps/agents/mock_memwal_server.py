#!/usr/bin/env python3
"""
Mock MemWal server for local development and testing.

Provides HTTP endpoints that mimic the MemWal API without requiring
a full MemWal instance. Data is stored in-memory and persisted to JSON.
"""

import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import uuid4

from aiohttp import web

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# In-memory storage
MEMORY_STORE: Dict[str, Dict[str, Any]] = {}
DATA_DIR = Path("./memwal_data")
DATA_FILE = DATA_DIR / "store.json"


def load_store() -> None:
    """Load memory store from disk if it exists."""
    global MEMORY_STORE
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, "r") as f:
                MEMORY_STORE = json.load(f)
            logger.info(f"✓ Loaded {len(MEMORY_STORE)} items from {DATA_FILE}")
        except Exception as e:
            logger.error(f"Failed to load store: {e}")
            MEMORY_STORE = {}
    else:
        MEMORY_STORE = {}


def save_store() -> None:
    """Persist memory store to disk."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    try:
        with open(DATA_FILE, "w") as f:
            json.dump(MEMORY_STORE, f, indent=2, default=str)
        logger.debug(f"✓ Saved {len(MEMORY_STORE)} items to {DATA_FILE}")
    except Exception as e:
        logger.error(f"Failed to save store: {e}")


async def health_handler(request: web.Request) -> web.Response:
    """Health check endpoint."""
    return web.json_response({
        "status": "healthy",
        "service": "mock-memwal",
        "timestamp": datetime.utcnow().isoformat()
    })


async def save_memory_handler(request: web.Request) -> web.Response:
    """
    POST /memory/save - Save a key-value pair.
    
    Request body:
    {
        "key": "research:task-123",
        "data": {...},
        "metadata": {...},
        "timestamp": "2026-06-16T..."
    }
    """
    try:
        body = await request.json()
        key = body.get("key")
        data = body.get("data")
        metadata = body.get("metadata", {})
        timestamp = body.get("timestamp", datetime.utcnow().isoformat())
        
        if not key:
            return web.json_response(
                {"error": "Missing 'key' field"},
                status=400
            )
        
        # Store the data
        proof = f"proof-{uuid4()}"
        MEMORY_STORE[key] = {
            "data": data,
            "metadata": metadata,
            "saved_at": timestamp,
            "proof": proof
        }
        save_store()
        
        logger.info(f"✓ Saved memory: {key}")
        return web.json_response({
            "success": True,
            "key": key,
            "proof": proof,
            "timestamp": timestamp
        })
    except Exception as e:
        logger.error(f"Error saving memory: {e}")
        return web.json_response(
            {"error": str(e)},
            status=500
        )


async def read_memory_by_key_handler(request: web.Request) -> web.Response:
    """
    GET /memory/{key} - Read a stored key-value pair.
    """
    try:
        key = request.match_info.get("key")
        
        if not key:
            return web.json_response(
                {"error": "Missing key in path"},
                status=400
            )
        
        if key not in MEMORY_STORE:
            return web.json_response(
                {"error": f"Key not found: {key}"},
                status=404
            )
        
        entry = MEMORY_STORE[key]
        logger.info(f"✓ Read memory: {key}")
        return web.json_response({
            "key": key,
            "data": entry["data"],
            "metadata": entry["metadata"],
            "proof": entry["proof"],
            "saved_at": entry["saved_at"]
        })
    except Exception as e:
        logger.error(f"Error reading memory: {e}")
        return web.json_response(
            {"error": str(e)},
            status=500
        )


async def list_memory_keys_handler(request: web.Request) -> web.Response:
    """
    GET /memory/keys - List all stored keys.
    """
    try:
        prefix = request.rel_url.query.get("prefix", "")
        keys = [k for k in MEMORY_STORE.keys() if k.startswith(prefix)]
        logger.info(f"✓ Listed {len(keys)} memory keys (prefix: {prefix})")
        return web.json_response({
            "keys": keys,
            "count": len(keys)
        })
    except Exception as e:
        logger.error(f"Error listing memory keys: {e}")
        return web.json_response(
            {"error": str(e)},
            status=500
        )


async def list_memory_handler(request: web.Request) -> web.Response:
    """
    GET /memory/list - List all stored keys (legacy endpoint).
    """
    try:
        prefix = request.rel_url.query.get("prefix", "")
        keys = [k for k in MEMORY_STORE.keys() if k.startswith(prefix)]
        logger.info(f"✓ Listed {len(keys)} memory keys (prefix: {prefix})")
        return web.json_response({
            "keys": keys,
            "count": len(keys)
        })
    except Exception as e:
        logger.error(f"Error listing memory: {e}")
        return web.json_response(
            {"error": str(e)},
            status=500
        )


async def verify_proof_handler(request: web.Request) -> web.Response:
    """
    POST /memory/verify - Verify a memory proof (mock implementation).
    
    Request body:
    {
        "key": "research:task-123",
        "proof": "proof-xxx"
    }
    """
    try:
        body = await request.json()
        key = body.get("key")
        proof = body.get("proof")
        
        if not key or not proof:
            return web.json_response(
                {"error": "Missing 'key' or 'proof' field"},
                status=400
            )
        
        if key not in MEMORY_STORE:
            return web.json_response(
                {"verified": False, "reason": "Key not found"},
                status=404
            )
        
        entry = MEMORY_STORE[key]
        verified = entry.get("proof") == proof
        
        logger.info(f"✓ Verified proof for {key}: {verified}")
        return web.json_response({
            "verified": verified,
            "key": key,
            "proof": entry["proof"]
        })
    except Exception as e:
        logger.error(f"Error verifying proof: {e}")
        return web.json_response(
            {"error": str(e)},
            status=500
        )


async def clear_memory_handler(request: web.Request) -> web.Response:
    """
    DELETE /memory/clear - Clear all stored data (for testing).
    """
    global MEMORY_STORE
    try:
        count = len(MEMORY_STORE)
        MEMORY_STORE = {}
        save_store()
        logger.info(f"✓ Cleared {count} memory entries")
        return web.json_response({
            "success": True,
            "cleared": count
        })
    except Exception as e:
        logger.error(f"Error clearing memory: {e}")
        return web.json_response(
            {"error": str(e)},
            status=500
        )


async def start_server(host: str = "0.0.0.0", port: int = 8000) -> None:
    """Start the mock MemWal server."""
    load_store()
    
    app = web.Application()
    
    # Routes matching MemWal adapter client expectations
    app.router.add_get("/health", health_handler)
    app.router.add_post("/memory/save", save_memory_handler)
    app.router.add_get("/memory/{key}", read_memory_by_key_handler)
    app.router.add_get("/memory/keys", list_memory_keys_handler)
    app.router.add_get("/memory/list", list_memory_handler)
    app.router.add_post("/memory/verify", verify_proof_handler)
    app.router.add_delete("/memory/clear", clear_memory_handler)
    
    runner = web.AppRunner(app)
    await runner.setup()
    
    site = web.TCPSite(runner, host, port)
    await site.start()
    
    logger.info(f"🚀 Mock MemWal server started on http://{host}:{port}")
    logger.info(f"📁 Data directory: {DATA_DIR.absolute()}")
    logger.info(f"💾 Data file: {DATA_FILE.absolute()}")
    logger.info("")
    logger.info("Available endpoints:")
    logger.info("  GET  /health              - Health check")
    logger.info("  POST /memory/save         - Save memory")
    logger.info("  GET  /memory/{key}        - Read memory by key")
    logger.info("  GET  /memory/keys         - List keys")
    logger.info("  GET  /memory/list         - List keys (legacy)")
    logger.info("  POST /memory/verify       - Verify proof")
    logger.info("  DELETE /memory/clear      - Clear all data")
    logger.info("")
    
    try:
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        logger.info("⏹️  Shutting down...")
        await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(start_server(host="127.0.0.1", port=8000))
