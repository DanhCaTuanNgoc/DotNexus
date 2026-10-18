"""
DotNexus Gateway API Module Entry Point (alias for engine.server)
"""

from engine.server import run_server, app

if __name__ == "__main__":
    run_server()
