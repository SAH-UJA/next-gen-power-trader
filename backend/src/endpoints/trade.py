from fastapi import APIRouter, HTTPException
from src.schemas.trade import TradeRequest, TradeResult
from src.clients.broker import AlpacaBrokerClient

router = APIRouter()
broker_client = AlpacaBrokerClient()


@router.post("/submit", response_model=TradeResult)
async def submit_trade(order: TradeRequest):
    try:
        return broker_client.submit_trade(order)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{order_id}", response_model=TradeResult)
async def get_trade_status(order_id: str):
    try:
        print(f"Fetching status for order ID: {order_id}")
        return broker_client.get_trade_status(order_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Order not found: {e}")


@router.get("/accountInfo")
async def get_account():
    try:
        return broker_client.get_account_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
