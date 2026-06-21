"""Configuration management for ChronicleOS agents."""

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings


class ChronicleConfig(BaseSettings):
    """Main configuration object for ChronicleOS."""
    
    # Walrus
    walrus_endpoint: Optional[str] = None
    walrus_publisher_endpoint: Optional[str] = "https://publisher.walrus-testnet.walrus.space"
    walrus_aggregator_endpoint: Optional[str] = "https://aggregator.walrus-testnet.walrus.space"
    walrus_upload_path: str = "/v1/blobs"
    walrus_download_path: str = "/v1/blobs/{cid}"
    walrus_metadata_path: str = "/v1/blobs/{cid}/metadata"
    walrus_gas_budget: int = 100_000_000
    
    # MemWal
    memwal_endpoint: str = "http://localhost:8000"
    memwal_private_key: Optional[str] = None
    memwal_account_id: Optional[str] = None
    memwal_server_url: Optional[str] = None
    memwal_namespace: str = "agents"
    
    # LLM
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    deepseek_api_key: Optional[str] = None
    primary_model: str = "gpt-4o"
    reasoning_model: str = "o1"
    fallback_model: str = "claude-3-5-sonnet"
    
    # Logging
    log_level: str = "INFO"
    debug: bool = False
    
    # Workflow
    session_id: str = "session_default"
    max_iterations: int = 10
    timeout_seconds: int = 3600
    
    # Storage
    local_data_dir: str = "./data"
    artifacts_dir: str = "./artifacts"
    logs_dir: str = "./logs"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def __init__(self, **data):
        super().__init__(**data)
        # Create directories if they don't exist
        Path(self.local_data_dir).mkdir(parents=True, exist_ok=True)
        Path(self.artifacts_dir).mkdir(parents=True, exist_ok=True)
        Path(self.logs_dir).mkdir(parents=True, exist_ok=True)


def load_config() -> ChronicleConfig:
    """Load configuration from environment."""
    return set_config(ChronicleConfig())


def set_config(config: ChronicleConfig) -> ChronicleConfig:
    """Set the configuration singleton and return it."""
    global _config
    _config = config
    return config


# Singleton config instance
_config: Optional[ChronicleConfig] = None


def get_config() -> ChronicleConfig:
    """Get or create the configuration singleton."""
    global _config
    if _config is None:
        _config = load_config()
    return _config
