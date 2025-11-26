import requests

# Set your parameters
url = "http://sms.ahoorasms.ir/smsws/HttpService.ashx"
params = {
    "service": "SendArray",
    "username": "pakchoob",
    "password": "pak@@1402",
    "to": "09903515933",  # e.g., "09123456789"
    "message": "Hello, World!",
    "from": "90005026",  # e.g., "10001234"
    "flash": "true",         # or "true"
    "chkMessageId": "CheckingMessageID"
}

# Send the GET request
response = requests.get(url, params=params)

# Print the response from the server
print(response.text)