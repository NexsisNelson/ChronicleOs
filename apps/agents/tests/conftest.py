from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[3]
AGENTS_ROOT = ROOT / "apps" / "agents"
ADAPTER_SRC = ROOT / "packages" / "memwal-adapter" / "src"

for path in (ROOT, AGENTS_ROOT, ADAPTER_SRC):
    path_str = str(path)
    if path_str not in sys.path:
        sys.path.insert(0, path_str)
