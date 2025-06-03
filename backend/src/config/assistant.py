TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_account_info",
            "description": "Retrieve account information through which the assistant can trade and interact with the Alpaca API.",
            "parameters": {},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "submit_trade",
            "description": "Place a trade order with the Alpaca API.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["buy", "sell"],
                        "description": "The action to perform: 'buy' or 'sell'.",
                    },
                    "symbol": {
                        "type": "string",
                        "description": "The stock ticker symbol (uppercase).",
                    },
                    "quantity": {
                        "type": "integer",
                        "description": "The number of shares to trade.",
                    },
                    "order_type": {
                        "type": "string",
                        "enum": ["market", "limit", "stop"],
                        "default": "market",
                        "description": (
                            "The type of order to place. "
                            "'market' for immediate execution, "
                            "'limit' for a specific price, "
                            "'stop' for stop-loss orders."
                        ),
                    },
                    "price": {
                        "type": ["number", "null"],
                        "description": (
                            "The price for limit or stop orders. "
                            "'null' if not applicable."
                        ),
                    },
                },
                "required": ["action", "symbol", "quantity"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_trade_status",
            "description": "Check the status of a specific trade order by its ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "string",
                        "description": "The unique identifier for the trade order.",
                    },
                },
                "required": ["order_id"],
            },
        },
    },
]
