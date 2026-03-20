import sys
sys.path.append('d:/coding/airia/backend')
from automation import send_transaction_completed_email

item = {
    "type": "bill",
    "name": "Electricity Test",
    "amount": 1500,
    "currency": "INR",
}
send_transaction_completed_email(item, "0x123abc456def7890")
print("Test completed.")
