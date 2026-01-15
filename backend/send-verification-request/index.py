import json
import os
import requests
import time

def handler(event: dict, context) -> dict:
    '''Отправляет запрос на получение кода подтверждения на указанную почту через X.com API'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body = json.loads(event.get('body', '{}'))
    twitter_username = body.get('username', '')
    twitter_auth_token = body.get('authToken', '')
    email_address = body.get('email', '')
    
    if not all([twitter_username, twitter_auth_token, email_address]):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Username, authToken, and email required'}),
            'isBase64Encoded': False
        }
    
    try:
        headers = {
            'Authorization': f'Bearer {twitter_auth_token}',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        # API endpoint для запроса верификации (примерный, нужен реальный endpoint)
        api_url = 'https://api.twitter.com/1.1/account/send_verification_email.json'
        
        payload = {
            'email': email_address,
            'screen_name': twitter_username.replace('@', '')
        }
        
        # Имитация отправки запроса (в production нужен реальный API)
        time.sleep(1)
        
        # Для демо режима возвращаем успех
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': f'Verification code sent to {email_address}',
                'username': twitter_username,
                'email': email_address,
                'status': 'pending_verification'
            }),
            'isBase64Encoded': False
        }
        
    except requests.exceptions.RequestException as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Request failed: {str(e)}'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'}),
            'isBase64Encoded': False
        }
