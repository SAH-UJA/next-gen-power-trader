from src.clients.broker import AlpacaBrokerClient
from src.schemas.trade import TradeRequest

broker_client = AlpacaBrokerClient()


def submit_trade(order: TradeRequest):
    return broker_client.submit_trade(order)


def get_trade_status(order_id: str):
    return broker_client.get_trade_status(order_id)


def get_account_info():
    return broker_client.get_account_info()


def list_trades(status: str = None, limit: int = 50):
    return broker_client.list_trades(status=status, limit=limit)
