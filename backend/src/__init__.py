from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from src.endpoints import ask, trade

app = FastAPI(
    title="Trading API",
    description="API for trading operations and LLM interactions",
    version="1.0.0",
)

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the endpoints
app.include_router(ask.router, prefix="/ask", tags=["Ask"])
app.include_router(trade.router, prefix="/trade", tags=["Trade"])


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
