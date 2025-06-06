from src.clients.broker import AlpacaBrokerClient
from src.schemas.trade import TradeRequest
from datetime import datetime  # For type hints

broker_client = AlpacaBrokerClient()


def submit_trade(order: TradeRequest):
    return broker_client.submit_trade(order)


def get_trade_status(order_id: str):
    return broker_client.get_trade_status(order_id)


def get_account_info():
    return broker_client.get_account_info()


def list_trades(
    status: str = None,
    limit: int = None,
    after: datetime = None,
    until: datetime = None,
    direction: str = None,
    nested: bool = None,
    symbols: list[str] = None,
):
    return broker_client.list_trades(
        status=status,
        limit=limit,
        after=after,
        until=until,
        direction=direction,
        nested=nested,
        symbols=symbols,
    )
