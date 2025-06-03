from pydantic import BaseModel
from typing import Optional
from enum import Enum


class ActionEnum(str, Enum):
    buy = "buy"
    sell = "sell"


class OrderTypeEnum(str, Enum):
    market = "market"
    limit = "limit"
    stop = "stop"


class TradeRequest(BaseModel):
    action: ActionEnum
    symbol: str
    quantity: int
    order_type: OrderTypeEnum = OrderTypeEnum.market
    price: Optional[float] = None


class TradeResult(BaseModel):
    status: str
    order_id: str
    detail: dict
