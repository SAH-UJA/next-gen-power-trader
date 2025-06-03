from src.config.settings import settings
import alpaca_trade_api as tradeapi
from src.schemas.trade import TradeResult, TradeRequest


class AlpacaBrokerClient:
    def __init__(self):
        self.client = tradeapi.REST(
            key_id=settings.ALPACA_API_KEY,
            secret_key=settings.ALPACA_API_SECRET,
            base_url=settings.ALPACA_BASE_URL,
        )

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
