from src.config.settings import settings
import alpaca_trade_api as tradeapi
from src.schemas.trade import TradeResult, TradeRequest
from datetime import datetime


class AlpacaBrokerClient:
    def __init__(self):
        self.client = tradeapi.REST(
            key_id=settings.ALPACA_API_KEY,
            secret_key=settings.ALPACA_API_SECRET,
            base_url=settings.ALPACA_BASE_URL,
        )

    @staticmethod
    def _format_for_alpaca(dt: datetime) -> str:
        # Returns string like '2025-06-19T17:51:00Z' (no ms, always Z)
        if dt is None:
            return None
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    def get_account_info(self):
        try:
            account = self.client.get_account()
            return account._raw
        except Exception as e:
            print(f"Error in get_account_info: {e}")
            raise

    def get_trade_status(self, order_id: str):
        try:
            order = self.client.get_order(order_id)
            return TradeResult(
                status=order.status, order_id=order_id, detail=order._raw
            )
        except Exception as e:
            print(f"Error in get_trade_status: {e}")
            raise

    def submit_trade(self, order: TradeRequest):
        params = dict(
            symbol=order.symbol,
            qty=order.quantity,
            side=order.action,
            type=order.order_type,
            time_in_force="gtc",
        )
        if order.order_type in ("limit", "stop") and order.price is not None:
            params["limit_price"] = order.price

        try:
            alpaca_order = self.client.submit_order(**params)
            return TradeResult(
                status="submitted", order_id=alpaca_order.id, detail=alpaca_order._raw
            )
        except Exception as e:
            print(f"Error in submit_trade: {e}")
            raise

    def list_trades(
        self,
        status: str = None,
        limit: int = None,  # Alpaca's default is 50 if None, matching original behavior
        after: datetime = None,
        until: datetime = None,
        direction: str = None,  # 'asc' or 'desc'
        nested: bool = None,
        symbols: list[str] = None,  # List of symbols to filter by
    ):
        try:
            # Preserve the original behavior: if status is None, default to "all"
            actual_status = status if status is not None else "all"

            after_str = self._format_for_alpaca(after) if after else None
            until_str = self._format_for_alpaca(until) if until else None

            orders = self.client.list_orders(
                status=actual_status,
                limit=limit,
                after=after_str,
                until=until_str,
                direction=direction,
                nested=nested,
                symbols=symbols,
            )
            return [order._raw for order in orders]
        except Exception as e:
            print(f"Error in list_trades: {e}")
            raise


if __name__ == "__main__":
    client = AlpacaBrokerClient()
    try:
        account_info = client.get_account_info()
        print(f"Account Info: {account_info}")
    except Exception as e:
        print(f"Error fetching account info: {e}")

    # You must ensure TradeRequest matches the expected constructor signature:
    trade_request = TradeRequest(
        action="buy", symbol="GOOGL", quantity=1, order_type="market", price=None
    )
    try:
        trade_result = client.submit_trade(trade_request)
        print(f"Trade Result: {trade_result}")
    except Exception as e:
        print(f"Error submitting trade: {e}")

    try:
        trade_status = client.get_trade_status(trade_result.order_id)
        print(f"Trade Status: {trade_status}")
    except Exception as e:
        print(f"Error fetching trade status: {e}")
