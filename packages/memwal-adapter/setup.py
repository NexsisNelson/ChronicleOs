from setuptools import setup, find_packages

setup(
    name="memwal-adapter",
    version="0.1.0",
    description="MemWal integration adapter for AI frameworks (LangChain, LangGraph, AutoGen)",
    python_requires=">=3.10",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "httpx>=0.25.0",
        "pydantic>=2.5.0",
        "python-dotenv>=1.0.0",
    ],
    extras_require={
        "langchain": ["langchain>=0.1.0"],
        "langgraph": ["langgraph>=0.1.0"],
        "autogen": ["pyautogen>=0.2.0"],
        "dev": [
            "pytest>=7.4.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "ruff>=0.1.0",
            "mypy>=1.5.0",
        ],
    },
    author="ChronicleOS Team",
    url="https://github.com/chronicle-os/memwal-adapter",
    project_urls={
        "Homepage": "https://github.com/chronicle-os/memwal-adapter",
        "Documentation": "https://memwal-adapter.readthedocs.io",
        "Repository": "https://github.com/chronicle-os/memwal-adapter.git",
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "Operating System :: OS Independent",
    ],
)
