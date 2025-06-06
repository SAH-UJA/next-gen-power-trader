from fastapi import APIRouter, HTTPException
from src.schemas.trade import TradeRequest, TradeResult
from src.services.trade_service import (
    submit_trade,
    get_trade_status,
    get_account_info,
    list_trades,
)

router = APIRouter()


@router.post("/submit", response_model=TradeResult)
async def submit_trade_endpoint(order: TradeRequest):
    try:
        return submit_trade(order)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{order_id}", response_model=TradeResult)
async def get_trade_status_endpoint(order_id: str):
    try:
        print(f"Fetching status for order ID: {order_id}")
        return get_trade_status(order_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Order not found: {e}")


@router.get("/accountInfo")
async def get_account():
    try:
        return get_account_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trades")
async def list_trades_endpoint(status: str = None, limit: int = 50):
    """
    List all trades/orders executed via Alpaca.
    Optional query params:
      - status: Filter by order status (e.g., 'all', 'closed', 'open')
      - limit: Max number of orders to return (default 50)
    """
    try:
        return list_trades(status=status, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
