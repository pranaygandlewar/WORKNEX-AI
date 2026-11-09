import sys
import argparse

def main():
    parser = argparse.ArgumentParser(
        description="WORKNEX AI — AI-Powered Enterprise Workflow & Resource Management Platform"
    )
    parser.add_argument(
        "command",
        nargs="?",
        default="server",
        choices=["server", "mcp", "mcp-stdio", "seed", "test"],
        help="Command to execute: 'server' (FastAPI REST API), 'mcp' (FastMCP Streamable HTTP), 'mcp-stdio' (Claude Desktop), 'seed', or 'test'"
    )
    parser.add_argument("--host", default="0.0.0.0", help="Host binding (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8000, help="Port binding (default: 8000)")
    args = parser.parse_args()

    if args.command == "server":
        import uvicorn
        print(f"Starting WORKNEX AI Enterprise API Server on http://{args.host}:{args.port}...")
        uvicorn.run("backend.app.main:app", host=args.host, port=args.port, reload=True)

    elif args.command == "mcp":
        import os
        from src.server import mcp
        print(f"Starting WORKNEX AI FastMCP Streamable HTTP Server on http://{args.host}:{args.port}/mcp...")
        mcp.run(transport="streamable-http")

    elif args.command == "mcp-stdio":
        from src.server import mcp
        print("Starting WORKNEX AI FastMCP stdio transport (for Claude Desktop)...")
        mcp.run()

    elif args.command == "seed":
        from backend.app.models import Base
        from backend.app.core.seed import seed_database
        from src.db import engine, SessionLocal
        print("Creating tables and seeding demonstration database...")
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            seed_database(db)
        print("Seeding completed successfully!")

    elif args.command == "test":
        import pytest
        print("Executing WORKNEX AI automated test suite...")
        sys.exit(pytest.main(["-v"]))

if __name__ == "__main__":
    main()
