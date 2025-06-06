from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from src.schemas.trade import TradeRequest, TradeResult
from src.services.trade_service import (
    submit_trade,
    get_trade_status,
    get_account_info,
    list_trades,
)

router = APIRouter()


def parse_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    if dt_str is None:
        return None
    # Replace 'Z' with '+00:00' for UTC compatibility with fromisoformat
    if dt_str.endswith("Z"):
        dt_str = dt_str[:-1] + "+00:00"
    return datetime.fromisoformat(dt_str)


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
async def list_trades_endpoint(
    status: Optional[str] = Query(None),
    limit: Optional[int] = Query(None),
    after: Optional[str] = Query(None),  # Accept as string!
    until: Optional[str] = Query(None),  # Accept as string!
    direction: Optional[str] = Query(None, regex="^(asc|desc)?$"),
    nested: Optional[bool] = Query(None),
    symbols: Optional[List[str]] = Query(None),
):
    try:
        after_dt = parse_datetime(after)
        until_dt = parse_datetime(until)
        return list_trades(
            status=status,
            limit=limit,
            after=after_dt,
            until=until_dt,
            direction=direction,
            nested=nested,
            symbols=symbols,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
